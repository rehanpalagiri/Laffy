import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";

export default function AgeGate() {
  const navigate = useNavigate();
  const { setConsent } = useAssessment();
  const [blocked, setBlocked] = useState(false);

  const confirm = (eighteen: boolean) => {
    if (!eighteen) { setBlocked(true); return; }
    setConsent({ ageConfirmed18: true });
    navigate("/consent");
  };

  return (
    <Layout>
      <section className="container-prose py-20">
        <div className="text-eyebrow">Before Your Scan</div>
        <h1 className="font-display text-4xl mt-2">Are you 18 or older?</h1>
        <p className="mt-3 text-muted-foreground">
          Laffy is designed for adults. We don't process parental-consent workflows for minors at this time.
        </p>
        {!blocked ? (
          <div className="mt-8 flex gap-3">
            <button onClick={() => confirm(true)} className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90">Yes, Start Your Scan</button>
            <button onClick={() => confirm(false)} className="h-11 rounded-full border border-border bg-card px-6 text-sm font-medium hover:bg-muted">I'm Under 18</button>
          </div>
        ) : (
          <div className="mt-8 surface-card p-6">
            <h2 className="font-display text-2xl">Thanks for being honest.</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Laffy isn't available for users under 18. If you have a skincare concern, talking with a parent or guardian and a licensed clinician is a great next step.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
