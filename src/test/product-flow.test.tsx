import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import Consent from "@/pages/Consent";
import Questionnaire from "@/pages/Questionnaire";
import Results from "@/pages/Results";
import { AssessmentProvider } from "@/state/AssessmentContext";
import { DEFAULT_CONSENT } from "@/lib/consent";
import { INITIAL_FACE_DETECTION } from "@/lib/faceDetection";
import { buildLocalExportCsv } from "@/lib/dataExport";
import { buildStructuredSkinAnalysis } from "@/lib/skinAnalysis";
import { REVIEWS } from "@/lib/reviews";
import { buildBundle } from "@/lib/productCatalog";
import { PRODUCTS } from "@/lib/products";
import type { AnalysisResult } from "@/lib/imageAnalysis";
import { recommend, type AssessmentInput } from "@/lib/recommendation";

const CONSENT_KEY = "lumaroutine.consent.v1";
const SCAN_KEY = "lumaroutine.scan.v1";

const assessment: AssessmentInput = {
  goals: ["oil-control"],
  skinFeel: "combination",
  habits: {
    cleanser: true,
    moisturizer: true,
    sunscreen: false,
    exfoliate: false,
    acneTreatments: false,
  },
  routineConsistency: "sometimes",
  mainGoal: "oil-control",
  sensitivity: "medium",
  allergies: [],
  fragranceFreeOnly: false,
  pregnancyMode: false,
  budget: "mid",
  routinePreference: "standard",
};

const scanSignals: AnalysisResult = {
  quality: 0.82,
  shine: 0.56,
  redness: 0.24,
  texture: 0.36,
  darkSpots: 0.28,
  reliable: true,
  faceDetected: true,
  qualityDetail: {
    lighting: 0.82,
    blur: 0.74,
    framing: 0.8,
    overexposed: false,
    overall: 0.82,
    reliable: true,
    issues: [],
  },
};

function renderInApp(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <AssessmentProvider>{ui}</AssessmentProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("scan-first flow", () => {
  it("requires a completed face scan before final results", () => {
    renderInApp(<Results />);
    expect(screen.getByText(/Start with your face scan/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Start Your Scan/i }).length).toBeGreaterThan(0);
  });

  it("requires explicit photo consent before continuing to the scanner", () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...DEFAULT_CONSENT, ageConfirmed18: true }));
    renderInApp(<Consent />);

    const continueButton = screen.getByRole("button", { name: /Continue to Scan/i });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/I agree to let Laffy process my scan/i));
    expect(continueButton).toBeEnabled();
  });

  it("shows the no-face guidance used by the scanner", () => {
    expect(INITIAL_FACE_DETECTION.message).toMatch(/Laffy will take one photo/i);
  });

  it("renders the revised habit-focused questionnaire after a saved scan", () => {
    const scan = buildStructuredSkinAnalysis(scanSignals, assessment, { sessionId: "scan_test", capturedAt: "2026-06-26T12:00:00.000Z" });
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...DEFAULT_CONSENT, ageConfirmed18: true, faceScan: true, saveScanHistory: true }));
    localStorage.setItem(SCAN_KEY, JSON.stringify(scan));

    renderInApp(<Questionnaire />);
    expect(screen.getByText(/What is your skin type/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByText(/Which habits are already in your routine/i)).toBeInTheDocument();
  });
});

