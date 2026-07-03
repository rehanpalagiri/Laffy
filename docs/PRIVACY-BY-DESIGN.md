# Privacy by Design - Laffy

Laffy is a skincare-first routine builder with explicit data controls. This document maps each user-facing data commitment to its implementation surface.

## Non-Negotiables

| Commitment | Where it lives |
|---|---|
| Face or scan data is never authorized through cookies or local storage alone | `src/pages/Consent.tsx` is a separate screen with an unchecked checkbox. There is no optional cookie UI in the current app. |
| Raw photos are processed once and deleted by default | `src/pages/Capture.tsx` runs Canvas analysis locally via `analyzeImageFromSource`. The file/image element is never stored. |
| Optional save-history stores derived scan metrics only | `AssessmentContext` writes only `ScanSignals` to `localStorage` under `lumaroutine.scan.v1`, gated on `consent.saveScanHistory`. |
| No facial recognition or biometric templates | `src/lib/imageAnalysis.ts` computes only luminance/color/variance proxies. There is no embedding, template, identity comparison, or face-geometry export. |
| No age/gender/ethnicity/emotion/attractiveness inference | Code does not exist and the out-of-scope behavior is listed in `src/pages/Capture.tsx`. |
| Aggregate contribution is opt-in only | Off by default in `DEFAULT_CONSENT`; surfaced as a separate explicit checkbox on the consent screen. |
| Global Privacy Control is respected | `detectGPC()` in `src/lib/consent.ts`; `saveConsent` keeps analytics off when GPC is detected. Optional analytics UI is not enabled in the current app. |
| Age gate is required before scan consent | `src/pages/AgeGate.tsx` sets `ageConfirmed18` only when the user confirms they are 18+. |

## Data Classes

1. Cosmetic image: used once, in-browser, then released. Never persisted by default.
2. Scan signals: small numeric `ScanSignals` struct. In memory by default; stored only with explicit opt-in for up to 30 days.
3. Questionnaire answers: `AssessmentInput`, persisted in `localStorage` for UX continuity.
4. Consent record: `ConsentState` with timestamps, persisted for audit traceability.
5. Local export bundle: generated on demand by `src/lib/dataExport.ts`.

## Export Contract

The Privacy Center can export CSV or JSON generated locally in the browser. Exports include:

- Consent state: necessary local-storage state, GPC flag, age gate, face-scan consent, scan-history consent, aggregate contribution, and consent timestamp.
- Questionnaire answers: goals, skin feel, sensitivity, allergies, fragrance preference, pregnancy-conservative mode, and budget.
- Cosmetic scan metrics: quality, reliability, shine proxy, redness-color proxy, texture-variance proxy, dark-spot-contrast proxy, lighting, blur, framing, overexposure, and quality issues.
- Safeguard fields: `raw_photo_included=false`, `biometric_identifier_included=false`, `biometric_template_included=false`, `face_geometry_included=false`, and `export_generated_locally=true`.

Exports do not include raw photos, embeddings, face geometry, biometric identifiers, biometric templates, exact location, contact data, or individual records for third-party sale.

## User Rights - Implemented Surface

- View consents: Privacy Center renders the current `ConsentState`.
- Revoke face-scan consent: toggles `faceScan: false` and disables future capture.
- Delete scan data: `setScan(null)` clears memory and removes `lumaroutine.scan.v1`.
- Export data: CSV or JSON download via `buildLocalExportCsv` and `buildLocalExportJson`.
- Delete all local data: `resetConsent() + reset()` wipes local consents, assessment answers, and scan signals.
- Delete all local data: clears the necessary local records used for consent, questionnaire continuity, and optional scan history.

Phase 2 adds database-backed equivalents for these flows through Lovable Cloud RLS.

## Counsel Review Before Launch

- Final wording of all `src/pages/Legal.tsx` pages.
- Jurisdictional health-data classifications, including WA My Health My Data Act, Nevada SB 370, Connecticut DPA, CCPA/CPRA, GDPR/UK GDPR, and any biometric-privacy statutes triggered by future features.
- Cosmetic-claims review of every product highlight and routine explanation.
- DPA, subprocessor list, retention schedule, breach notification timelines, and support workflow.
