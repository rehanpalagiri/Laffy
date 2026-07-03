import { useMemo, useState } from "react";
import { Download, LockKeyhole, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useAssessment } from "@/state/AssessmentContext";
import { recommend, type Routine } from "@/lib/recommendation";
import { buildBundle, type ProductBundle } from "@/lib/productCatalog";
import { formatUsd } from "@/lib/economics";
import {
  buildAdminMetrics,
  buildAdminQualityCsv,
  buildAdminQualityRecord,
  type AdminQualityRecord,
} from "@/lib/adminQuality";

const ADMIN_KEY = import.meta.env.VITE_ADMIN_QC_KEY?.trim() ?? "";

export default function AdminQuality() {
  const { assessment, scan } = useAssessment();
  const [key, setKey] = useState("");
  const unlocked = Boolean(ADMIN_KEY) && key === ADMIN_KEY;
  const routine: Routine | null = useMemo(() => scan ? recommend({ ...assessment, scan }) : null, [assessment, scan]);
  const bundle: ProductBundle | null = useMemo(
    () => routine ? buildBundle(routine, assessment.budget, assessment.routinePreference) : null,
    [assessment.budget, assessment.routinePreference, routine],
  );
  const record = useMemo(
    () => buildAdminQualityRecord({ assessment, scan, routine, bundle }),
    [assessment, bundle, routine, scan],
  );
  const records = record && unlocked ? [record] : [];
  const metrics = buildAdminMetrics(records);

  const exportCsv = () => {
    if (!unlocked || !records.length) return;
    const blob = new Blob([buildAdminQualityCsv(records)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laffy-admin-scan-quality-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <section className="container-page py-12 md:py-16">
        <div className="grid gap-6 rounded-[2rem] border border-border/60 bg-card p-6 shadow-card md:grid-cols-[1fr_360px] md:p-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-accent-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Internal Quality Control
            </div>
            <h1 className="font-display mt-4 text-4xl md:text-5xl">Scan Monitoring Dashboard</h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              Review scan quality, failed uploads, recommendation diversity, model versions, and bundle pricing diagnostics from a restricted admin workspace.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/60 bg-muted/45 p-5">
            <div className="flex items-center gap-2 font-medium">
              <LockKeyhole className="h-4 w-4 text-primary" />
              Admin Access
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter your admin access key to view quality-control records and export protected diagnostics.
            </p>
            <input
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="Access code"
              className="mt-4 h-11 w-full rounded-full border border-border bg-card px-4 text-sm"
            />
          </div>
        </div>

        {!unlocked ? (
          <LockedState configured={Boolean(ADMIN_KEY)} />
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Total scans" value={metrics.totalScans} />
              <Metric label="Successful scans" value={metrics.successfulScans} />
              <Metric label="Needs review" value={metrics.casesNeedingReview} />
              <Metric label="Avg confidence" value={`${Math.round(metrics.averageConfidence * 100)}%`} />
              <Metric label="Failed scans" value={metrics.failedScans} />
              <Metric label="Non-face uploads" value={metrics.nonFaceUploads} />
              <Metric label="Low-quality uploads" value={metrics.lowQualityUploads} />
              <Metric label="Avg box price" value={formatUsd(metrics.averageBoxPrice)} />
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
              <section className="surface-card p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-eyebrow">Recent Scans</div>
                    <h2 className="font-display mt-2 text-2xl">Current Session</h2>
                  </div>
                  <button
                    type="button"
                    onClick={exportCsv}
                    disabled={!records.length}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-muted disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    Export QC CSV
                  </button>
                </div>
                <div className="mt-5 overflow-hidden rounded-2xl border border-border/60">
                  {records.length ? <RecordTable records={records} /> : <div className="p-5 text-sm text-muted-foreground">No scan is saved in this local session yet.</div>}
                </div>
              </section>

              <aside className="surface-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div className="text-eyebrow mt-5">Diversity signals</div>
                <DiversityList title="Brands" counts={metrics.brandCounts} />
                <DiversityList title="Categories" counts={metrics.categoryCounts} />
                <DiversityList title="Concerns" counts={metrics.concernCounts} />
              </aside>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}

function LockedState({ configured }: { configured: boolean }) {
  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-3">
      <InfoCard title={configured ? "Locked" : "Admin Access Not Configured"}>
        {configured
          ? "Enter the admin key to view quality-control data for the current saved scan."
          : "Admin quality controls are not configured for this environment."}
      </InfoCard>
      <InfoCard title="Admin Export Scope">
        CSV exports include scan metadata, quality flags, questionnaire context, recommended brands, categories, final box price, model version, and review status.
      </InfoCard>
      <InfoCard title="Sensitive-Data Rule">
        Export rows should use image references and anonymized user refs, not raw images, face geometry, biometric templates, or public scan URLs.
      </InfoCard>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display mt-2 text-3xl">{value}</div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="surface-card p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{children}</p>
    </article>
  );
}

function RecordTable({ records }: { records: AdminQualityRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Scan ID</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Quality flags</th>
            <th className="px-4 py-3">Brands</th>
            <th className="px-4 py-3">Box price</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.scanId} className="border-t border-border/60">
              <td className="px-4 py-3">{record.scanId}</td>
              <td className="px-4 py-3">{record.scanStatus}</td>
              <td className="px-4 py-3">{Math.round(record.aiConfidenceScore * 100)}%</td>
              <td className="px-4 py-3">{record.errorFlags.join(", ") || "None"}</td>
              <td className="px-4 py-3">{record.recommendedBrands.join(", ") || "None"}</td>
              <td className="px-4 py-3">{formatUsd(record.finalBoxPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiversityList({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div className="mt-5">
      <div className="font-medium">{title}</div>
      <div className="mt-3 grid gap-2 text-sm">
        {entries.length ? entries.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3 py-2">
            <span>{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        )) : <div className="text-muted-foreground">No data yet.</div>}
      </div>
    </div>
  );
}
