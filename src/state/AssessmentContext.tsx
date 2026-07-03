import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { ConsentState, loadConsent, saveConsent, DEFAULT_CONSENT } from "@/lib/consent";
import type { AssessmentInput, ScanSignals } from "@/lib/recommendation";

const ASSESSMENT_KEY = "lumaroutine.assessment.v1";
const SCAN_KEY = "lumaroutine.scan.v1";

const DEFAULT_ASSESSMENT: AssessmentInput = {
  goals: [],
  skinFeel: "unsure",
  habits: {
    cleanser: false,
    moisturizer: false,
    sunscreen: false,
    exfoliate: false,
    acneTreatments: false,
  },
  routineConsistency: "sometimes",
  mainGoal: "",
  routinePreference: "standard",
  sensitivity: "unsure",
  allergies: [],
  fragranceFreeOnly: false,
  pregnancyMode: false,
  budget: "mid",
};

interface Ctx {
  consent: ConsentState;
  setConsent: (c: Partial<ConsentState>) => void;
  assessment: AssessmentInput;
  setAssessment: (a: Partial<AssessmentInput>) => void;
  scan: ScanSignals | null;
  setScan: (s: ScanSignals | null) => void;
  reset: () => void;
}

const AssessmentCtx = createContext<Ctx | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>(() => loadConsent());
  const [assessment, setAssessmentState] = useState<AssessmentInput>(() => loadAssessment());
  const [scan, setScanState] = useState<ScanSignals | null>(() => loadScan());

  const value = useMemo<Ctx>(() => ({
    consent,
    setConsent: (c) => setConsentState((prev) => {
      const next = { ...prev, ...c };
      saveConsent(next);
      // Honor save-history toggle changes immediately
      if (!next.saveScanHistory) localStorage.removeItem(SCAN_KEY);
      return next;
    }),
    assessment,
    setAssessment: (a) => setAssessmentState((prev) => {
      const next = { ...prev, ...a };
      try { localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(next)); } catch {
        // localStorage can be unavailable in private or restricted browser modes.
      }
      return next;
    }),
    scan,
    setScan: (s) => setScanState(() => {
      if (s && consent.saveScanHistory) {
        try { localStorage.setItem(SCAN_KEY, JSON.stringify({ ...s, savedAt: Date.now() })); } catch {
          // Scan history is optional, so a storage failure should not block results.
        }
      } else {
        localStorage.removeItem(SCAN_KEY);
      }
      return s;
    }),
    reset: () => {
      setAssessmentState(DEFAULT_ASSESSMENT);
      setScanState(null);
      try {
        localStorage.removeItem(ASSESSMENT_KEY);
        localStorage.removeItem(SCAN_KEY);
      } catch {
        // Nothing else to clear if browser storage is unavailable.
      }
    },
  }), [consent, assessment, scan]);

  return <AssessmentCtx.Provider value={value}>{children}</AssessmentCtx.Provider>;
}

export function useAssessment() {
  const ctx = useContext(AssessmentCtx);
  if (!ctx) throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}

function loadAssessment(): AssessmentInput {
  if (typeof localStorage === "undefined") return DEFAULT_ASSESSMENT;
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY);
    if (!raw) return DEFAULT_ASSESSMENT;
    return mergeAssessment(JSON.parse(raw));
  } catch {
    return DEFAULT_ASSESSMENT;
  }
}

function mergeAssessment(input: Partial<AssessmentInput>): AssessmentInput {
  const rawBudget = input.budget as string | undefined;
  const legacyBudget = rawBudget === "value" ? "low" : rawBudget === "balanced" ? "mid" : rawBudget === "premium" ? "flexible" : input.budget;
  return {
    ...DEFAULT_ASSESSMENT,
    ...input,
    budget: legacyBudget ?? DEFAULT_ASSESSMENT.budget,
    habits: { ...DEFAULT_ASSESSMENT.habits, ...(input.habits ?? {}) },
  };
}

function loadScan(): ScanSignals | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const consent = loadConsent();
    if (!consent.saveScanHistory) {
      localStorage.removeItem(SCAN_KEY);
      return null;
    }
    const raw = localStorage.getItem(SCAN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
