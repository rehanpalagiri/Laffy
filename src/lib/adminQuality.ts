import type { AssessmentInput, Routine, ScanSignals } from "@/lib/recommendation";
import type { ProductBundle } from "@/lib/productCatalog";

export interface AdminQualityRecord {
  scanId: string;
  timestamp: string;
  userRef: string;
  scanStatus: "successful" | "failed" | "needs-review";
  faceDetected: boolean;
  faceCount: number;
  uploadQualityScore: number;
  blurScore: number;
  lightingScore: number;
  framingScore: number;
  aiConfidenceScore: number;
  detectedConcerns: string[];
  budgetRange: AssessmentInput["budget"];
  skinFeel: AssessmentInput["skinFeel"];
  sensitivity: AssessmentInput["sensitivity"];
  routinePreference: AssessmentInput["routinePreference"];
  recommendedBrands: string[];
  recommendedCategories: string[];
  finalBoxPrice: number;
  errorFlags: string[];
  falsePositiveFlags: string[];
  adminReviewStatus: "unreviewed" | "review-needed" | "cleared";
  modelVersion: string;
  recommendationEngineVersion: string;
}

export const MODEL_VERSION = "local-browser-scan-v1";
export const RECOMMENDATION_ENGINE_VERSION = "routine-fit-v2";

export function buildAdminQualityRecord(input: {
  assessment: AssessmentInput;
  scan: ScanSignals | null;
  routine: Routine | null;
  bundle: ProductBundle | null;
}): AdminQualityRecord | null {
  const { assessment, scan, routine, bundle } = input;
  if (!scan) return null;

  const products = bundle?.products.map((item) => item.product)
    ?? [...(routine?.am ?? []), ...(routine?.pm ?? [])].map((step) => step.product);
  const errorFlags = [
    ...(scan.qualityDetail?.issues ?? []),
    !scan.faceDetected ? "no-face-detected" : "",
    !scan.reliable ? "low-confidence-scan" : "",
    (scan.qualityDetail?.blur ?? 1) < 0.25 ? "blurry-upload" : "",
    (scan.qualityDetail?.lighting ?? 1) < 0.35 ? "low-light-upload" : "",
  ].filter(Boolean);
  const falsePositiveFlags = [
    !scan.faceDetected && scan.scores ? "score-generated-without-face" : "",
    scan.faceDetected && (scan.qualityDetail?.overall ?? scan.quality) < 0.35 ? "result-generated-from-low-quality-image" : "",
  ].filter(Boolean);
  const detectedConcerns = [
    scan.shine > 0.5 ? "surface shine" : "",
    scan.redness > 0.45 ? "visible redness" : "",
    scan.texture > 0.45 ? "uneven texture" : "",
    scan.darkSpots > 0.42 ? "tone variation" : "",
    ...assessment.goals.map((goal) => goal.replace(/-/g, " ")),
  ].filter(Boolean);
  const scanStatus = !scan.faceDetected || !scan.reliable
    ? "failed"
    : falsePositiveFlags.length || errorFlags.length
      ? "needs-review"
      : "successful";

  return {
    scanId: scan.sessionId ?? "local-scan",
    timestamp: scan.capturedAt ?? new Date().toISOString(),
    userRef: `local-${(scan.sessionId ?? "scan").slice(0, 8)}`,
    scanStatus,
    faceDetected: Boolean(scan.faceDetected),
    faceCount: scan.faceDetected ? 1 : 0,
    uploadQualityScore: round(scan.quality),
    blurScore: round(scan.qualityDetail?.blur ?? scan.quality),
    lightingScore: round(scan.qualityDetail?.lighting ?? scan.quality),
    framingScore: round(scan.qualityDetail?.framing ?? scan.quality),
    aiConfidenceScore: round(scan.reliable ? scan.quality : scan.quality * 0.55),
    detectedConcerns: Array.from(new Set(detectedConcerns)),
    budgetRange: assessment.budget,
    skinFeel: assessment.skinFeel,
    sensitivity: assessment.sensitivity,
    routinePreference: assessment.routinePreference,
    recommendedBrands: Array.from(new Set(products.map((product) => product.brand))),
    recommendedCategories: Array.from(new Set(products.map((product) => product.category))),
    finalBoxPrice: bundle?.bundlePrice ?? 0,
    errorFlags,
    falsePositiveFlags,
    adminReviewStatus: scanStatus === "successful" ? "cleared" : "review-needed",
    modelVersion: MODEL_VERSION,
    recommendationEngineVersion: RECOMMENDATION_ENGINE_VERSION,
  };
}

export function buildAdminMetrics(records: AdminQualityRecord[]) {
  const totalScans = records.length;
  const successfulScans = records.filter((record) => record.scanStatus === "successful").length;
  const failedScans = records.filter((record) => record.scanStatus === "failed").length;
  const nonFaceUploads = records.filter((record) => !record.faceDetected).length;
  const lowQualityUploads = records.filter((record) => record.uploadQualityScore < 0.45 || record.aiConfidenceScore < 0.45).length;
  const averageConfidence = average(records.map((record) => record.aiConfidenceScore));
  const averageBoxPrice = average(records.map((record) => record.finalBoxPrice).filter(Boolean));

  return {
    totalScans,
    successfulScans,
    failedScans,
    nonFaceUploads,
    lowQualityUploads,
    averageConfidence,
    averageBoxPrice,
    casesNeedingReview: records.filter((record) => record.adminReviewStatus === "review-needed").length,
    concernCounts: countValues(records.flatMap((record) => record.detectedConcerns)),
    brandCounts: countValues(records.flatMap((record) => record.recommendedBrands)),
    categoryCounts: countValues(records.flatMap((record) => record.recommendedCategories)),
    budgetCounts: countValues(records.map((record) => record.budgetRange)),
  };
}

export function buildAdminQualityCsv(records: AdminQualityRecord[]): string {
  const headers: Array<keyof AdminQualityRecord> = [
    "scanId",
    "timestamp",
    "userRef",
    "scanStatus",
    "faceDetected",
    "faceCount",
    "uploadQualityScore",
    "blurScore",
    "lightingScore",
    "framingScore",
    "aiConfidenceScore",
    "detectedConcerns",
    "budgetRange",
    "skinFeel",
    "sensitivity",
    "routinePreference",
    "recommendedBrands",
    "recommendedCategories",
    "finalBoxPrice",
    "errorFlags",
    "falsePositiveFlags",
    "adminReviewStatus",
    "modelVersion",
    "recommendationEngineVersion",
  ];

  return [
    headers.join(","),
    ...records.map((record) => headers.map((key) => escapeCsv(formatField(record[key]))).join(",")),
  ].join("\n");
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function countValues(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatField(value: AdminQualityRecord[keyof AdminQualityRecord]): string {
  if (Array.isArray(value)) return value.join("|");
  return String(value);
}

function escapeCsv(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
