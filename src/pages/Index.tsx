import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ClipboardList,
  PackageCheck,
  ScanFace,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { ReviewsSection } from "@/components/ReviewsSection";

interface Chapter {
  number: string;
  label: string;
  title: string;
  copy: string;
  detail: string;
  icon: LucideIcon;
  proof: string[];
}

const CHAPTERS: Chapter[] = [
  {
    number: "001",
    label: "Scan",
    title: "A face scan that reads like a map, not a mystery.",
    copy: "Upload one clear photo after consent and Laffy turns visible concerns into an easy zone-by-zone summary.",
    detail: "The scan separates visible signals across areas like cheeks, forehead, chin, and T-zone so the routine starts from what is actually showing.",
    icon: Camera,
    proof: ["Zone readout", "Strengths first", "Cosmetic only"],
  },
  {
    number: "002",
    label: "Goals",
    title: "Your skin goals shape the recommendation.",
    copy: "A short questionnaire adds the context a photo cannot see: skin type, sensitivity, budget, and how much routine you will actually follow.",
    detail: "Instead of forcing a long quiz, Laffy uses only the answers that change the final box.",
    icon: SlidersHorizontal,
    proof: ["Skin type", "Sensitivity", "Budget fit"],
  },
  {
    number: "003",
    label: "Routine",
    title: "Every product gets a reason.",
    copy: "The result is not a random product list. Each pick is tied to one visible concern, one goal, or one constraint you gave Laffy.",
    detail: "Your routine is organized by role so the next step feels obvious: cleanse, treat, hydrate, protect.",
    icon: ClipboardList,
    proof: ["Why picked", "Routine role", "Simple order"],
  },
  {
    number: "004",
    label: "Box",
    title: "A curated box without the crowded shelf.",
    copy: "Laffy keeps the box focused around what your scan and answers can support, then leaves room to adjust as your skin changes.",
    detail: "The goal is clarity: fewer products, clearer reasons, and a routine you can repeat.",
    icon: PackageCheck,
    proof: ["Curated set", "Clear next step", "Adjustable"],
  },
];

const ROUTINE_PICKS = [
  { role: "Cleanse", why: "Keeps the scan routine gentle before treatment steps." },
  { role: "Treat", why: "Targets the highest-priority visible concern first." },
  { role: "Hydrate", why: "Balances dryness or sensitivity signals from your answers." },
  { role: "Protect", why: "Keeps the routine practical for daytime use." },
];

const SIGNALS = ["T-zone", "Cheeks", "Texture", "Tone", "Hydration", "Sensitivity"];

export default function Index() {
  return (
    <Layout>
      <Hero />
      <ChapterSection />
      <RoutineLogic />
      <ReviewsSection />
    </Layout>
  );
}

function Hero() {
  return (
    <section className="premium-hero overflow-hidden">
      <div className="container-page relative grid min-h-[calc(100svh-4rem)] gap-10 py-14 md:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] md:items-center md:py-20">
        <div className="laffy-wordmark" aria-hidden>
          Laffy
        </div>
        <div className="relative z-10 animate-fade-up">
          <div className="chapter-kicker">
            <span>001</span>
            Laffy AI skincare
          </div>
          <h1 className="text-display mt-5 max-w-5xl text-[clamp(3rem,6.2vw,5.75rem)]">
            Your Skin Scan. Your Routine. Your Box.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            Laffy scans your skin, asks a few quick questions, and builds a personalized skincare box around your goals.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/start" className="cta-primary h-14 rounded-full px-8 text-base font-extrabold text-primary-foreground">
              <ScanFace className="h-5 w-5" />
              Start Your Scan
            </Link>
            <a href="#chapters" className="cta-ghost h-14 rounded-full px-7 text-base font-extrabold">
              See the system
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-5 flex max-w-md items-start gap-2 text-sm leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
            Cosmetic guidance only. Your scan runs after clear consent.
          </p>
        </div>
        <SkinTwinVisual />
      </div>
    </section>
  );
}

function SkinTwinVisual() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div
      className="skin-twin-stage scroll-reveal"
      data-cursor="soft"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((event.clientY - rect.top) / rect.height - 0.5) * -10,
          y: ((event.clientX - rect.left) / rect.width - 0.5) * 10,
        });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      aria-label="Laffy scan and routine visualization"
    >
      <div className="skin-twin-shell" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <div className="skin-twin-orb">
          <span className="scan-zone scan-zone-one" />
          <span className="scan-zone scan-zone-two" />
          <span className="scan-zone scan-zone-three" />
          <span className="scan-sweep" />
        </div>
        <div className="routine-box">
          <span />
          <strong>Routine Box</strong>
          <small>4 focused steps</small>
        </div>
        <div className="ingredient-chip ingredient-chip-one">Hydrate</div>
        <div className="ingredient-chip ingredient-chip-two">Brighten</div>
        <div className="ingredient-chip ingredient-chip-three">Balance</div>
      </div>
    </div>
  );
}

function ChapterSection() {
  return (
    <section id="chapters" className="chapter-section border-y border-border/60">
      <div className="container-page py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-[0.95fr_1.25fr] md:items-end">
          <div className="scroll-reveal">
            <div className="chapter-kicker">
              <span>System</span>
              Product logic
            </div>
            <h2 className="font-display mt-4 text-4xl font-black leading-[0.98] md:text-6xl">
              Four chapters, one calm routine.
            </h2>
          </div>
          <p className="scroll-reveal max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            The best skincare tech disappears into decisions that feel clear. Laffy moves from scan to box without making the user decode a dashboard.
          </p>
        </div>

        <div className="mt-12 grid gap-4">
          {CHAPTERS.map((chapter) => (
            <ChapterCard key={chapter.number} chapter={chapter} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <article className="chapter-card scroll-reveal">
      <div className="chapter-number">{chapter.number}</div>
      <div className="chapter-icon">
        <chapter.icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-eyebrow">{chapter.label}</div>
        <h3 className="mt-2 font-display text-2xl font-black leading-tight md:text-4xl">{chapter.title}</h3>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{chapter.copy}</p>
      </div>
      <div className="chapter-proof">
        <p>{chapter.detail}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {chapter.proof.map((item) => (
            <span key={item} className="proof-pill">
              {item}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function RoutineLogic() {
  return (
    <section className="routine-section">
      <div className="container-page grid gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-24">
        <div className="scroll-reveal">
          <div className="chapter-kicker">
            <span>Proof</span>
            Why this box
          </div>
          <h2 className="font-display mt-4 text-4xl font-black leading-[1] md:text-6xl">
            Product picks with visible reasons.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Laffy connects scan signals, skin goals, sensitivity, and budget into a routine that explains itself before anything lands in the box.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SIGNALS.map((signal) => (
              <div key={signal} className="signal-tile">
                <BadgeCheck className="h-4 w-4" />
                {signal}
              </div>
            ))}
          </div>
        </div>

        <div className="routine-board scroll-reveal" data-cursor="soft">
          <div className="routine-board-header">
            <div>
              <div className="text-eyebrow">Routine logic</div>
              <h3 className="mt-1 text-2xl font-black">Personalized box draft</h3>
            </div>
            <Sparkles className="h-6 w-6 text-foreground" />
          </div>
          <div className="mt-6 grid gap-3">
            {ROUTINE_PICKS.map((pick, index) => (
              <div key={pick.role} className="routine-row">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{pick.role}</strong>
                <p>{pick.why}</p>
              </div>
            ))}
          </div>
          <Link to="/start" className="cta-primary mt-6 h-12 rounded-full px-6 text-sm font-extrabold text-primary-foreground">
            Start Your Scan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
