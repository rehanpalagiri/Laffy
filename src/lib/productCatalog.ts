import { PRODUCTS, type Category, type ConcernTag, type Product } from "./products";
import {
  scoreProduct,
  type AssessmentInput,
  type BudgetTier,
  type Routine,
  type RoutineStep,
  type ScanSignals,
} from "./recommendation";

export interface CatalogFilters {
  categories?: Category[];
  concerns?: ConcernTag[];
  maxPrice?: number;
  inStockOnly?: boolean;
}

export interface RecommendedProduct {
  product: Product;
  category: Category;
  score: number;
  reasons: string[];
  schedule: "Morning" | "Night" | "Both";
  frequency: string;
  budgetFit: "Fits budget" | "Stretch" | "Flexible pick";
  concernMatch: string;
}

export interface ProductBundle {
  products: RecommendedProduct[];
  individualTotal: number;
  bundlePrice: number;
  serviceValue: number;
  estimatedSavings: number;
  budgetLabel: string;
  budgetMax: number;
  budgetStatus: "Within selected budget" | "Closest fit from current catalog" | "Flexible budget";
  checkoutLabel: string;
}

const BUDGET_MAX: Record<BudgetTier, number> = {
  low: 50,
  mid: 100,
  high: 200,
  flexible: Infinity,
};

const BUDGET_LABEL: Record<BudgetTier, string> = {
  low: "Under $50 total",
  mid: "$50-$100 total",
  high: "$100-$200 total",
  flexible: "Best match, even if it costs more",
};

export async function fetchProductCatalog(filters: CatalogFilters = {}): Promise<Product[]> {
  return filterCatalog(PRODUCTS, filters);
}

export function recommendProducts(
  scanResults: ScanSignals | null,
  questionnaireAnswers: AssessmentInput,
  budgetTier: BudgetTier = questionnaireAnswers.budget,
): RecommendedProduct[] {
  const input = { ...questionnaireAnswers, budget: budgetTier, scan: scanResults ?? undefined };
  return PRODUCTS
    .map((product) => ({ product, scored: scoreProduct(product, input) }))
    .filter(({ scored }) => !scored.excludedReason)
    .sort((a, b) => b.scored.score - a.scored.score)
    .map(({ product, scored }) => toRecommendedProduct(product, scored.score, scored.reasons, budgetTier));
}

export function buildBundle(routine: Routine, budgetTier: BudgetTier, preference: AssessmentInput["routinePreference"] = "standard"): ProductBundle {
  const unique = uniqueRoutineProducts(routine)
    .map((step) => budgetAdjustedStep(step, budgetTier))
    .map((step) => toRecommendedProduct(step.product, 0, step.reasons, budgetTier, step));
  const maxCount = preference === "simple" ? 4 : preference === "complete" ? 8 : 6;
  const budgetMax = BUDGET_MAX[budgetTier];

  const essentialsFirst = sortForBundle(unique);
  let picked = essentialsFirst.slice(0, maxCount);

  if (Number.isFinite(budgetMax)) {
    const essentials = essentialsFirst.filter((item) => ["cleanser", "moisturizer", "sunscreen"].includes(item.category));
    const optional = essentialsFirst.filter((item) => !["cleanser", "moisturizer", "sunscreen"].includes(item.category));
    picked = [];
    for (const item of [...essentials, ...optional]) {
      if (picked.length >= maxCount) break;
      const next = [...picked, item];
      const nextBoxPrice = friendlyBundlePrice(totalOf(next), budgetMax);
      const isEssential = ["cleanser", "moisturizer", "sunscreen"].includes(item.category);
      if (nextBoxPrice <= budgetMax || (picked.length < 2 && isEssential)) picked.push(item);
    }
  }

  const individualTotal = round2(totalOf(picked));
  const serviceValue = 0;
  const bundlePrice = friendlyBundlePrice(individualTotal, budgetMax);
  const estimatedSavings = 0;
  const budgetStatus = budgetTier === "flexible"
    ? "Flexible budget"
    : bundlePrice <= budgetMax
      ? "Within selected budget"
      : "Closest fit from current catalog";

  return {
    products: picked,
    individualTotal,
    bundlePrice,
    serviceValue,
    estimatedSavings,
    budgetLabel: BUDGET_LABEL[budgetTier],
    budgetMax,
    budgetStatus,
    checkoutLabel: "Checkout",
  };
}

export function getBudgetLabel(tier: BudgetTier): string {
  return BUDGET_LABEL[tier];
}

export function getBudgetMax(tier: BudgetTier): number {
  return BUDGET_MAX[tier];
}

