import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";

export default function Pricing() {
  return (
    <Layout>
      <section className="container-page max-w-4xl py-16">
        <div className="text-eyebrow">Access</div>
        <h1 className="font-display mt-2 text-4xl md:text-5xl">Start With the AI Scan.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The core scan report and routine guidance are available without marketing-cookie requirements or distracting product prompts.
        </p>
        <div className="mt-10 surface-card p-7">
          <div className="text-eyebrow">Included</div>
          <ul className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <li>AI skin analysis with face-zone breakdown</li>
            <li>Scores for clarity, texture, shine, redness, and tone</li>
            <li>Short habit questionnaire</li>
            <li>Personalized AM/PM routine suggestions</li>
            <li>Privacy-safe export controls</li>
            <li>No medical diagnosis claims</li>
          </ul>
          <Link to="/start" className="cta-primary mt-7 inline-flex h-12 rounded-full px-7 text-sm font-semibold text-primary-foreground">
            Start Your Scan
          </Link>
        </div>
      </section>
    </Layout>
  );
}
