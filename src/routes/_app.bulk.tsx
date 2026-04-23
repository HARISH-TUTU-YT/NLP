import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { predictClaim, type PredictionResult } from "@/lib/ml/predict";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/bulk")({
  head: () => ({ meta: [{ title: "Bulk CSV — FraudGuard" }] }),
  component: BulkPage,
});

type Row = {
  description: string;
  claim_amount?: number;
  policy_age_months?: number;
  claim_type?: string;
  result?: PredictionResult;
};

// Minimal CSV parser supporting quoted fields with commas/escaped quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((v) => v.trim().length));
}

function toCsv(rows: Row[]): string {
  const header = ["description", "claim_amount", "policy_age_months", "claim_type", "fraud_score", "risk_level", "confidence", "top_signals"];
  const lines = [header.join(",")];
  for (const r of rows) {
    if (!r.result) continue;
    const top = r.result.top_features.slice(0, 3).map((f) => `${f.term}(${f.direction})`).join("; ");
    const cols = [
      JSON.stringify(r.description),
      r.claim_amount ?? "",
      r.policy_age_months ?? "",
      r.claim_type ?? "",
      r.result.fraud_score,
      r.result.risk_level,
      r.result.confidence,
      JSON.stringify(top),
    ];
    lines.push(cols.join(","));
  }
  return lines.join("\n");
}

function BulkPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length < 2) {
        toast.error("CSV must have a header row and at least one data row.");
        return;
      }
      const header = parsed[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      const dIdx = idx("description");
      if (dIdx < 0) {
        toast.error('CSV must include a "description" column.');
        return;
      }
      const aIdx = idx("claim_amount");
      const pIdx = idx("policy_age_months");
      const tIdx = idx("claim_type");

      const dataRows: Row[] = parsed.slice(1, 501).map((r) => ({
        description: r[dIdx] ?? "",
        claim_amount: aIdx >= 0 && r[aIdx] ? Number(r[aIdx]) : undefined,
        policy_age_months: pIdx >= 0 && r[pIdx] ? Number(r[pIdx]) : undefined,
        claim_type: tIdx >= 0 ? r[tIdx] : undefined,
      }));

      const scored = dataRows.map((row) => ({
        ...row,
        result: predictClaim(row),
      }));
      setRows(scored);
      toast.success(`Scored ${scored.length} claims.`);

      // Persist to history (capped insert).
      if (user && scored.length) {
        const insertRows = scored.slice(0, 100).map((r) => ({
          user_id: user.id,
          claim_amount: r.claim_amount ?? null,
          claim_type: r.claim_type ?? null,
          policy_age_months: r.policy_age_months ?? null,
          description: r.description.slice(0, 2000),
          fraud_score: r.result!.fraud_score,
          risk_level: r.result!.risk_level,
          confidence: r.result!.confidence,
          top_features: r.result!.top_features,
          source: "bulk",
        }));
        await supabase.from("predictions").insert(insertRows);
      }
    } catch (err) {
      toast.error(`Failed to parse CSV: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fraud_predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSample = () => {
    const sample =
      "description,claim_amount,policy_age_months,claim_type\n" +
      '"Rear ended at a red light, police report filed",3200,36,auto\n' +
      '"Total loss after a fire destroyed everything, just renewed coverage",75000,1,property\n' +
      '"Storm damaged shingles, contractor estimate attached",4800,48,property\n';
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_claims.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk CSV scoring</h1>
          <p className="text-muted-foreground">Upload up to 500 claims at once.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadSample}>
          <Download className="mr-1 h-4 w-4" /> Sample CSV
        </Button>
      </div>

      <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary hover:bg-accent/30">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Click to upload a CSV file</p>
          <p className="text-sm text-muted-foreground">Required column: description. Optional: claim_amount, policy_age_months, claim_type.</p>
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {busy && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </label>

      {rows.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 p-4">
            <h2 className="font-semibold">{rows.length} predictions</h2>
            <Button size="sm" onClick={download}>
              <Download className="mr-1 h-4 w-4" /> Download results
            </Button>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="max-w-[300px] truncate p-3">{r.description}</td>
                    <td className="p-3 capitalize">{r.claim_type ?? "—"}</td>
                    <td className="p-3 text-right tabular-nums">
                      {r.claim_amount ? `$${r.claim_amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {r.result?.fraud_score.toFixed(1)}
                    </td>
                    <td className="p-3">
                      <RiskBadge level={r.result!.risk_level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!rows.length && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <Upload className="mx-auto mb-2 h-5 w-5" />
          No CSV uploaded yet.
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }: { level: "Low" | "Medium" | "High" | "Critical" }) {
  const color =
    level === "Critical" || level === "High" ? "var(--danger)" : level === "Medium" ? "var(--warning)" : "var(--success)";
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
    >
      {level}
    </span>
  );
}