function filterCatalog(products: Product[], filters: CatalogFilters): Product[] {
  return products.filter((product) => {
    if (filters.inStockOnly && !product.inStock) return false;
    if (filters.categories && !filters.categories.includes(product.category)) return false;
    if (filters.concerns && !filters.concerns.some((concern) => product.concernTags.includes(concern))) return false;
    if (filters.maxPrice && product.price > filters.maxPrice) return false;
    return true;
  });
}

function uniqueRoutineProducts(routine: Routine): RoutineStep[] {
  const seen = new Set<string>();
  const steps: RoutineStep[] = [];
  for (const step of [...routine.am, ...routine.pm]) {
    if (seen.has(step.product.id)) continue;
    seen.add(step.product.id);
    steps.push(step);
  }
  return steps;
}

function budgetAdjustedStep(step: RoutineStep, budgetTier: BudgetTier): RoutineStep {
  if (budgetTier === "flexible") return step;
  const perItemCeiling = budgetTier === "low" ? 18 : budgetTier === "mid" ? 38 : 65;
  if (step.product.price <= perItemCeiling) return step;

  const preferredConcerns = new Set(step.product.concernTags);
  const replacement = PRODUCTS
    .filter((product) => product.category === step.category && product.inStock && product.price <= perItemCeiling)
    .sort((a, b) => {
      const concernDelta = overlapScore(b.concernTags, preferredConcerns) - overlapScore(a.concernTags, preferredConcerns);
      return concernDelta || a.price - b.price;
    })[0];

  if (!replacement) return step;
  return {
    ...step,
    product: replacement,
    reasons: [`Value-conscious ${step.category.replace(/-/g, " ")} match`, ...step.reasons.slice(0, 2)],
  };
}

function overlapScore(tags: ConcernTag[], preferred: Set<ConcernTag>): number {
  return tags.reduce((score, tag) => score + (preferred.has(tag) ? 1 : 0), 0);
}

function toRecommendedProduct(
  product: Product,
  score: number,
  reasons: string[],
  budgetTier: BudgetTier,
  routineStep?: RoutineStep,
): RecommendedProduct {
  return {
    product,
    category: product.category,
    score,
    reasons: reasons.length > 0 ? reasons : product.highlights.slice(0, 2),
    schedule: scheduleFor(product.category, routineStep),
    frequency: frequencyFor(product.category, product),
    budgetFit: budgetFit(product.price, budgetTier),
    concernMatch: product.concernTags[0] ? concernText(product.concernTags[0]) : "routine support",
  };
}

function scheduleFor(category: Category, step?: RoutineStep): RecommendedProduct["schedule"] {
  if (step?.product.usageWindow) return step.product.usageWindow;
  if (category === "sunscreen" || category === "vitamin-c-serum") return "Morning";
  if (category === "exfoliant" || category === "evening-serum" || category === "spot-care" || category === "barrier-support") return "Night";
  if (step?.category === "sunscreen") return "Morning";
  return "Both";
}

function frequencyFor(category: Category, product?: Product): string {
  if (product?.frequency) return product.frequency;
  if (category === "exfoliant") return "2-3 nights per week";
  if (category === "spot-care") return "As needed";
  if (category === "evening-serum") return "Start 2-3 nights per week";
  if (category === "sunscreen") return "Every morning";
  return "Daily";
}

function budgetFit(price: number, tier: BudgetTier): RecommendedProduct["budgetFit"] {
  if (tier === "flexible") return "Flexible pick";
  const perItem = tier === "low" ? 20 : tier === "mid" ? 35 : 55;
  return price <= perItem ? "Fits budget" : "Stretch";
}

function sortForBundle(products: RecommendedProduct[]): RecommendedProduct[] {
  const priority: Record<Category, number> = {
    cleanser: 1,
    moisturizer: 2,
    sunscreen: 3,
    "niacinamide-serum": 4,
    "azelaic-cosmetic": 5,
    "vitamin-c-serum": 6,
    exfoliant: 7,
    "spot-care": 8,
    "barrier-support": 9,
    "evening-serum": 10,
  };
  return [...products].sort((a, b) => priority[a.category] - priority[b.category] || a.product.price - b.product.price);
}

function totalOf(products: RecommendedProduct[]): number {
  return products.reduce((total, item) => total + item.product.price, 0);
}

function concernText(concern: ConcernTag): string {
  return {
    hydration: "dryness + hydration",
    "oil-control": "shine + oil control",
    "visible-redness": "visible redness",
    "uneven-texture": "texture",
    "dark-spot-appearance": "tone evenness",
    "blemish-prone": "blemish-prone areas",
    sunscreen: "daily protection",
    barrier: "barrier support",
  }[concern];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function friendlyBundlePrice(n: number, budgetMax = Infinity): number {
  if (n <= 0) return 0;
  const rounded = Math.ceil(n / 5) * 5;
  return Number.isFinite(budgetMax) && rounded > budgetMax && n <= budgetMax ? budgetMax : rounded;
}
