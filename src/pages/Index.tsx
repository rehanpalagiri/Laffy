import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, ClipboardList, PackageCheck, ScanFace } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ReviewsSection } from "@/components/ReviewsSection";

const PROCESS_STEPS = [
  {
    title: "Scan Your Skin",
    copy: "Upload a clear face photo so Laffy can understand visible skin concerns.",
    icon: Camera,
  },
  {
    title: "Answer a Few Questions",
    copy: "Tell us about your skin type, goals, sensitivity, budget, and routine style.",
    icon: ClipboardList,
  },
  {
    title: "Get Your Routine Box",
    copy: "We build a curated skincare box around your scan and answers.",
    icon: PackageCheck,
  },
] as const;

export default function Index() {
  return (
    <Layout>
      <Hero />
      <ProcessSection />
      <ReviewsSection />
    </Layout>
  );
}

function Hero() {
  return (
    <section className="surface-hero overflow-hidden">
      <div className="container-page grid min-h-[calc(100vh-4rem)] gap-10 py-14 md:grid-cols-[minmax(0,1fr)_430px] md:items-center md:py-20">
        <div className="animate-fade-up">
          <div className="text-eyebrow">Laffy AI Skincare</div>
          <h1 className="text-display mt-3 max-w-4xl">Your Skin Scan. Your Routine. Your Box.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Laffy scans your skin, asks a few quick questions, and builds a personalized skincare box around your goals.
          </p>
          <div className="mt-8">
            <Link to="/start" className="cta-primary h-14 rounded-full px-8 text-base font-extrabold text-primary-foreground">
              <ScanFace className="h-5 w-5" />
              Start Your Scan
            </Link>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            Cosmetic guidance only. Your scan runs after clear consent.
          </p>
        </div>
        <LaffyHeroObject />
      </div>
    </section>
  );
}

function LaffyHeroObject() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div
      className="laffy-orb-stage scroll-reveal"
      data-cursor="soft"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((event.clientY - rect.top) / rect.height - 0.5) * -12,
          y: ((event.clientX - rect.left) / rect.width - 0.5) * 12,
        });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      aria-hidden
    >
      <div className="laffy-orb-ring" />
      <div
        className="laffy-orb-core"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      />
      <div className="laffy-capsule laffy-capsule-one" />
      <div className="laffy-capsule laffy-capsule-two" />
      <div className="absolute left-[18%] top-[70%] rounded-full border border-border/70 bg-card/75 px-4 py-2 text-sm font-bold shadow-card backdrop-blur">
        Skin Scan
      </div>
      <div className="absolute right-[5%] top-[12%] rounded-full border border-border/70 bg-card/75 px-4 py-2 text-sm font-bold shadow-card backdrop-blur">
        Routine Box
      </div>
    </div>
  );
}

function ProcessSection() {
  return (
    <section className="border-y border-border/60 bg-card/55">
      <div className="container-page py-14 md:py-16">
        <div className="max-w-2xl scroll-reveal">
          <div className="text-eyebrow">How It Works</div>
          <h2 className="font-display mt-2 text-3xl font-extrabold md:text-4xl">Three steps. One personal routine.</h2>
          <p className="mt-4 text-muted-foreground">
            A short guided flow keeps the scan useful without turning skincare into homework.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PROCESS_STEPS.map((step, index) => (
            <article key={step.title} className="surface-card scroll-reveal p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-foreground shadow-soft">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-bold text-muted-foreground">Step {index + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
