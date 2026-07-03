# Recommendation Logic — Laffy

Deterministic and explainable. Every score change has a reason; every excluded product has a reason.

## Inputs

`AssessmentInput` from `src/lib/recommendation.ts`:

```
goals: ConcernTag[]          // up to 4, ordered by priority
skinFeel: SkinFeel | "unsure"
sensitivity: Sensitivity | "unsure"
allergies: string[]          // ingredient keys to avoid
fragranceFreeOnly: boolean
pregnancyMode: boolean
budget: "value" | "balanced" | "premium"
scan?: ScanSignals           // optional, only used when reliable
```

## Hard filters (exclude product entirely)

1. `!inStock`
2. `fragranceFreeOnly && !p.fragranceFree`
3. Any user-listed allergy ingredient present in the product
4. `pregnancyMode` and product contains any of: `retinoid`, `retinol`, `retinal`, `tretinoin`, `salicylic-acid`, `hydroquinone`, `high-dose-aha`, or `!pregnancySafe`
5. `sensitivity !== "unsure"` and product does not list that sensitivity tier

Each exclusion attaches a human-readable `excludedReason`.

## Soft scoring

- **+25** for skin-feel match, **−5** for mismatch.
- **+30..+10** per matched goal, weighted by goal priority (`Math.max(30 - idx * 6, 10)`).
- **+6** within budget ceiling (value $26, balanced $38, premium ∞); penalty above.
- **+10/+10/+8/+8** for high-confidence scan signals (shine / redness / texture / dark spots) when the matching concern tag is present.
- **+2** small fragrance-free boost when the user wants fragrance-free.

## Routine assembly

- AM: `cleanser → optional serum → moisturizer → sunscreen` (≤ 5 steps).
- PM: `cleanser → treatment (exfoliant / evening-serum / barrier / spot) → moisturizer` (≤ 5 steps).
- Serum slot chosen from a priority list driven by the user's goals.
- `pickWithoutActiveConflict` enforces the strong-active conflict groups — never two from the same group across the whole routine.

## Strong-active conflict groups

Defined in `STRONG_ACTIVE_GROUPS`:

1. `retinoid`, `bakuchiol` (we are retinoid-free; bakuchiol grouped for safety)
2. AHAs / BHAs / PHAs / mandelic / salicylic — only one per routine
3. Vitamin-C derivative / ascorbic acid — only one per routine

When a step adds a strong active to `usedActives`, later candidate products in the same group are skipped.

## Patch-test notes

Any selected product whose ingredient list contains a strong active gets the `patchTestNote: "Contains an active ingredient — start every other day."` Every routine also surfaces three universal notes (one new product at a time, patch test 24–48 hrs, this is cosmetic not medical).

## Guardrails

- Pregnancy mode → visible guardrail message.
- High sensitivity → visible guardrail explaining gentler weighting.
- No strong actives selected at all → visible guardrail explaining the focus is on the basics.

## Scan integration

- If `scan && !scan.reliable`, a note tells the user the routine is questionnaire-weighted.
- If `scan.reliable`, signals add weighted bonuses to matching concern-tagged products. Bonuses are bounded so a noisy scan can never override a clear questionnaire answer.

## What this engine deliberately does NOT do

- Diagnose any condition.
- Recommend prescription ingredients (tretinoin, hydroquinone, antibiotics).
- Stack multiple strong actives in one routine.
- Penalize users for skin tone, age, or photo identity in any way.
