// Consent + privacy state. Stored in localStorage. GPC respected.

export interface ConsentState {
  cookiesChoice: "essential" | "custom" | "accept-all" | null;
  analytics: boolean;
  faceScan: boolean;            // explicit face-scan consent
  cloudAiAnalysis: boolean;     // optional external AI processing consent
  saveScanHistory: boolean;     // optional, default off
  aggregateContribution: boolean; // optional, default off
  ageConfirmed18: boolean;
  gpcDetected: boolean;
  updatedAt: number;
}

const KEY = "lumaroutine.consent.v1";

export const DEFAULT_CONSENT: ConsentState = {
  cookiesChoice: null,
  analytics: false,
  faceScan: false,
  cloudAiAnalysis: false,
  saveScanHistory: false,
  aggregateContribution: false,
  ageConfirmed18: false,
  gpcDetected: detectGPC(),
  updatedAt: 0,
};

export function detectGPC(): boolean {
  if (typeof navigator === "undefined") return false;
  // @ts-expect-error - non-standard but widely shipping
  return Boolean(navigator.globalPrivacyControl);
}

export function loadConsent(): ConsentState {
  if (typeof localStorage === "undefined") return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_CONSENT };
    const parsed = JSON.parse(raw) as ConsentState;
    // GPC always wins — never enable analytics if GPC is on.
    const gpc = detectGPC();
    return { ...DEFAULT_CONSENT, ...parsed, gpcDetected: gpc, analytics: gpc ? false : parsed.analytics };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function saveConsent(c: ConsentState) {
  if (typeof localStorage === "undefined") return;
  const next = { ...c, updatedAt: Date.now(), gpcDetected: detectGPC() };
  if (next.gpcDetected) next.analytics = false;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function canRunAnalytics(c: ConsentState): boolean {
  if (c.gpcDetected) return false;
  return c.analytics && (c.cookiesChoice === "accept-all" || c.cookiesChoice === "custom");
}

export function canRunFaceScan(c: ConsentState): boolean {
  return c.ageConfirmed18 && c.faceScan;
}

export function resetConsent() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}
