// Deterministic, explainable cosmetic recommendation engine.
// No medical claims. No diagnosis. All outputs are cosmetic guidance.

import { Product, PRODUCTS, ConcernTag, SkinFeel, Sensitivity, Category } from "./products";

export interface AssessmentInput {
  goals: ConcernTag[];                  // ordered by priority
  skinFeel: SkinFeel | "unsure";
  habits: {
    cleanser: boolean;
    moisturizer: boolean;
    sunscreen: boolean;
    exfoliate: boolean;
    acneTreatments: boolean;
  };
  routineConsistency: "rarely" | "sometimes" | "most-days" | "daily";
  mainGoal: ConcernTag | "simple-routine" | "";
  routinePreference: "simple" | "standard" | "complete";
  sensitivity: Sensitivity | "unsure";
  allergies: string[];                  // ingredient keys to avoid
  fragranceFreeOnly: boolean;
  pregnancyMode: boolean;               // conservative cosmetic filter
  budget: BudgetTier;
  scan?: ScanSignals;                   // optional cosmetic image signals
}

export type BudgetTier = "low" | "mid" | "high" | "flexible";

export type ScanSeverity = "Clear" | "Low" | "Mild" | "Moderate";

export interface FaceZoneInsight {
  zone: "Forehead" | "Nose" | "Left cheek" | "Right cheek" | "Chin" | "Under-eye area";
  observation: string;
  severity: ScanSeverity;
  focus: string;
  explanation: string;
}

export interface ScanScores {
  overall: number;
  clarity: number;
  texture: number;
  oilShine: number;
  redness: number;
  toneEvenness: number;
  routineMatch: number;
}

export interface ScanSignals {
  quality: number;     // 0..1, overall capture quality
  shine: number;       // 0..1, surface-shine proxy
  redness: number;     // 0..1, redness-color proxy
  texture: number;     // 0..1, variance proxy
  darkSpots: number;   // 0..1, contrast proxy
  reliable: boolean;   // quality gate
  faceDetected?: boolean;
  sessionId?: string;
  capturedAt?: string;
  imageReference?: string | null;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  zones?: FaceZoneInsight[];
  scores?: ScanScores;
  suggestedRoutineFocus?: string[];
  recommendedHabits?: string[];
  analysisProvider?: "local-browser" | "external-agent";
  qualityDetail?: {
    lighting: number;
    blur: number;
    framing: number;
    overexposed: boolean;
    overall: number;
    reliable: boolean;
    issues: string[];
  };
}

export interface ScoredProduct {
  product: Product;
  score: number;
  reasons: string[];
  excludedReason?: string;
}

export interface RoutineStep {
  step: number;
  category: Category;
  product: Product;
  reasons: string[];
  alternatives: Product[];
  patchTestNote?: string;
}

export interface Routine {
  am: RoutineStep[];
  pm: RoutineStep[];
  totalRetail: number;
  notes: string[];
  guardrails: string[];
}

// Ingredient conflict groups — never recommend two from the same strong-active group in one routine.
const STRONG_ACTIVE_GROUPS: string[][] = [
  ["retinoid", "retinol", "retinal", "adapalene", "bakuchiol"],
  ["aha", "bha", "pha-gluconolactone", "mandelic-acid", "lactic-acid", "glycolic-acid", "salicylic-acid"],
  ["benzoyl-peroxide"],
  ["vitamin-c-derivative", "ascorbic-acid"],
];

// Pregnancy-conservative cosmetic exclusions (NOT medical advice).
const PREGNANCY_EXCLUDE_INGREDIENTS = new Set([
  "retinoid", "retinol", "retinal", "tretinoin",
  "adapalene",
  "salicylic-acid",          // exclude leave-on >2%
  "benzoyl-peroxide",
  "hydroquinone",
  "high-dose-aha",
]);