describe("AI report data", () => {
  it("creates strengths-first structured scan results with zones and scores", () => {
    const report = buildStructuredSkinAnalysis(scanSignals, assessment, { sessionId: "scan_test", capturedAt: "2026-06-26T12:00:00.000Z" });

    expect(report.summary).toMatch(/strong foundation/i);
    expect(report.strengths?.[0]).toMatch(/baseline/i);
    expect(report.zones).toHaveLength(6);
    expect(report.scores?.overall).toBeGreaterThan(50);
  });

  it("keeps review ratings realistic and 4 stars or higher", () => {
    expect(REVIEWS.length).toBeGreaterThanOrEqual(50);
    expect(REVIEWS.every((review) => review.rating >= 4)).toBe(true);
  });

  it("exports metadata and results without raw image data", () => {
    const scan = buildStructuredSkinAnalysis(scanSignals, assessment, { sessionId: "scan_test", capturedAt: "2026-06-26T12:00:00.000Z" });
    const csv = buildLocalExportCsv({ consent: { ...DEFAULT_CONSENT, faceScan: true }, assessment, scan });

    expect(csv).toContain("scan_session_id,scan_test");
    expect(csv).toContain("raw_photo_included,false");
    expect(csv).toContain("scan_image_reference,");
    expect(csv).not.toContain("data:image");
  });

  it("shows product recommendations as one curated box price", () => {
    const scan = buildStructuredSkinAnalysis(scanSignals, assessment, { sessionId: "scan_test", capturedAt: "2026-06-26T12:00:00.000Z" });
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...DEFAULT_CONSENT, ageConfirmed18: true, faceScan: true, saveScanHistory: true }));
    localStorage.setItem(SCAN_KEY, JSON.stringify(scan));
    localStorage.setItem("lumaroutine.assessment.v1", JSON.stringify(assessment));

    renderInApp(<Results />);

    expect(screen.getByText(/Your curated skincare box/i)).toBeInTheDocument();
    expect(screen.getByText(/plus tax and shipping/i)).toBeInTheDocument();
    expect(screen.queryByText(/Individual product total/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Personalization \+ guide/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Included/i).length).toBeGreaterThan(0);
  });

  it("varies the curated box across different skin profiles", () => {
    const oilyProfile = {
      ...assessment,
      goals: ["oil-control", "blemish-prone"] as AssessmentInput["goals"],
      mainGoal: "oil-control" as const,
      skinFeel: "oily" as const,
      sensitivity: "low" as const,
      habits: { ...assessment.habits, sunscreen: false, acneTreatments: false },
      scan: buildStructuredSkinAnalysis({ ...scanSignals, shine: 0.78, redness: 0.18, darkSpots: 0.2 }, assessment),
    };
    const dryRednessProfile = {
      ...assessment,
      goals: ["visible-redness", "hydration"] as AssessmentInput["goals"],
      mainGoal: "visible-redness" as const,
      skinFeel: "dry" as const,
      sensitivity: "high" as const,
      habits: { ...assessment.habits, moisturizer: false, sunscreen: false, acneTreatments: true },
      scan: buildStructuredSkinAnalysis({ ...scanSignals, shine: 0.2, redness: 0.78, texture: 0.5 }, assessment),
    };

    const oilyBundle = buildBundle(recommend(oilyProfile), "mid", "standard").products.map((item) => item.product.id);
    const dryRednessBundle = buildBundle(recommend(dryRednessProfile), "mid", "standard").products.map((item) => item.product.id);
    const overlap = oilyBundle.filter((id) => dryRednessBundle.includes(id));

    expect(oilyBundle).not.toEqual(dryRednessBundle);
    expect(overlap.length).toBeLessThan(oilyBundle.length);
  });

  it("uses a broad product catalog and treats budget as a ceiling", () => {
    const brandCount = new Set(PRODUCTS.map((product) => product.brand)).size;
    expect(brandCount).toBeGreaterThan(35);

    const simpleLowBudget = {
      ...assessment,
      goals: ["hydration", "sunscreen"] as AssessmentInput["goals"],
      mainGoal: "simple-routine" as const,
      skinFeel: "balanced" as const,
      sensitivity: "medium" as const,
      routinePreference: "simple" as const,
      budget: "low" as const,
      habits: { cleanser: false, moisturizer: false, sunscreen: false, exfoliate: false, acneTreatments: false },
      scan: buildStructuredSkinAnalysis({ ...scanSignals, shine: 0.2, redness: 0.2, texture: 0.2, darkSpots: 0.18 }, assessment),
    };

    const bundle = buildBundle(recommend(simpleLowBudget), "low", "simple");
    expect(bundle.bundlePrice).toBeLessThanOrEqual(50);
  });
});
