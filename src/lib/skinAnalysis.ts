import { analyzeImageFromSource, type AnalysisResult } from "./imageAnalysis";
import type {
  AssessmentInput,
  FaceZoneInsight,
  ScanScores,
  ScanSeverity,
  ScanSignals,
} from "./recommendation";

type ScanSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

interface AnalysisMeta {
  sessionId?: string;
  capturedAt?: string;
  consentStatus?: boolean;
}

export async function analyzeSkinScan(
  source: ScanSource,
  questionnaireData?: Partial<AssessmentInput>,
  meta: AnalysisMeta = {},
): Promise<ScanSignals> {
  const sessionId = meta.sessionId ?? createSessionId();
  const capturedAt = meta.capturedAt ?? new Date().toISOString();
  const localSignals = await analyzeImageFromSource(source);
  const localReport = buildStructuredSkinAnalysis(localSignals, questionnaireData, { sessionId, capturedAt });
  const endpoint = getAnalysisEndpoint();

  if (!endpoint) return localReport;

  try {
    const image = await sourceToDataUrl(source);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        questionnaireData,
        timestamp: capturedAt,
        sessionId,
        consentStatus: Boolean(meta.consentStatus),
      }),
    });

    if (!response.ok) return localReport;
    const payload = await response.json();
    return normalizeExternalAnalysis(payload, localReport);
  } catch {
    return localReport;
  }
}

export function buildStructuredSkinAnalysis(
  signals: AnalysisResult,
  questionnaireData?: Partial<AssessmentInput>,
  meta: { sessionId?: string; capturedAt?: string } = {},
): ScanSignals {
  const scores = buildScores(signals, questionnaireData);
  const strengths = buildStrengths(signals);
  const improvements = buildImprovements(signals, questionnaireData);
  const zones = buildZoneInsights(signals);

  return {
    ...signals,
    sessionId: meta.sessionId ?? createSessionId(),
    capturedAt: meta.capturedAt ?? new Date().toISOString(),
    imageReference: null,
    analysisProvider: "local-browser",
    scores,
    zones,
    strengths,
    improvements,
    suggestedRoutineFocus: buildRoutineFocus(signals, questionnaireData),
    recommendedHabits: buildHabitSuggestions(signals, questionnaireData),
    summary:
      "Your skin has a strong foundation. The scan shows good baseline clarity and several balanced-looking areas, with a few normal patterns worth improving around shine, texture, and tone consistency.",
  };
}

function normalizeExternalAnalysis(payload: unknown, fallback: ScanSignals): ScanSignals {
  const data = payload && typeof payload === "object" && "scan" in payload
    ? (payload as { scan: Partial<ScanSignals> }).scan
    : payload as Partial<ScanSignals>;

  if (!data || typeof data !== "object") return fallback;

  return {
    ...fallback,
    ...data,
    qualityDetail: data.qualityDetail ?? fallback.qualityDetail,
    scores: data.scores ?? fallback.scores,
    zones: data.zones ?? fallback.zones,
    strengths: data.strengths ?? fallback.strengths,
    improvements: data.improvements ?? fallback.improvements,
    suggestedRoutineFocus: data.suggestedRoutineFocus ?? fallback.suggestedRoutineFocus,
    recommendedHabits: data.recommendedHabits ?? fallback.recommendedHabits,
    analysisProvider: "external-agent",
  };
}

function buildScores(signals: AnalysisResult, questionnaireData?: Partial<AssessmentInput>): ScanScores {
  const clarity = scoreFromRisk(signals.darkSpots * 0.75 + signals.texture * 0.25);
  const texture = scoreFromRisk(signals.texture);
  const oilShine = scoreFromRisk(signals.shine);
  const redness = scoreFromRisk(signals.redness);
  const toneEvenness = scoreFromRisk(signals.darkSpots * 0.55 + signals.redness * 0.45);
  const routineMatch = clampScore(
    78 +
    (signals.reliable ? 8 : 0) +
    (questionnaireData?.mainGoal ? 4 : 0) +
    (questionnaireData?.routineConsistency === "daily" ? 4 : 0) -
    (questionnaireData?.routineConsistency === "rarely" ? 3 : 0),
  );
  const overall = clampScore(Math.round(
    clarity * 0.25 +
    texture * 0.18 +
    oilShine * 0.16 +
    redness * 0.16 +
    toneEvenness * 0.17 +
    signals.quality * 8,
  ));

  return { overall, clarity, texture, oilShine, redness, toneEvenness, routineMatch };
}

function buildStrengths(signals: AnalysisResult): string[] {
  const strengths = ["Healthy-looking baseline"];
  if (signals.darkSpots < 0.55) strengths.push("Good overall clarity");
  if (signals.redness < 0.5) strengths.push("Minimal visible redness in most areas");
  if (signals.texture < 0.55) strengths.push("Mostly even-looking texture");
  if (signals.shine < 0.55) strengths.push("Balanced-looking shine level");
  if (signals.qualityDetail?.lighting >= 0.55) strengths.push("Clear enough lighting for useful guidance");
  return strengths.slice(0, 5);
}

function buildImprovements(signals: AnalysisResult, questionnaireData?: Partial<AssessmentInput>): string[] {
  const items: string[] = [];
  if (signals.shine >= 0.45) items.push("Slight shine around the T-zone that can improve with lightweight hydration and oil-control support");
  if (signals.texture >= 0.42) items.push("Some visible texture that may benefit from gentle, consistent exfoliation");
  if (signals.darkSpots >= 0.4) items.push("Mild uneven-looking tone or spot contrast that can be supported with daily SPF and brightening ingredients");
  if (signals.redness >= 0.4) items.push("Visible redness in a few areas where barrier-friendly products may help the look of calmness");
  if (questionnaireData?.habits && !questionnaireData.habits.sunscreen) items.push("A daily sunscreen habit would make the routine more protective and tone-focused");
  if (items.length === 0) items.push("Keep the routine consistent and track visible changes over time");
  return items.slice(0, 5);
}