export function recommend(input: AssessmentInput): Routine {
  const candidates: ScoredProduct[] = PRODUCTS.map((p) => scoreProduct(p, input));
  const eligible = candidates.filter((c) => !c.excludedReason).sort((a, b) => b.score - a.score);
  const effectiveGoals = getPrioritizedConcerns(input);

  // Group by category
  const byCat = new Map<Category, ScoredProduct[]>();
  for (const c of eligible) {
    const arr = byCat.get(c.product.category) ?? [];
    arr.push(c);
    byCat.set(c.product.category, arr);
  }

  const am: RoutineStep[] = [];
  const pm: RoutineStep[] = [];
  const used = new Set<string>();
  const usedActives: string[] = [];

  // AM core: cleanser → optional treatment serum → moisturizer → sunscreen
  pushStep(am, byCat, "cleanser", used, usedActives, 1);

  // AM serum slot: prioritize goals — vitamin-C, niacinamide, azelaic
  const amSerumPref = input.routinePreference === "simple" ? [] : amTreatmentPreference(effectiveGoals);
  for (const cat of amSerumPref) {
    const picked = pickWithoutActiveConflict(byCat, cat, usedActives, used);
    if (picked) { addStep(am, picked, used, usedActives, am.length + 1); break; }
  }

  pushStep(am, byCat, "moisturizer", used, usedActives, am.length + 1);
  pushStep(am, byCat, "sunscreen", used, usedActives, am.length + 1);

  // PM core: cleanser → treatment (exfoliant OR evening-serum OR barrier) → moisturizer
  pushStep(pm, byCat, "cleanser", used, usedActives, 1);

  const pmSerumPref = pmTreatmentPreference(effectiveGoals, input);
  for (const cat of pmSerumPref) {
    const picked = pickWithoutActiveConflict(byCat, cat, usedActives, used);
    if (picked) { addStep(pm, picked, used, usedActives, pm.length + 1); break; }
  }

  if (input.routinePreference === "complete") {
    const extraTreatment = [...amTreatmentPreference(effectiveGoals), ...pmTreatmentPreference(effectiveGoals, input)]
      .find((cat) => !pm.some((step) => step.category === cat));
    if (extraTreatment) {
      const picked = pickWithoutActiveConflict(byCat, extraTreatment, usedActives, used);
      if (picked) addStep(pm, picked, used, usedActives, pm.length + 1);
    }
  }

  pushStep(pm, byCat, "moisturizer", used, usedActives, pm.length + 1);

  // Cap each routine at 5 steps
  const amClipped = am.slice(0, 5);
  const pmClipped = pm.slice(0, 5);
  const allSteps = [...amClipped, ...pmClipped];

  const totalRetail = allSteps.reduce((s, st) => s + st.product.price, 0);

  const notes: string[] = [
    "Start one new product at a time so you can tell what your skin likes.",
    "Patch-test new products on the inner forearm or behind the ear for 24–48 hours.",
    "These are cosmetic suggestions, not medical advice.",
  ];
  if (!input.habits.sunscreen) {
    notes.push("Daily SPF is the highest-impact habit to add for tone-evenness and long-term visible clarity.");
  }
  if (!input.habits.moisturizer && (input.skinFeel === "dry" || (input.scan?.texture ?? 0) > 0.55)) {
    notes.push("A consistent moisturizer will help support a smoother-looking, more comfortable barrier.");
  }
  if (input.routineConsistency === "rarely") {
    notes.push("Keep the first version simple: cleanser, moisturizer, SPF, then add one targeted treatment.");
  }
  if (!input.scan?.reliable && input.scan) {
    notes.push("Your photo quality was a bit low — your routine is weighted toward your questionnaire answers.");
  }

  const guardrails: string[] = [];
  if (input.pregnancyMode) {
    guardrails.push("Pregnancy-conservative cosmetic filter is on — stronger ingredients have been hidden. Talk with your clinician for personal medical guidance.");
  }
  if (input.sensitivity === "high") {
    guardrails.push("Routine prioritized for higher sensitivity: gentler textures and fewer strong actives.");
  }
  if (input.habits.exfoliate && input.goals.includes("uneven-texture")) {
    guardrails.push("Because you already exfoliate, avoid stacking multiple exfoliating products in the same week.");
  }
  if (usedActives.length === 0) {
    guardrails.push("No strong actives included — focus is on cleansing, hydration, and SPF.");
  }

  return { am: amClipped, pm: pmClipped, totalRetail: round2(totalRetail), notes, guardrails };
}

