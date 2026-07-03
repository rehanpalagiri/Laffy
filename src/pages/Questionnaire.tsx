import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";
import type { AssessmentInput, BudgetTier } from "@/lib/recommendation";
import type { ConcernTag, SkinFeel, Sensitivity } from "@/lib/products";

const SKIN_TYPES: Array<{ value: SkinFeel | "unsure"; label: string }> = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry" },
  { value: "combination", label: "Combination" },
  { value: "balanced", label: "Normal" },
  { value: "unsure", label: "Not sure" },
];

const HABITS: Array<{ key: keyof AssessmentInput["habits"]; label: string }> = [
  { key: "cleanser", label: "I use cleanser" },
  { key: "moisturizer", label: "I moisturize" },
  { key: "sunscreen", label: "I use sunscreen" },
  { key: "exfoliate", label: "I exfoliate" },
  { key: "acneTreatments", label: "I use acne treatments" },
];

const CONSISTENCY: Array<{ value: AssessmentInput["routineConsistency"]; label: string }> = [
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "most-days", label: "Most days" },
  { value: "daily", label: "Every day" },
];

const SENSITIVITY: Array<{ value: Sensitivity | "unsure"; label: string }> = [
  { value: "low", label: "Not sensitive" },
  { value: "medium", label: "Slightly sensitive" },
  { value: "high", label: "Very sensitive" },
  { value: "unsure", label: "Not sure" },
];

const GOALS: Array<{ value: ConcernTag | "simple-routine"; label: string; goals: ConcernTag[] }> = [
  { value: "blemish-prone", label: "Fewer breakouts", goals: ["blemish-prone"] },
  { value: "oil-control", label: "Less oiliness", goals: ["oil-control"] },
  { value: "uneven-texture", label: "Smoother texture", goals: ["uneven-texture"] },
  { value: "dark-spot-appearance", label: "More even tone", goals: ["dark-spot-appearance"] },
  { value: "visible-redness", label: "Less redness appearance", goals: ["visible-redness", "barrier"] },
  { value: "simple-routine", label: "Build a simple routine", goals: ["hydration", "sunscreen"] },
];

const PREFERENCES: Array<{ value: AssessmentInput["routinePreference"]; label: string; help: string }> = [
  { value: "simple", label: "Simple routine", help: "3-4 products" },
  { value: "standard", label: "Standard routine", help: "4-6 products" },
  { value: "complete", label: "Complete routine", help: "6-8 products" },
];

const BUDGETS: Array<{ value: BudgetTier; label: string; help: string }> = [
  { value: "low", label: "Low Budget", help: "Under $50 total" },
  { value: "mid", label: "Mid Budget", help: "$50-$100 total" },
  { value: "high", label: "High Budget", help: "$100-$200 total" },
  { value: "flexible", label: "Flexible", help: "Best match, even if it costs more" },
];

export default function Questionnaire() {
  const navigate = useNavigate();
  const { assessment, consent, scan, setAssessment } = useAssessment();
  const [step, setStep] = useState(0);
  const total = 8;

  useEffect(() => {
    if (!scan) navigate(consent.faceScan ? "/capture" : "/consent", { replace: true });
  }, [consent.faceScan, navigate, scan]);

  const next = () => setStep((value) => Math.min(value + 1, total - 1));
  const prev = () => setStep((value) => Math.max(value - 1, 0));
  const finish = () => navigate("/analyzing");

  return (
    <Layout>
      <section className="container-page max-w-3xl py-12">
        <div className="text-eyebrow">Context questions · step {step + 1} of {total}</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>

        <div className="surface-card mt-8 min-h-[360px] p-6 md:p-8">
          {step === 0 && (
            <Section title="What is your skin type?">
              <Choices
                value={assessment.skinFeel}
                options={SKIN_TYPES}
                onChange={(value) => setAssessment({ skinFeel: value as SkinFeel | "unsure" })}
              />
            </Section>
          )}

          {step === 1 && (
            <Section title="Which habits are already in your routine?">
              <div className="grid gap-2 sm:grid-cols-2">
                {HABITS.map((habit) => {
                  const selected = assessment.habits[habit.key];
                  return (
                    <button
                      key={habit.key}
                      type="button"
                      onClick={() => setAssessment({ habits: { ...assessment.habits, [habit.key]: !selected } })}
                      className={`choice-card ${selected ? "choice-card-selected" : ""}`}
                    >
                      <span>{habit.label}</span>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section title="How consistent is your routine?">
              <Choices
                value={assessment.routineConsistency}
                options={CONSISTENCY}
                onChange={(value) => setAssessment({ routineConsistency: value as AssessmentInput["routineConsistency"] })}
              />
            </Section>
          )}

          {step === 3 && (
            <Section title="How sensitive does your skin tend to be?">
              <Choices
                value={assessment.sensitivity}
                options={SENSITIVITY}
                onChange={(value) => setAssessment({ sensitivity: value as Sensitivity | "unsure" })}
              />
            </Section>
          )}

          {step === 4 && (
            <Section title="What is your main goal?">
              <Choices
                value={assessment.mainGoal}
                options={GOALS}
                onChange={(value) => {
                  const selected = GOALS.find((goal) => goal.value === value);
                  setAssessment({ mainGoal: value as AssessmentInput["mainGoal"], goals: selected?.goals ?? [] });
                }}
              />
            </Section>
          )}

          {step === 5 && (
            <Section title="Do you want a simple or complete routine?">
              <Choices
                value={assessment.routinePreference}
                options={PREFERENCES}
                onChange={(value) => setAssessment({ routinePreference: value as AssessmentInput["routinePreference"] })}
              />
            </Section>
          )}

          {step === 6 && (
            <Section title="Any ingredient or fragrance preferences?">
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setAssessment({ fragranceFreeOnly: !assessment.fragranceFreeOnly })}
                  className={`choice-card ${assessment.fragranceFreeOnly ? "choice-card-selected" : ""}`}
                >
                  <span>
                    <span className="block">Fragrance-free products only</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Best for easily reactive or sensitive-feeling skin.</span>
                  </span>
                  {assessment.fragranceFreeOnly && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
                <label className="block">
                  <span className="text-sm font-medium">Ingredients to avoid</span>
                  <input
                    value={assessment.allergies.join(", ")}
                    onChange={(event) => setAssessment({ allergies: event.target.value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) })}
                    placeholder="Example: fragrance, shea butter"
                    className="mt-2 h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                  />
                  <span className="mt-2 block text-xs text-muted-foreground">Separate multiple ingredients with commas.</span>
                </label>
              </div>
            </Section>
          )}

          {step === 7 && (
            <Section title="What monthly skincare budget should Laffy build around?">
              <Choices
                value={assessment.budget}
                options={BUDGETS}
                onChange={(value) => setAssessment({ budget: value as BudgetTier })}
              />
            </Section>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={prev} disabled={step === 0} className="h-11 rounded-full border border-border bg-card px-6 text-sm font-medium disabled:opacity-40">Back</button>
          {step < total - 1 ? (
            <button type="button" onClick={next} className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Next</button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={!assessment.mainGoal}
              className="cta-primary h-11 rounded-full px-7 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Get My AI Report
            </button>
          )}
        </div>
      </section>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Choices({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string; help?: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`choice-card ${value === option.value ? "choice-card-selected" : ""}`}
        >
          <span>
            <span className="block">{option.label}</span>
            {option.help && <span className="mt-1 block text-xs text-muted-foreground">{option.help}</span>}
          </span>
          {value === option.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
        </button>
      ))}
    </div>
  );
}
