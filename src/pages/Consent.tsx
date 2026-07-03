import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Lock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";

export default function Consent() {
  const navigate = useNavigate();
  const { consent, setConsent } = useAssessment();
  const [scanOk, setScanOk] = useState(false);
  const [improvement, setImprovement] = useState(true);

  if (!consent.ageConfirmed18) {
    return (
      <Layout>
        <section className="container-prose py-20">
          <p>Please confirm your age first.</p>
          <Link to="/start" className="mt-4 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Back to start</Link>
        </section>
      </Layout>
    );
  }

  const proceedWithScan = () => {
    if (!scanOk) return;
    setConsent({ faceScan: true, saveScanHistory: false, aggregateContribution: improvement });
    navigate("/capture");
  };

  return (
    <Layout>
      <section className="container-prose py-16">
        <div className="text-eyebrow">Photo Consent</div>
        <h1 className="font-display mt-2 text-4xl">Your scan starts with a clear yes.</h1>
        <p className="mt-3 text-muted-foreground">
          Before you scan, review how your scan data is used. Laffy uses one face photo to generate appearance-based skincare analysis, check upload quality, reduce scan errors, and build your routine recommendations. It does not diagnose medical conditions or identify you.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="surface-card p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl">What happens next</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The scan estimates visible concerns like shine, texture, visible redness, spot contrast, and face-zone differences. Scan metadata may be reviewed internally for quality control, failed-scan detection, and recommendation accuracy.
                </p>
              </div>
            </div>
          </div>

          <label className="surface-card flex cursor-pointer items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={scanOk}
              onChange={(event) => setScanOk(event.target.checked)}
            />
            <span>
              <span className="block font-extrabold">I Consent</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                I agree to let Laffy process my scan to generate my skin analysis and personalized routine.
              </span>
            </span>
          </label>

          <label className="surface-card flex cursor-pointer items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={improvement}
              onChange={(event) => setImprovement(event.target.checked)}
            />
            <span>
              <span className="block font-extrabold">Scan Accuracy</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                Allow Laffy to use scan quality signals to improve accuracy and reduce incorrect results.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={proceedWithScan}
            disabled={!scanOk}
            className="cta-primary h-12 rounded-full px-7 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            Continue to Scan
          </button>
          <Link to="/legal/privacy-notice" className="text-sm text-muted-foreground underline underline-offset-4">Read Privacy Policy</Link>
          <Link to="/legal/terms" className="text-sm text-muted-foreground underline underline-offset-4">Read Terms</Link>
        </div>
      </section>
    </Layout>
  );
}