function pushStep(
  routine: RoutineStep[],
  byCat: Map<Category, ScoredProduct[]>,
  cat: Category,
  used: Set<string>,
  usedActives: string[],
  step: number,
) {
  const picked = pickWithoutActiveConflict(byCat, cat, usedActives, used);
  if (picked) addStep(routine, picked, used, usedActives, step);
}

function addStep(routine: RoutineStep[], picked: ScoredProduct, used: Set<string>, usedActives: string[], step: number) {
  if (used.has(picked.product.id)) return;
  used.add(picked.product.id);
  for (const ing of picked.product.ingredientKeys) {
    if (isStrongActive(ing)) usedActives.push(ing);
  }
  const alternatives = (PRODUCTS.filter(p => p.category === picked.product.category && p.id !== picked.product.id)).slice(0, 3);
  routine.push({
    step,
    category: picked.product.category,
    product: picked.product,
    reasons: picked.reasons,
    alternatives,
    patchTestNote: hasStrongActive(picked.product.ingredientKeys) ? "Contains an active ingredient — start every other day." : undefined,
  });
}

function pickWithoutActiveConflict(
  byCat: Map<Category, ScoredProduct[]>,
  cat: Category,
  usedActives: string[],
  used?: Set<string>,
): ScoredProduct | undefined {
  const list = byCat.get(cat);
  if (!list) return undefined;
  for (const c of list) {
    if (used?.has(c.product.id)) continue;
    if (!conflicts(c.product.ingredientKeys, usedActives)) return c;
  }
  return undefined;
}

export function conflicts(productIngredients: string[], usedActives: string[]): boolean {
  for (const group of STRONG_ACTIVE_GROUPS) {
    const usedInGroup = usedActives.filter((a) => group.includes(a));
    const productInGroup = productIngredients.filter((a) => group.includes(a));
    if (usedInGroup.length > 0 && productInGroup.length > 0) {
      // Allow same ingredient duplicate? No — never two from the same strong-active group.
      const overlap = productInGroup.some((a) => !usedInGroup.includes(a)) || productInGroup.some((a) => usedInGroup.includes(a));
      if (overlap) return true;
    }
  }
  return false;
}

function isStrongActive(ing: string): boolean {
  return STRONG_ACTIVE_GROUPS.some((g) => g.includes(ing));
}
function hasStrongActive(ings: string[]): boolean {
  return ings.some(isStrongActive);
}

