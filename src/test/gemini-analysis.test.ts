import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error - The Vercel API route is intentionally plain JS outside src.
import skinAnalysisHandler from "../../api/skin-analysis.js";
import { buildAdminQualityRecord } from "@/lib/adminQuality";
import { DEFAULT_CONSENT } from "@/lib/consent";
import { buildLocalExportCsv } from "@/lib/dataExport";
import { buildStructuredSkinAnalysis } from "@/lib/skinAnalysis";
import type { AnalysisResult } from "@/lib/imageAnalysis";
import type { AssessmentInput, ScanSignals } from "@/lib/recommendation";

const assessment: AssessmentInput = {
  goals: ["visible-redness"],
  skinFeel: "balanced",
  habits: {
    cleanser: true,
    moisturizer: true,
    sunscreen: false,
    exfoliate: false,
    acneTreatments: false,
  },
  routineConsistency: "most-days",
  mainGoal: "visible-redness",
  routinePreference: "standard",
  sensitivity: "medium",
  allergies: [],
  fragranceFreeOnly: false,
  pregnancyMode: false,
  budget: "mid",
};

const scanSignals: AnalysisResult = {
  quality: 0.86,
  shine: 0.22,
  redness: 0.58,
  texture: 0.3,
  darkSpots: 0.2,
  reliable: true,
  faceDetected: true,
  qualityDetail: {
    lighting: 0.9,
    blur: 0.82,
    framing: 0.84,
    overexposed: false,
    overall: 0.86,
    reliable: true,
    issues: [],
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  delete process.env.AI_ANALYSIS_ENABLED;
});

describe("Gemini skin-analysis endpoint", () => {
  it("rejects cloud analysis without explicit consent", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const res = createResponse();

    await skinAnalysisHandler(createRequest({ cloudAiConsent: false }), res);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("cloud_ai_consent_required");
  });

  it("rejects malformed image payloads before calling Gemini", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = createResponse();

    await skinAnalysisHandler(createRequest({ image: "not-an-image" }), res);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("invalid_image_data_url");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns normalized Gemini scan metadata on success", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-test-model";
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                summary: "Gemini found mild visible redness with otherwise balanced-looking skin.",
                strengths: ["Balanced-looking baseline"],
                improvements: ["Visible redness can be supported with barrier-friendly products"],
                suggestedRoutineFocus: ["Barrier support", "Daily SPF"],
                recommendedHabits: ["Use sunscreen every morning."],
                scores: {
                  overall: 88,
                  clarity: 90,
                  texture: 84,
                  oilShine: 92,
                  redness: 72,
                  toneEvenness: 83,
                  routineMatch: 89,
                },
                zones: [{
                  zone: "Left cheek",
                  observation: "Mild visible redness",
                  severity: "Mild",
                  focus: "Barrier support",
                  explanation: "Cheek redness appears more visible than the T-zone.",
                }],
                analysisConfidence: 0.81,
                analysisWarnings: ["Cosmetic guidance only"],
              }),
            }],
          },
        }],
      }),
    })));
    const res = createResponse();

    await skinAnalysisHandler(createRequest(), res);

    const payload = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(payload.scan.analysisProvider).toBe("gemini-vision");
    expect(payload.scan.analysisModel).toBe("gemini-test-model");
    expect(payload.scan.analysisConfidence).toBe(0.81);
    expect(payload.scan.imageReference).toBeNull();
    expect(payload.scan.scores.overall).toBe(88);
  });
});

describe("Gemini metadata exports", () => {
  it("includes cloud consent and model metadata in export/admin records", () => {
    const scan: ScanSignals = {
      ...buildStructuredSkinAnalysis(scanSignals, assessment, {
        sessionId: "scan_gemini",
        capturedAt: "2026-07-03T12:00:00.000Z",
      }),
      analysisProvider: "gemini-vision",
      analysisModel: "gemini-test-model",
      analysisConfidence: 0.81,
      analysisWarnings: ["Cosmetic guidance only"],
    };

    const csv = buildLocalExportCsv({
      consent: { ...DEFAULT_CONSENT, faceScan: true, cloudAiAnalysis: true },
      assessment,
      scan,
    });
    const admin = buildAdminQualityRecord({ assessment, scan, routine: null, bundle: null });

    expect(csv).toContain("cloud_ai_analysis_consent,true");
    expect(csv).toContain("scan_analysis_provider,gemini-vision");
    expect(csv).toContain("scan_analysis_model,gemini-test-model");
    expect(csv).not.toContain("data:image");
    expect(admin?.modelVersion).toBe("gemini-test-model");
    expect(admin?.aiConfidenceScore).toBe(0.81);
  });
});

function createRequest(overrides: Record<string, unknown> = {}) {
  const localSignals = buildStructuredSkinAnalysis(scanSignals, assessment, {
    sessionId: "scan_gemini",
    capturedAt: "2026-07-03T12:00:00.000Z",
  });

  return {
    method: "POST",
    body: {
      image: "data:image/jpeg;base64,AAAA",
      questionnaireData: assessment,
      localSignals,
      sessionId: "scan_gemini",
      timestamp: "2026-07-03T12:00:00.000Z",
      consentStatus: true,
      cloudAiConsent: true,
      ...overrides,
    },
  };
}

function createResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: "",
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    end(payload: string) {
      this.body = payload;
    },
  };
}
