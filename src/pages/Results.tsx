import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Download, PackageCheck, Share2, ShoppingBag, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";
import {
  recommend,
  type AssessmentInput,
  type FaceZoneInsight,
  type Routine,
  type RoutineStep,
  type ScanScores,
  type ScanSignals,
} from "@/lib/recommendation";
import type { AnalysisResult } from "@/lib/imageAnalysis";
import { buildStructuredSkinAnalysis } from "@/lib/skinAnalysis";
import { buildBundle, type ProductBundle, type RecommendedProduct } from "@/lib/productCatalog";
import { formatUsd } from "@/lib/economics";

export default function Results() {
  const { assessment, scan } = useAssessment();
  const report = useMemo(() => ensureStructuredScan(scan, assessment), [assessment, scan]);
  const routine: Routine | null = useMemo(
    () => report ? recommend({ ...assessment, scan: report }) : null,
    [assessment, report],
  );
  const bundle = useMemo(
    () => routine ? buildBundle(routine, assessment.budget, assessment.routinePreference) : null,
    [assessment.budget, assessment.routinePreference, routine],
  );

  if (!report || !routine) {
    return (
      <Layout>
        <section className="container-prose py-20">
          <div className="text-eyebrow">Scan required</div>
          <h1 className="font-display mt-2 text-4xl">Start with your face scan.</h1>
          <p className="mt-3 text-muted-foreground">The final AI report needs a completed appearance-based scan before it can generate results.</p>
          <Link to="/capture" className="cta-primary mt-6 inline-flex h-12 rounded-full px-7 text-sm font-semibold text-primary-foreground">
            <Sparkles className="h-4 w-4" />
            Start Your Scan
          </Link>
        </section>
      </Layout>
    );
  }

  const shareReport = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "My Laffy AI Skin Report",
        text: `Overall skin score: ${report.scores?.overall ?? "ready"}.`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <Layout>
      <section className="container-page py-12">
        <div className="result-hero">
          <div>
            <div className="text-eyebrow">AI skin report</div>
            <h1 className="font-display mt-2 text-4xl md:text-5xl">Your routine is built from your scan and answers.</h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              {report.summary}
            </p>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Now for the areas worth improving. These are normal and very fixable with the right routine.
            </p>
          </div>
          <div className="result-score-orb">
            <span>{report.scores?.overall ?? 86}</span>
            <small>Overall Skin Score</small>
          </div>
        </div>

        <SkinProfileSummary report={report} assessment={assessment} />

        <ScoreDashboard scores={report.scores} reliable={report.reliable} />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <InsightList title="Strengths" items={report.strengths ?? []} tone="positive" />
          <InsightList title="Areas to improve" items={report.improvements ?? []} tone="improve" />
        </div>

        <ZoneBreakdown zones={report.zones ?? []} />

        <section className="mt-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-eyebrow">Recommended routine</div>
              <h2 className="font-display mt-2 text-3xl md:text-4xl">Built from your scan and habits.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(report.suggestedRoutineFocus ?? []).map((item) => <Pill key={item}>{item}</Pill>)}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <RoutineColumn title="Morning" steps={routine.am} />
            <RoutineColumn title="Evening" steps={routine.pm} />
          </div>
        </section>

        {bundle && <ProductRecommendations bundle={bundle} />}

        <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="surface-card p-6">
            <div className="text-eyebrow">Habit recommendations</div>
            <ul className="mt-4 space-y-3 text-sm">
              {(report.recommendedHabits ?? []).map((habit) => (
                <li key={habit} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{habit}</span>
                </li>
              ))}
              {routine.notes.map((note) => (
                <li key={note} className="flex gap-3 text-muted-foreground">
                  <span className="mt-1 h-2 w-2 rounded-full bg-border" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface-card p-6">
            <div className="text-eyebrow">Manage report</div>
            <p className="mt-2 text-sm text-muted-foreground">Export includes consent, questionnaire answers, metadata, and analysis fields only. Raw photos are not included.</p>
            <div className="mt-5 grid gap-2">
              <Link to="/privacy-center" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-muted">
                <Download className="h-4 w-4" />
                Manage my data
              </Link>
              <button type="button" onClick={shareReport} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-muted">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </section>

        <div className="mt-10 rounded-3xl border border-border/60 bg-muted/50 p-5 text-sm text-muted-foreground">
          Laffy provides personalized skincare guidance only. It does not diagnose skin conditions or replace a licensed professional.
        </div>
      </section>
    </Layout>
  );
}

function ensureStructuredScan(scan: ScanSignals | null, assessment: AssessmentInput): ScanSignals | null {
  if (!scan) return null;
  if (scan.scores && scan.zones && scan.strengths && scan.improvements) return scan;
  return buildStructuredSkinAnalysis(scan as AnalysisResult, assessment);
}

function SkinProfileSummary({ report, assessment }: { report: ScanSignals; assessment: AssessmentInput }) {
  const scanFocus = (report.suggestedRoutineFocus ?? []).slice(0, 4);
  const answerContext = [
    assessment.skinFeel !== "unsure" ? `${assessment.skinFeel} skin feel` : "",
    assessment.sensitivity !== "unsure" ? `${assessment.sensitivity} sensitivity` : "",
    assessment.routinePreference ? `${assessment.routinePreference} routine` : "",
    assessment.fragranceFreeOnly ? "fragrance-free preference" : "",
  ].filter(Boolean);

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-3">
      <ProfileCard title="Your scan suggests" items={scanFocus.length ? scanFocus : ["Gentle cleanser", "Daily moisturizer", "Broad-spectrum SPF"]} />
      <ProfileCard title="Your answers added" items={answerContext.length ? answerContext : ["routine context", "budget range", "skin goals"]} />
      <ProfileCard title="Routine direction" items={buildRoutineDirection(report, assessment)} />
    </section>
  );
}

function ProfileCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="surface-card p-5">
      <div className="text-eyebrow">{title}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function buildRoutineDirection(report: ScanSignals, assessment: AssessmentInput): string[] {
  const items = ["balanced daily routine"];
  if (report.redness > 0.45 || assessment.sensitivity === "high") items.push("calming barrier support");
  if (report.shine > 0.45 || assessment.goals.includes("oil-control")) items.push("lightweight oil control");
  if (report.darkSpots > 0.4 || assessment.goals.includes("dark-spot-appearance")) items.push("tone-evening support");
  if (!assessment.habits.sunscreen) items.push("daily SPF habit");
  return Array.from(new Set(items)).slice(0, 4);
}

function ScoreDashboard({ scores, reliable }: { scores?: ScanScores; reliable: boolean }) {
  const items: Array<[keyof ScanScores, string]> = [
    ["overall", "Overall Skin Score"],
    ["clarity", "Clarity Score"],
    ["texture", "Texture Score"],
    ["oilShine", "Oil/Shine Score"],
    ["redness", "Redness Score"],
    ["toneEvenness", "Tone Evenness Score"],
    ["routineMatch", "Routine Match Score"],
  ];

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="h-4 w-4 text-primary" />
          Scan signals
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${reliable ? "bg-primary-soft text-accent-foreground" : "bg-secondary-soft text-secondary-foreground"}`}>
          Confidence: {reliable ? "High" : "Low-quality image fallback"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([key, label]) => <ScoreCard key={key} label={label} value={scores?.[key] ?? 0} />)}
      </div>
    </section>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "improve" }) {
  return (
    <section className="surface-card p-6">
      <div className="text-eyebrow">{title}</div>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className={`mt-1 h-2 w-2 rounded-full ${tone === "positive" ? "bg-primary" : "bg-secondary"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ZoneBreakdown({ zones }: { zones: FaceZoneInsight[] }) {
  return (
    <section className="mt-12">
      <div className="text-eyebrow">Face-zone breakdown</div>
      <h2 className="font-display mt-2 text-3xl md:text-4xl">Where your routine should focus.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones.map((zone) => (
          <article key={zone.zone} className="surface-card p-5 transition hover:-translate-y-1 hover:shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl">{zone.zone}</h3>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{zone.severity}</span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Observation</dt>
                <dd className="mt-1">{zone.observation}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Focus</dt>
                <dd className="mt-1">{zone.focus}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Why</dt>
                <dd className="mt-1 text-muted-foreground">{zone.explanation}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductRecommendations({ bundle }: { bundle: ProductBundle }) {
  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-eyebrow">Personalized bundle</div>
          <h2 className="font-display mt-2 text-3xl md:text-4xl">Your curated skincare box.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            These products are selected as one complete routine, with the reasoning included so the box feels personal and easy to follow.
          </p>
        </div>
        <span className="rounded-full bg-primary-soft px-4 py-2 text-sm text-accent-foreground">{bundle.budgetStatus}</span>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          {bundle.products.map((item) => <ProductRecommendationCard key={item.product.id} item={item} />)}
        </div>
        <aside className="bundle-price-card lg:sticky lg:top-24">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PackageCheck className="h-4 w-4 text-primary" />
            Curated box price
          </div>
          <div className="mt-5">
            <div className="font-display text-5xl">{formatUsd(bundle.bundlePrice)}</div>
            <p className="mt-2 text-sm text-muted-foreground">plus tax and shipping</p>
          </div>
          <div className="mt-5 rounded-2xl border border-border/60 bg-card/70 p-4 text-sm leading-6 text-muted-foreground">
            Includes {bundle.products.length} routine products, your routine guide, and Laffy's matching logic in one curated package.
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Budget target</span>
              <span className="font-medium">{bundle.budgetLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Routine style</span>
              <span className="font-medium">Personalized box</span>
            </div>
          </div>
          <button type="button" className="cta-primary mt-6 h-12 w-full rounded-full px-7 text-sm font-semibold text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
            {bundle.checkoutLabel}
          </button>
        </aside>
      </div>
    </section>
  );
}

function ProductRecommendationCard({ item }: { item: RecommendedProduct }) {
  const { product } = item;
  return (
    <article className="surface-card p-5 transition hover:-translate-y-1 hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{product.category.replace(/-/g, " ")}</div>
            <h3 className="font-display mt-1 text-xl">{product.brand} {product.name}</h3>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">Included</span>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Best for</dt>
            <dd className="mt-1">{item.concernMatch}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Why Laffy picked it</dt>
            <dd className="mt-1 text-muted-foreground">{item.reasons.slice(0, 2).join(". ")}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Use</dt>
              <dd className="mt-1">{item.schedule}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">How often</dt>
              <dd className="mt-1">{item.frequency}</dd>
            </div>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs text-accent-foreground">{item.budgetFit}</span>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">In your box</span>
        </div>
    </article>
  );
}

function RoutineColumn({ title, steps }: { title: string; steps: RoutineStep[] }) {
  return (
    <div>
      <h3 className="font-display mb-4 text-2xl">{title}</h3>
      <ol className="space-y-3">
        {steps.length === 0 && <li className="surface-card p-6 text-sm text-muted-foreground">No suitable steps found with your current filters. Try loosening a preference.</li>}
        {steps.map((step) => (
          <li key={step.product.id} className="surface-card p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5">Step {step.step}</span>
                <span className="capitalize">{step.category.replace(/-/g, " ")}</span>
              </div>
              <div className="mt-2 font-display text-lg">{step.product.brand} · {step.product.name}</div>
              <div className="text-xs text-muted-foreground">{step.product.size} · included in your curated box</div>
              {step.reasons.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {step.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
              {step.patchTestNote && (
                <div className="mt-3 rounded-lg bg-secondary-soft p-2 text-xs text-secondary-foreground">{step.patchTestNote}</div>
              )}
              </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-primary-soft px-3 py-1 text-xs text-accent-foreground">{children}</span>;
}