export function scoreProduct(p: Product, input: AssessmentInput): ScoredProduct {
  const reasons: string[] = [];

  // Hard filters
  if (!p.inStock) return { product: p, score: 0, reasons: [], excludedReason: "Out of stock" };
  if (input.fragranceFreeOnly && !p.fragranceFree) return { product: p, score: 0, reasons: [], excludedReason: "You asked for fragrance-free" };
  for (const allergy of input.allergies) {
    if (p.ingredientKeys.includes(allergy)) {
      return { product: p, score: 0, reasons: [], excludedReason: `Avoids your listed ingredient: ${allergy}` };
    }
  }
  if (input.pregnancyMode) {
    for (const ing of p.ingredientKeys) {
      if (PREGNANCY_EXCLUDE_INGREDIENTS.has(ing) || !p.pregnancySafe) {
        return { product: p, score: 0, reasons: [], excludedReason: "Hidden by pregnancy-conservative filter" };
      }
    }
  }
  if (input.sensitivity !== "unsure") {
    if (!p.sensitivityFit.includes(input.sensitivity)) {
      return { product: p, score: 0, reasons: [], excludedReason: `Not a fit for ${input.sensitivity} sensitivity` };
    }
  }

  let score = 0;
  const effectiveGoals = getPrioritizedConcerns(input);

  // Skin feel fit
  if (input.skinFeel !== "unsure") {
    if (p.skinFeelFit.includes(input.skinFeel)) { score += 25; reasons.push(`Suits ${input.skinFeel} skin feel`); }
    else { score -= 5; }
  } else {
    if (p.skinFeelFit.includes("balanced")) score += 5;
  }

  // Concern match — weighted by goal priority
  effectiveGoals.forEach((goal, idx) => {
    if (p.concernTags.includes(goal)) {
      const weight = Math.max(34 - idx * 6, 12);
      score += weight;
      reasons.push(`Targets your goal: ${humanize(goal)}`);
    }
  });

  if (input.skinFeel === "dry" && p.concernTags.some((tag) => tag === "hydration" || tag === "barrier")) {
    score += 8;
    reasons.push("Supports comfort for drier-feeling skin");
  }
  if (input.skinFeel === "oily" && p.concernTags.includes("oil-control")) {
    score += 8;
    reasons.push("Balances visible shine without a heavy finish");
  }
  if (input.skinFeel === "combination" && p.skinFeelFit.includes("combination")) {
    score += 6;
    reasons.push("Fits combination skin needs");
  }

  if (!input.habits.cleanser && p.category === "cleanser") {
    score += 12;
    reasons.push("Adds a simple cleansing step you are not using yet");
  }
  if (!input.habits.moisturizer && p.category === "moisturizer") {
    score += 14;
    reasons.push("Adds daily moisturizer support");
  }
  if (!input.habits.sunscreen && p.category === "sunscreen") {
    score += 18;
    reasons.push("Builds in daily SPF, the highest-impact routine gap");
  }
  if (input.habits.acneTreatments && p.concernTags.includes("barrier")) {
    score += 7;
    reasons.push("Balances active use with barrier support");
  }

  if (input.routineConsistency === "rarely") {
    if (["cleanser", "moisturizer", "sunscreen"].includes(p.category)) score += 10;
    if (hasStrongActive(p.ingredientKeys)) score -= 10;
  }
  if (input.routinePreference === "simple" && !["cleanser", "moisturizer", "sunscreen", "spot-care"].includes(p.category)) {
    score -= 6;
  }
  if (input.routinePreference === "complete" && ["vitamin-c-serum", "evening-serum", "barrier-support"].includes(p.category)) {
    score += 5;
  }

  if (input.sensitivity === "high") {
    if (p.fragranceFree && p.concernTags.some((tag) => tag === "barrier" || tag === "visible-redness" || tag === "hydration")) score += 9;
    if (hasStrongActive(p.ingredientKeys)) score -= 10;
  }

  // Scan signals — only if reliable
  if (input.scan?.reliable) {
    if (input.scan.shine > 0.6 && p.concernTags.includes("oil-control")) { score += 10; reasons.push("Photo suggested visible surface shine"); }
    if (input.scan.redness > 0.6 && p.concernTags.includes("visible-redness")) { score += 10; reasons.push("Photo suggested visible redness"); }
    if (input.scan.texture > 0.6 && p.concernTags.includes("uneven-texture")) { score += 8; reasons.push("Photo suggested uneven-looking texture"); }
    if (input.scan.darkSpots > 0.6 && p.concernTags.includes("dark-spot-appearance")) { score += 8; reasons.push("Photo suggested visible spots"); }
  }

  // Budget
  const budgetCeiling = input.budget === "low" ? 20 : input.budget === "mid" ? 35 : input.budget === "high" ? 55 : Infinity;
  if (p.price <= budgetCeiling) score += 6;
  else score -= Math.min(15, (p.price - budgetCeiling) * 0.6);
  if (input.budget === "low" && p.brandSegment === "luxury") score -= 20;
  if (input.budget === "mid" && p.price > 65) score -= 12;
  if (input.budget === "high" && p.brandSegment === "drugstore" && !p.concernTags.includes("blemish-prone")) score -= 2;

  // Fragrance preference soft boost
  if (input.fragranceFreeOnly && p.fragranceFree) score += 2;

  return { product: p, score: round2(score), reasons };
}

