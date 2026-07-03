import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";

const STAGES = [
  "Checking scan quality and face positioning...",
  "Mapping visible skin patterns by zone...",
  "Blending scan results with your habit answers...",
  "Building a personalized routine match...",
];

export default function Analyzing() {
  const navigate = useNavigate();
  const { consent, scan } = useAssessment();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!scan) {
      navigate(consent.faceScan ? "/capture" : "/consent", { replace: true });
      return;
    }
    const t = setInterval(() => setI((x) => Math.min(x + 1, STAGES.length)), 700);
    const done = setTimeout(() => navigate("/results"), 2800);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [consent.faceScan, navigate, scan]);

  return (
    <Layout>
      <section className="container-prose py-24 text-center">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-secondary-soft shadow-lift">
          <div className="absolute inset-3 rounded-full border border-primary/60" />
          <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
          <div className="h-14 w-14 rounded-[40%] bg-gradient-brand shadow-card animate-pulse" />
        </div>
        <h1 className="font-display mt-7 text-3xl">Building Your AI Skin Report</h1>
        <p className="mt-2 text-muted-foreground">A quick scan-to-routine match, with your answers folded in.</p>
        <ul className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm">
          {STAGES.map((s, idx) => (
            <li key={s} className={`flex items-center gap-3 ${idx <= i ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${idx < i ? "bg-primary" : idx === i ? "bg-primary animate-pulse" : "bg-border"}`} />
              {s}
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