function buildZoneInsights(signals: AnalysisResult): FaceZoneInsight[] {
  return [
    zone("Forehead", signals.texture * 0.55 + signals.shine * 0.45, {
      low: "Even-looking forehead with limited visible texture",
      mild: "Slight visible texture and shine",
      moderate: "More noticeable texture and reflective shine",
      focus: "Gentle exfoliation + oil control",
      explanation: "The forehead often shows texture and shine first, so this zone helps shape exfoliation frequency.",
    }),
    zone("Nose", signals.shine * 0.8 + signals.texture * 0.2, {
      low: "Balanced-looking shine",
      mild: "Slight T-zone shine",
      moderate: "Noticeable reflective shine around the nose",
      focus: "Lightweight hydration + non-stripping cleanse",
      explanation: "This area appears more reflective than the cheeks when surface oil is more visible.",
    }),
    zone("Left cheek", signals.redness * 0.45 + signals.texture * 0.35 + signals.darkSpots * 0.2, {
      low: "Calm, even-looking cheek area",
      mild: "Mild texture or tone variation",
      moderate: "More visible tone variation and texture",
      focus: "Barrier support + tone-evening care",
      explanation: "Cheek zones are useful for reading visible redness, tone consistency, and texture.",
    }),
    zone("Right cheek", signals.redness * 0.4 + signals.texture * 0.4 + signals.darkSpots * 0.2, {
      low: "Calm, even-looking cheek area",
      mild: "Mild texture or tone variation",
      moderate: "More visible tone variation and texture",
      focus: "Barrier support + tone-evening care",
      explanation: "Comparing both cheeks helps avoid making the routine too T-zone focused.",
    }),
    zone("Chin", signals.texture * 0.45 + signals.darkSpots * 0.35 + signals.shine * 0.2, {
      low: "Clear-looking chin zone",
      mild: "Small blemish-prone or texture pattern",
      moderate: "More concentrated blemish-prone texture",
      focus: "Targeted spot care + steady cleansing",
      explanation: "The chin can show small blemish-prone patterns, especially when texture and spot contrast rise together.",
    }),
    zone("Under-eye area", signals.darkSpots * 0.55 + (1 - signals.qualityDetail.lighting) * 0.25 + signals.texture * 0.2, {
      low: "Even-looking under-eye area",
      mild: "Slight shadow or tone variation",
      moderate: "More visible shadow and tone variation",
      focus: "Hydration + gentle SPF habits",
      explanation: "Under-eye appearance is strongly affected by lighting, hydration, and natural shadowing.",
    }),
  ];
}

function zone(
  zoneName: FaceZoneInsight["zone"],
  risk: number,
  copy: { low: string; mild: string; moderate: string; focus: string; explanation: string },
): FaceZoneInsight {
  const severity = severityFromRisk(risk);
  return {
    zone: zoneName,
    observation: severity === "Clear" || severity === "Low" ? copy.low : severity === "Mild" ? copy.mild : copy.moderate,
    severity,
    focus: copy.focus,
    explanation: copy.explanation,
  };
}

function buildRoutineFocus(signals: AnalysisResult, questionnaireData?: Partial<AssessmentInput>): string[] {
  const focus = ["Gentle cleanser", "Daily moisturizer", "Broad-spectrum SPF"];
  if (signals.shine > 0.45) focus.push("Oil-control serum");
  if (signals.texture > 0.42) focus.push("Slow-start exfoliation");
  if (signals.darkSpots > 0.4 || questionnaireData?.mainGoal === "dark-spot-appearance") focus.push("Tone-evening support");
  if (signals.redness > 0.4 || questionnaireData?.sensitivity === "high") focus.push("Barrier-calming products");
  return Array.from(new Set(focus)).slice(0, 6);
}

function buildHabitSuggestions(signals: AnalysisResult, questionnaireData?: Partial<AssessmentInput>): string[] {
  const habits: string[] = [];
  if (!questionnaireData?.habits?.sunscreen) habits.push("Use sunscreen every morning, even on cloudy days.");
  if (signals.shine > 0.45) habits.push("Cleanse at night and avoid harsh stripping cleansers.");
  if (signals.texture > 0.42) habits.push("Introduce exfoliation slowly, one or two nights per week.");
  if (questionnaireData?.routineConsistency === "rarely") habits.push("Start with three steps so the routine is easy to repeat.");
  habits.push("Retake a scan every few weeks under similar lighting to track visible changes.");
  return habits.slice(0, 5);
}

function scoreFromRisk(risk: number): number {
  return clampScore(Math.round(96 - clamp01(risk) * 42));
}

function severityFromRisk(risk: number): ScanSeverity {
  if (risk < 0.22) return "Clear";
  if (risk < 0.4) return "Low";
  if (risk < 0.68) return "Mild";
  return "Moderate";
}

async function sourceToDataUrl(source: ScanSource): Promise<string> {
  const sourceWidth = source instanceof HTMLVideoElement
    ? source.videoWidth || 640
    : source instanceof HTMLImageElement
      ? source.naturalWidth || source.width || 640
      : source.width;
  const sourceHeight = source instanceof HTMLVideoElement
    ? source.videoHeight || 480
    : source instanceof HTMLImageElement
      ? source.naturalHeight || source.height || 480
      : source.height;
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function getAnalysisEndpoint(): string {
  return import.meta.env.VITE_SKIN_ANALYSIS_ENDPOINT?.trim() ?? "";
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampScore(n: number): number {
  return Math.max(52, Math.min(99, n));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