export function humanize(tag: ConcernTag): string {
  return {
    "hydration": "hydration",
    "oil-control": "surface oil",
    "visible-redness": "visible redness",
    "uneven-texture": "uneven-looking texture",
    "dark-spot-appearance": "appearance of dark spots",
    "blemish-prone": "blemish-prone appearance",
    "sunscreen": "daily SPF",
    "barrier": "barrier comfort",
  }[tag];
}

function getPrioritizedConcerns(input: AssessmentInput): ConcernTag[] {
  const ordered: ConcernTag[] = [];
  const push = (concern: ConcernTag | "" | "simple-routine" | undefined) => {
    if (!concern || concern === "simple-routine") return;
    if (!ordered.includes(concern)) ordered.push(concern);
  };

  push(input.mainGoal);
  input.goals.forEach(push);

  if (input.scan?.reliable) {
    const scanConcerns: Array<[ConcernTag, number]> = [
      ["oil-control", input.scan.shine],
      ["visible-redness", input.scan.redness],
      ["uneven-texture", input.scan.texture],
      ["dark-spot-appearance", input.scan.darkSpots],
    ];
    scanConcerns
      .filter(([, value]) => value > 0.48)
      .sort((a, b) => b[1] - a[1])
      .forEach(([concern]) => push(concern));
  }

  if (!input.habits.sunscreen) push("sunscreen");
  if (input.skinFeel === "dry" || input.skinFeel === "sensitive-any") push("hydration");
  if (input.sensitivity === "high") push("barrier");

  return ordered;
}

function amTreatmentPreference(goals: ConcernTag[]): Category[] {
  const categories: Category[] = [];
  const push = (category: Category) => {
    if (!categories.includes(category)) categories.push(category);
  };

  goals.forEach((goal) => {
    if (goal === "dark-spot-appearance") {
      push("vitamin-c-serum");
      push("azelaic-cosmetic");
      push("niacinamide-serum");
    }
    if (goal === "visible-redness") {
      push("azelaic-cosmetic");
      push("niacinamide-serum");
    }
    if (goal === "oil-control") push("niacinamide-serum");
    if (goal === "blemish-prone") {
      push("azelaic-cosmetic");
      push("niacinamide-serum");
    }
    if (goal === "barrier" || goal === "hydration") push("barrier-support");
  });

  return categories;
}

function pmTreatmentPreference(goals: ConcernTag[], input: AssessmentInput): Category[] {
  const categories: Category[] = [];
  const push = (category: Category) => {
    if (!categories.includes(category)) categories.push(category);
  };

  goals.forEach((goal) => {
    if (goal === "uneven-texture") {
      push(input.sensitivity === "high" ? "barrier-support" : "exfoliant");
      push("evening-serum");
    }
    if (goal === "blemish-prone") {
      push(input.pregnancyMode ? "spot-care" : "azelaic-cosmetic");
      push("spot-care");
      push("evening-serum");
    }
    if (goal === "hydration" || goal === "barrier" || goal === "visible-redness") {
      push("barrier-support");
      push("evening-serum");
    }
    if (goal === "dark-spot-appearance") {
      push("evening-serum");
      push("azelaic-cosmetic");
    }
  });

  push("evening-serum");
  push("barrier-support");
  return categories;
}

function round2(n: number) { return Math.round(n * 100) / 100; }
