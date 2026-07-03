import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Download, FileJson, RotateCcw, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";
import { resetConsent } from "@/lib/consent";
import { buildLocalExportCsv, buildLocalExportJson } from "@/lib/dataExport";

export default function PrivacyCenter() {
  const { consent, setConsent, reset, scan, setScan, assessment } = useAssessment();

  const deleteScanData = () => { setScan(null); };
  const download = (contents: string, type: string, filename: string) => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const exportJson = () => download(
    buildLocalExportJson({ consent, assessment, scan }),
    "application/json",
    "laffy-local-data-export.json",
  );
  const exportCsv = () => download(
    buildLocalExportCsv({ consent, assessment, scan }),
    "text/csv;charset=utf-8",
    "laffy-local-data-export.csv",
  );
  const deleteAccount = () => {
    if (!confirm("Delete all locally stored Laffy data on this device?")) return;
    resetConsent(); reset(); window.location.href = "/";
  };

  const consentSummary = [
    ["Age Confirmed", consent.ageConfirmed18],
    ["Face Scan", consent.faceScan],
    ["Cloud AI", consent.cloudAiAnalysis],
    ["Scan Accuracy", consent.aggregateContribution],
  ] as const;

  return (
    <Layout>
      <section className="container-page py-12 md:py-16">
        <div className="grid gap-6 rounded-[2rem] border border-border/60 bg-card p-6 shadow-card md:grid-cols-[1fr_340px] md:p-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-accent-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Data Controls
            </div>
            <h1 className="font-display mt-4 text-4xl md:text-5xl">Your skincare data stays understandable.</h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              Review what is stored on this device, export a clean copy, or clear scan data whenever you want. Raw face photos, biometric templates, and face geometry are not included in exports.
            </p>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-border/60 bg-muted/45 p-4">
            {consentSummary.map(([label, active]) => (
              <StatusRow key={label} label={label} active={active} />
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="surface-card p-6 md:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-eyebrow">Privacy Posture</div>
                <h2 className="font-display mt-2 text-2xl">Built for local control.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Laffy keeps this page practical: consent settings, scan history, questionnaire answers, and analysis metadata are all handled from one place.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <TrustNote title="Exportable by design">
                CSV and JSON exports include consent, questionnaire answers, metadata, scores, and result fields.
              </TrustNote>
              <TrustNote title="Photo-conscious">
                Export files do not include raw image data or biometric templates. Cloud AI analysis only runs when you opt in on the scan consent screen.
              </TrustNote>
              <TrustNote title="Reversible choices">
                You can revoke scan consent or clear saved scan signals without changing your legal access to privacy notices.
              </TrustNote>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link to="/legal/privacy-notice" className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-muted">
                  Privacy Policy
                </Link>
                <Link to="/legal/terms" className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-muted">
                  Terms of Service
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <ActionCard
              icon={<SlidersHorizontal className="h-5 w-5" />}
              title="Revoke Face-Scan Consent"
              onClick={() => setConsent({ faceScan: false, cloudAiAnalysis: false, saveScanHistory: false })}
            >
              Stops future photo analysis, cloud AI analysis, and saved scan history on this device.
            </ActionCard>
            <ActionCard
              icon={<SlidersHorizontal className="h-5 w-5" />}
              title="Cloud AI Analysis"
              onClick={() => setConsent({ cloudAiAnalysis: !consent.cloudAiAnalysis })}
              detail={consent.cloudAiAnalysis ? "Currently on" : "Currently off"}
            >
              Choose whether new scans may send a downscaled image to Gemini for richer cosmetic analysis.
            </ActionCard>
            <ActionCard
              icon={<RotateCcw className="h-5 w-5" />}
              title="Scan Accuracy"
              onClick={() => setConsent({ aggregateContribution: !consent.aggregateContribution })}
              detail={consent.aggregateContribution ? "Currently on" : "Currently off"}
            >
              Choose whether de-identified scan quality signals can help improve accuracy and reduce incorrect results.
            </ActionCard>
            <ActionCard icon={<Trash2 className="h-5 w-5" />} title="Delete Scan Data" onClick={deleteScanData}>
              Clears saved scan signals while keeping your other local preferences in place.
            </ActionCard>
            <ActionCard icon={<Download className="h-5 w-5" />} title="Export CSV" onClick={exportCsv}>
              Download a tidy spreadsheet-style copy of your local Laffy data.
            </ActionCard>
            <ActionCard icon={<FileJson className="h-5 w-5" />} title="Export JSON" onClick={exportJson}>
              Download the same local data in a structured JSON format.
            </ActionCard>
            <ActionCard icon={<Trash2 className="h-5 w-5" />} title="Delete All Local Data" onClick={deleteAccount} destructive>
              Wipes consents, questionnaire answers, and scan signals from this device.
            </ActionCard>
          </section>
        </div>
      </section>
    </Layout>
  );
}

function StatusRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-primary-soft text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        {active ? "On" : "Off"}
      </span>
    </div>
  );
}

function TrustNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/45 p-4">
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function ActionCard({
  title,
  children,
  onClick,
  icon,
  detail,
  destructive,
}: {
  title: string;
  children: ReactNode;
  onClick: () => void;
  icon: ReactNode;
  detail?: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col justify-between rounded-[1.5rem] border bg-card p-5 text-left shadow-card transition hover:-translate-y-1 hover:shadow-lift ${destructive ? "border-destructive/35" : "border-border/60"}`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${destructive ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"}`}>
        {icon}
      </span>
      <span>
        {detail && <span className="mb-2 inline-flex rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{detail}</span>}
        <span className={`block font-display text-xl ${destructive ? "text-destructive" : ""}`}>{title}</span>
        <span className="mt-2 block text-sm leading-6 text-muted-foreground">{children}</span>
      </span>
    </button>
  );
}
