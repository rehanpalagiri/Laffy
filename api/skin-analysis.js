const MAX_IMAGE_CHARS = 2_500_000;
const DEFAULT_MODEL = "gemini-3.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "method_not_allowed" });
  }

  if (process.env.AI_ANALYSIS_ENABLED === "false") {
    return sendJson(res, 503, { error: "ai_disabled" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendJson(res, 503, { error: "missing_gemini_api_key" });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendJson(res, 400, { error: "invalid_json" });
  }
  const validation = validateRequest(body);
  if (!validation.ok) {
    return sendJson(res, 400, { error: validation.error });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const { mimeType, base64 } = splitDataUrl(body.image);

  try {
    const geminiPayload = await callGemini({
      apiKey,
      model,
      mimeType,
      base64,
      questionnaireData: body.questionnaireData,
      localSignals: body.localSignals,
      sessionId: body.sessionId,
      timestamp: body.timestamp,
    });
    const scan = normalizeAiScan(geminiPayload, body.localSignals, model);
    return sendJson(res, 200, { scan });
  } catch (error) {
    return sendJson(res, 502, {
      error: "gemini_analysis_failed",
      detail: error instanceof Error ? error.message : "Unknown Gemini error",
    });
  }
}

async function callGemini(input) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(input) },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini response did not include JSON text");
  return parseGeminiJson(text);
}

function buildPrompt(input) {
  return [
    "You are Laffy's cosmetic skin-analysis assistant.",
    "Analyze only visible cosmetic skin patterns for skincare routine guidance.",
    "Do not diagnose medical conditions or infer age, gender, ethnicity, emotion, identity, attractiveness, or health status.",
    "Use conservative phrases such as visible redness, shine, texture variation, tone variation, and spot contrast.",
    "Use the local browser scan signals as grounding; do not contradict obvious local quality failures.",
    "Return strict JSON only with this shape:",
    JSON.stringify({
      summary: "string",
      strengths: ["string"],
      improvements: ["string"],
      suggestedRoutineFocus: ["string"],
      recommendedHabits: ["string"],
      scores: {
        overall: 0,
        clarity: 0,
        texture: 0,
        oilShine: 0,
        redness: 0,
        toneEvenness: 0,
        routineMatch: 0,
      },
      zones: [
        {
          zone: "Forehead",
          observation: "string",
          severity: "Clear",
          focus: "string",
          explanation: "string",
        },
      ],
      analysisConfidence: 0.8,
      analysisWarnings: ["string"],
    }),
    `Session ID: ${input.sessionId}`,
    `Timestamp: ${input.timestamp}`,
    `Questionnaire: ${JSON.stringify(input.questionnaireData ?? {})}`,
    `Local scan signals: ${JSON.stringify(summarizeLocalSignals(input.localSignals))}`,
  ].join("\n\n");
}

function normalizeAiScan(payload, fallback, model) {
  const scan = payload && typeof payload === "object" && payload.scan && typeof payload.scan === "object"
    ? payload.scan
    : payload;

  return {
    quality: clamp01(fallback.quality),
    shine: clamp01(fallback.shine),
    redness: clamp01(fallback.redness),
    texture: clamp01(fallback.texture),
    darkSpots: clamp01(fallback.darkSpots),
    reliable: Boolean(fallback.reliable),
    faceDetected: Boolean(fallback.faceDetected),
    sessionId: fallback.sessionId ?? null,
    capturedAt: fallback.capturedAt ?? null,
    imageReference: null,
    qualityDetail: fallback.qualityDetail,
    summary: stringOr(scan.summary, fallback.summary),
    strengths: stringList(scan.strengths, fallback.strengths),
    improvements: stringList(scan.improvements, fallback.improvements),
    suggestedRoutineFocus: stringList(scan.suggestedRoutineFocus, fallback.suggestedRoutineFocus),
    recommendedHabits: stringList(scan.recommendedHabits, fallback.recommendedHabits),
    scores: normalizeScores(scan.scores, fallback.scores),
    zones: normalizeZones(scan.zones, fallback.zones),
    analysisProvider: "gemini-vision",
    analysisModel: model,
    analysisConfidence: clamp01(typeof scan.analysisConfidence === "number" ? scan.analysisConfidence : fallback.reliable ? 0.78 : 0.45),
    analysisWarnings: stringList(scan.analysisWarnings, fallback.analysisWarnings),
  };
}

function normalizeScores(scores, fallback) {
  const source = scores && typeof scores === "object" ? scores : fallback ?? {};
  return {
    overall: clampScore(source.overall),
    clarity: clampScore(source.clarity),
    texture: clampScore(source.texture),
    oilShine: clampScore(source.oilShine),
    redness: clampScore(source.redness),
    toneEvenness: clampScore(source.toneEvenness),
    routineMatch: clampScore(source.routineMatch),
  };
}

function normalizeZones(zones, fallback) {
  const allowedZones = new Set(["Forehead", "Nose", "Left cheek", "Right cheek", "Chin", "Under-eye area"]);
  const allowedSeverity = new Set(["Clear", "Low", "Mild", "Moderate"]);
  const source = Array.isArray(zones) ? zones : fallback ?? [];
  return source
    .filter((zone) => zone && typeof zone === "object" && allowedZones.has(zone.zone))
    .map((zone) => ({
      zone: zone.zone,
      observation: stringOr(zone.observation, "Cosmetic zone reviewed"),
      severity: allowedSeverity.has(zone.severity) ? zone.severity : "Low",
      focus: stringOr(zone.focus, "Gentle routine support"),
      explanation: stringOr(zone.explanation, "This zone was reviewed for visible cosmetic patterns."),
    }))
    .slice(0, 6);
}

function validateRequest(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_json" };
  if (!body.consentStatus || !body.cloudAiConsent) return { ok: false, error: "cloud_ai_consent_required" };
  if (!body.localSignals || typeof body.localSignals !== "object") return { ok: false, error: "local_signals_required" };
  if (typeof body.image !== "string") return { ok: false, error: "image_required" };
  if (body.image.length > MAX_IMAGE_CHARS) return { ok: false, error: "image_too_large" };
  const parsed = splitDataUrl(body.image);
  if (!parsed) return { ok: false, error: "invalid_image_data_url" };
  return { ok: true };
}

function splitDataUrl(value) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value ?? "");
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function parseGeminiJson(text) {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function summarizeLocalSignals(signals) {
  return {
    quality: signals?.quality,
    shine: signals?.shine,
    redness: signals?.redness,
    texture: signals?.texture,
    darkSpots: signals?.darkSpots,
    reliable: signals?.reliable,
    faceDetected: signals?.faceDetected,
    qualityDetail: signals?.qualityDetail,
    scores: signals?.scores,
    zones: signals?.zones,
  };
}

function stringOr(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringList(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(0, 6);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, typeof value === "number" ? value : 0));
}

function clampScore(value) {
  return Math.round(Math.max(0, Math.min(100, typeof value === "number" ? value : 0)));
}
