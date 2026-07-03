import { Link } from "react-router-dom";
import { BarChart3, Camera, CircleCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Layout } from "@/components/Layout";

const STEPS: Array<{ title: string; body: string; Icon: LucideIcon }> = [
  { title: "Scan Your Face", body: "Capture one consent-based photo so the AI can read visible skin patterns by zone.", Icon: Camera },
  { title: "Answer a Few Habit Questions", body: "Add context the camera cannot know: skin type, routine consistency, sensitivity, goal, and budget.", Icon: CircleCheck },
  { title: "Review Your Report", body: "See scores, strengths, improvement areas, face-zone observations, and routine suggestions.", Icon: BarChart3 },
];

export default function HowItWorks() {
  return (
    <Layout>
      <section className="container-page max-w-4xl py-16">
        <div className="text-eyebrow">How It Works</div>
        <h1 className="font-display mt-2 text-4xl md:text-5xl">A Required Scan, Then a Clear Plan.</h1>
        <div className="mt-10 grid gap-4">
          {STEPS.map(({ title, body, Icon }, index) => (
            <article key={title} className="surface-card flex gap-4 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">0{index + 1}</div>
                <h2 className="font-display text-xl">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            </article>
          ))}
        </div>
        <Link to="/start" className="cta-primary mt-10 inline-flex h-12 rounded-full px-7 text-sm font-semibold text-primary-foreground">
          Start Your Scan
        </Link>
      </section>
    </Layout>
  );
}
