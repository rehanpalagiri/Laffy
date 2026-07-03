import type { ConsentState } from "./consent";
import type { AssessmentInput, ScanSignals } from "./recommendation";

export interface LocalExportInput {
  consent: ConsentState;
  assessment: AssessmentInput;
  scan: ScanSignals | null;
  generatedAt?: Date;
}

export interface LocalExportBundle {
  generatedAt: string;
  schemaVersion: "laffy-local-export-v1";
  processingNotice: string;
  consent: ConsentState;
  assessment: AssessmentInput;
  scan: ScanSignals | null;
  safeguards: {
    rawPhotoIncluded: false;
    biometricIdentifierIncluded: false;
    biometricTemplateIncluded: false;
    faceGeometryIncluded: false;
    exportGeneratedLocally: true;
  };
}

const NOTICE =
  "Local export generated in-browser. It includes consent, questionnaire answers, scan metadata, and AI analysis fields only. It does not include raw face photos, face geometry, biometric identifiers, or biometric templates.";

export function buildLocalExportBundle(input: LocalExportInput): LocalExportBundle {
  return {
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    schemaVersion: "laffy-local-export-v1",
    processingNotice: NOTICE,
    consent: input.consent,
    assessment: input.assessment,
    scan: input.scan,
    safeguards: {
      rawPhotoIncluded: false,
      biometricIdentifierIncluded: false,
      biometricTemplateIncluded: false,
      faceGeometryIncluded: false,
      exportGeneratedLocally: true,
    },
  };
}

export function buildLocalExportCsv(input: LocalExportInput): string {
  const bundle = buildLocalExportBundle(input);
  const rows: Array<[string, string]> = [
    ["schema_version", bundle.schemaVersion],
    ["generated_at", bundle.generatedAt],
    ["processing_notice", bundle.processingNotice],
    ["raw_photo_included", "false"],
    ["biometric_identifier_included", "false"],
    ["biometric_template_included", "false"],
    ["face_geometry_included", "false"],
    ["export_generated_locally", "true"],
    ["cookies_choice", bundle.consent.cookiesChoice ?? "not set"],
    ["analytics_consent", String(bundle.consent.analytics)],
    ["global_privacy_control_detected", String(bundle.consent.gpcDetected)],
    ["age_confirmed_18", String(bundle.consent.ageConfirmed18)],
    ["face_scan_consent", String(bundle.consent.faceScan)],
    ["cloud_ai_analysis_consent", String(bundle.consent.cloudAiAnalysis)],
    ["save_scan_history", String(bundle.consent.saveScanHistory)],
    ["aggregate_contribution", String(bundle.consent.aggregateContribution)],
    ["consent_updated_at", bundle.consent.updatedAt ? new Date(bundle.consent.updatedAt).toISOString() : "not set"],
    ["goals", bundle.assessment.goals.join("|")],
    ["main_goal", bundle.assessment.mainGoal],
    ["skin_feel", bundle.assessment.skinFeel],
    ["routine_consistency", bundle.assessment.routineConsistency],
    ["routine_preference", bundle.assessment.routinePreference],
    ["habit_cleanser", String(bundle.assessment.habits.cleanser)],
    ["habit_moisturizer", String(bundle.assessment.habits.moisturizer)],
    ["habit_sunscreen", String(bundle.assessment.habits.sunscreen)],
    ["habit_exfoliate", String(bundle.assessment.habits.exfoliate)],
    ["habit_acne_treatments", String(bundle.assessment.habits.acneTreatments)],
    ["sensitivity", bundle.assessment.sensitivity],
    ["allergies", bundle.assessment.allergies.join("|")],
    ["fragrance_free_only", String(bundle.assessment.fragranceFreeOnly)],
    ["pregnancy_mode", String(bundle.assessment.pregnancyMode)],
    ["budget", bundle.assessment.budget],
    ["scan_present", String(Boolean(bundle.scan))],
    ["scan_session_id", bundle.scan?.sessionId ?? ""],
    ["scan_captured_at", bundle.scan?.capturedAt ?? ""],
    ["scan_image_reference", bundle.scan?.imageReference ?? ""],
    ["scan_analysis_provider", bundle.scan?.analysisProvider ?? ""],
    ["scan_analysis_model", bundle.scan?.analysisModel ?? ""],
    ["scan_analysis_confidence", metric(bundle.scan?.analysisConfidence)],
    ["scan_analysis_warnings", bundle.scan?.analysisWarnings?.join("|") ?? ""],
    ["scan_face_detected", String(bundle.scan?.faceDetected ?? false)],
    ["scan_reliable", String(bundle.scan?.reliable ?? false)],
    ["scan_quality", metric(bundle.scan?.quality)],
    ["scan_shine_proxy", metric(bundle.scan?.shine)],
    ["scan_redness_color_proxy", metric(bundle.scan?.redness)],
    ["scan_texture_variance_proxy", metric(bundle.scan?.texture)],
    ["scan_dark_spot_contrast_proxy", metric(bundle.scan?.darkSpots)],
    ["scan_lighting_quality", metric(bundle.scan?.qualityDetail?.lighting)],
    ["scan_blur_quality", metric(bundle.scan?.qualityDetail?.blur)],
    ["scan_framing_quality", metric(bundle.scan?.qualityDetail?.framing)],
    ["scan_overexposed", String(bundle.scan?.qualityDetail?.overexposed ?? false)],
    ["scan_quality_issues", bundle.scan?.qualityDetail?.issues.join("|") ?? ""],
    ["analysis_summary", bundle.scan?.summary ?? ""],
    ["analysis_strengths", bundle.scan?.strengths?.join("|") ?? ""],
    ["analysis_improvements", bundle.scan?.improvements?.join("|") ?? ""],
    ["score_overall", metric(bundle.scan?.scores?.overall)],
    ["score_clarity", metric(bundle.scan?.scores?.clarity)],
    ["score_texture", metric(bundle.scan?.scores?.texture)],
    ["score_oil_shine", metric(bundle.scan?.scores?.oilShine)],
    ["score_redness", metric(bundle.scan?.scores?.redness)],
    ["score_tone_evenness", metric(bundle.scan?.scores?.toneEvenness)],
    ["score_routine_match", metric(bundle.scan?.scores?.routineMatch)],
    ["zone_analysis", bundle.scan?.zones?.map((z) => `${z.zone}: ${z.observation} (${z.severity})`).join("|") ?? ""],
    ["recommended_habits", bundle.scan?.recommendedHabits?.join("|") ?? ""],
  ];

  return ["field,value", ...rows.map(([key, value]) => `${escapeCsv(key)},${escapeCsv(value)}`)].join("\n");
}

export function buildLocalExportJson(input: LocalExportInput): string {
  return JSON.stringify(buildLocalExportBundle(input), null, 2);
}

function metric(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "";
}

function escapeCsv(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
