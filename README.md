# Laffy

A scan-first AI skincare guidance app with explicit photo consent, face-zone analysis, product recommendations, and local data controls.

This build includes the core scan flow, browser-side face detection and image analysis, questionnaire context, a deterministic recommendation engine, a report dashboard, an admin scan-quality view, legal templates, and a small test suite. Accounts, real checkout, and production admin auth are not built yet.

> Cosmetic guidance only. Not medical advice. Laffy does not sell face photos, biometric identifiers, biometric templates, or individual skin profiles.

## Quick Start

```bash
npm install
npm run dev
npm run test
npm run build
```

## Phase 1 Features

- Design system with warm ivory, charcoal, sage, and clay semantic tokens (49 shared UI primitives in `src/components/ui`).
- Scan-focused landing page with example results, before/after-style progress storytelling, reviews, and product-plan preview.
- No optional cookie UI in the current app. Necessary local storage supports consent, scan progress, questionnaire answers, and local data controls.
- Age gate for adults 18+.
- Separate Face-Scan Consent screen with an unchecked required checkbox before camera or upload access.
- Browser-side face detection (`src/lib/faceDetection.ts`) using the native `FaceDetector` API where available, with status states for no-face / multiple-faces / low-light / blurry.
- Browser-side cosmetic image analysis using Canvas/pixel math (`src/lib/imageAnalysis.ts`, `src/lib/skinAnalysis.ts`):
  - Lighting, blur, framing, and overexposure quality gates.
  - Surface-shine, redness-color, texture-variance, and dark-spot-contrast proxies.
  - Quality-gated reliability flag so low-quality scans fall back to questionnaire-only weighting.
  - No biometric templates, facial recognition, identity matching, age/gender/ethnicity inference, emotion detection, or attractiveness scoring.
- Habit-focused questionnaire for skin type, current routine, consistency, sensitivity, goal, routine depth preference, and budget.
- Deterministic recommendation engine (`src/lib/recommendation.ts`) with ingredient-conflict rules, sensitivity safeguards, pregnancy-conservative filtering, scan integration when reliable, per-step explanations, and alternatives.
- Product catalog (`src/lib/products.ts`, `src/lib/productCatalog.ts`) combining a fictional in-house brand line (48 SKUs, e.g. "Aera", "Folde") with a separate reference catalog of real third-party products (e.g. CeraVe, Cetaphil, La Roche-Posay, The Ordinary) used for demo comparison purposes — see [Catalog Data Sourcing](#catalog-data-sourcing) below.
- Privacy Center with consent view, revoke, aggregate toggle, scan deletion, CSV/JSON export, and delete-all-local-data flow.
- Local export helper at `src/lib/dataExport.ts` for structured consent, questionnaire, and cosmetic scan metric exports. It explicitly marks raw photos, face geometry, biometric identifiers, and biometric templates as excluded.
- Admin scan-quality dashboard (`src/pages/AdminQuality.tsx`, `src/lib/adminQuality.ts`) for reviewing scan success/failure signals — no authentication gate yet, not production-ready.
- Legal template pages marked for attorney review.
- Unit and component tests with Vitest and Testing Library.

## Catalog Data Sourcing

The product catalog mixes two sources:

- **`src/lib/products.ts`** — a fictional in-house brand line built for this demo. Brand names, pricing, and wholesale costs are made up.
- **`src/data/marketProductCatalog.ts`** — real third-party products (real brand names, real product names, links to the brand's own product pages, approximate public pricing). No product images are scraped or hosted; only text data and outbound links.

This is a demo reference catalog, not a live retail integration, and the real-brand entries have not been reviewed for trademark or affiliate-linking compliance. Treat this as a known open item before any public launch.

## Test Commands

```bash
npm run test
npm run test:watch
```

Tests currently live in `src/test/` (`product-flow.test.tsx`, `example.test.ts`). Coverage is early-stage — it exercises the core product flow, not every module listed above.

## Project Layout

```text
src/
  lib/
    products.ts            # Fictional in-house product catalog
    productCatalog.ts      # Catalog/bundle abstraction
    recommendation.ts      # Deterministic ingredient scoring + routine logic
    imageAnalysis.ts       # Browser-side canvas pixel-math engine
    faceDetection.ts       # Browser-side face detection wrapper
    skinAnalysis.ts        # Scan signal extraction built on imageAnalysis
    adminQuality.ts        # Scan-quality record types for the admin view
    economics.ts           # Gross margin & unit pricing logic
    consent.ts             # State machine for explicit user consent
    dataExport.ts          # Local CSV/JSON data portability helpers
    reviews.ts             # Seeded review data
    utils.ts
  data/
    marketProductCatalog.ts  # Real third-party reference product data
  state/
    AssessmentContext.tsx  # Global React Context tracking assessment state
  hooks/                  # use-mobile, use-toast
  components/
    Layout.tsx
    NavLink.tsx
    ReviewsSection.tsx
    CustomCursor.tsx
    ui/                   # 49 shared design-system primitives
  pages/                  # AgeGate -> Consent -> Capture -> Questionnaire -> Analyzing -> Results
    Index.tsx
    HowItWorks.tsx
    Pricing.tsx
    AgeGate.tsx
    Consent.tsx
    Capture.tsx
    Questionnaire.tsx
    Analyzing.tsx
    Results.tsx
    PrivacyCenter.tsx
    AdminQuality.tsx
    Legal.tsx
    NotFound.tsx
  test/
    product-flow.test.tsx
    example.test.ts
docs/
  PRIVACY-BY-DESIGN.md
  RECOMMENDATION-LOGIC.md
```

## Data Retention Behavior

- Raw face photos are not persisted. They are analyzed in-browser; only numeric cosmetic signals ever leave the canvas.
- Scan signals stay in memory only unless the user explicitly opts in to Save Scan History. Even then, Phase 1 stores only derived signals locally.
- Consent, questionnaire answers, and optional scan history live in localStorage keys: `lumaroutine.consent.v1`, `lumaroutine.assessment.v1`, `lumaroutine.scan.v1`.
- CSV and JSON exports are generated locally in the browser and include no raw photos, face geometry, biometric identifiers, or biometric templates.

## Phase 2 Scope

- Backend auth, database, and row-level security.
- Real product catalog, inventory, supplier, and checkout adapters (and resolving the real-brand catalog sourcing question above).
- Real Stripe checkout.
- Account dashboard for pause, skip, cancel, and frequency changes.
- Authenticated admin dashboard (current `AdminQuality` view has no access control).
- E2E Playwright happy paths and cross-user security tests.
- Broader automated test coverage.

## Launch Caveats

- The browser-side image analysis produces approximate visual signals only, affected by lighting, camera, makeup, and skin tone. It is not a medical measurement and does not diagnose any condition.
- Legal text in `src/pages/Legal.tsx` is a template and must be reviewed and rewritten by qualified counsel before production launch.
- Pregnancy-conservative filtering is a cosmetic ingredient filter, not medical advice. Users should talk with their clinician.
- The real-brand entries in `src/data/marketProductCatalog.ts` are demo reference data only and have not cleared a cosmetic-claims or trademark review; do not treat this catalog as launch-ready.
