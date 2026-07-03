import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeSkinScan } from "@/lib/skinAnalysis";
import type { AnalysisResult } from "@/lib/imageAnalysis";
import type { AssessmentInput } from "@/lib/recommendation";

const mockAnalyzeImageFromSource = vi.hoisted(() => vi.fn());

vi.mock("@/lib/imageAnalysis", () => ({
  analyzeImageFromSource: mockAnalyzeImageFromSource,
}));

const assessment: Partial<AssessmentInput> = {
  goals: ["oil-control"],
  skinFeel: "combination",
  routineConsistency: "sometimes",
  mainGoal: "oil-control",
  sensitivity: "medium",
  budget: "mid",
  routinePreference: "standard",
};

const localSignals: AnalysisResult = {
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

function scanSource(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  return canvas;
}

beforeEach(() => {
  mockAnalyzeImageFromSource.mockResolvedValue(localSignals);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  mockAnalyzeImageFromSource.mockReset();
});

describe("cloud skin analysis consent", () => {
  it("keeps scan analysis local when cloud AI consent is off", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const report = await analyzeSkinScan(scanSource(), assessment, {
      consentStatus: true,
      cloudAiConsent: false,
      sessionId: "scan_local",
      capturedAt: "2026-07-03T12:00:00.000Z",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(report.analysisProvider).toBe("local-browser");
    expect(report.sessionId).toBe("scan_local");
  });

  it("sends the downscaled image only with explicit cloud AI consent", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,abc123");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scan: {
          summary: "Gemini-assisted cosmetic analysis.",
          analysisProvider: "gemini-vision",
          analysisModel: "gemini-3.5-flash",
          analysisConfidence: 0.91,
          analysisWarnings: ["Use consistent lighting for best comparisons."],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const report = await analyzeSkinScan(scanSource(), assessment, {
      consentStatus: true,
      cloudAiConsent: true,
      sessionId: "scan_cloud",
      capturedAt: "2026-07-03T12:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body.image).toBe("data:image/jpeg;base64,abc123");
    expect(body.consentStatus).toBe(true);
    expect(body.cloudAiConsent).toBe(true);
    expect(body.localSignals.analysisProvider).toBe("local-browser");
    expect(report.analysisProvider).toBe("gemini-vision");
    expect(report.analysisModel).toBe("gemini-3.5-flash");
    expect(report.analysisConfidence).toBe(0.91);
  });
});
