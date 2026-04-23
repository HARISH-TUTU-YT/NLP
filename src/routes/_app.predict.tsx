import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Copy, Download, RotateCcw, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScoreGauge } from "@/components/ScoreGauge";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { predictClaim, getMetrics, type PredictionResult } from "@/lib/ml/predict";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/predict")({
  head: () => ({ meta: [{ title: "Predict — FraudGuard" }] }),
  component: PredictPage,
});

const RISK_COLORS: Record<string, string> = {
  Low: "var(--success)",
  Medium: "var(--warning)",
  High: "var(--danger)",
  Critical: "var(--danger)",
};

function PredictPage() {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [policyAgeYears, setPolicyAgeYears] = useState("");
  const [policyAgeMonths, setPolicyAgeMonths] = useState("");
  const [policyAgeDays, setPolicyAgeDays] = useState("");
  const [claimType, setClaimType] = useState("auto");
  const [claimantName, setClaimantName] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedPayload, setSavedPayload] = useState<Record<string, unknown> | null>(null);
  const metrics = getMetrics();
  const resultRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setDescription("");
    setAmount("");
    setPolicyAgeYears("");
    setPolicyAgeMonths("");
    setPolicyAgeDays("");
    setClaimantName("");
    setNotes("");
    setResult(null);
    setSavedPayload(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error("Please describe the claim in at least 10 characters.");
      return;
    }
    setBusy(true);

    const y = policyAgeYears || "0";
    const m = policyAgeMonths || "0";
    const d = policyAgeDays || "0";
    const isActiveAge = policyAgeYears || policyAgeMonths || policyAgeDays;
    const totalMonths = isActiveAge ? (Number(y) * 12) + Number(m) + (Number(d) / 30) : undefined;

    const payload = {
      description,
      claim_amount: amount ? Number(amount) : undefined,
      policy_age_months: totalMonths,
      claim_type: claimType,
    };

    const r = predictClaim(payload);
    setResult(r);
    setSavedPayload({ ...payload, claimant_name: claimantName, notes, timestamp: new Date().toISOString() });

    if (user) {
      const { error } = await supabase.from("predictions").insert({
        user_id: user.id,
        claim_amount: amount ? Number(amount) : null,
        claim_type: claimType,
        policy_age_months: totalMonths !== undefined ? totalMonths : null,
        description,
        fraud_score: r.fraud_score,
        risk_level: r.risk_level,
        confidence: r.confidence,
        top_features: r.top_features,
        source: "single",
      });
      if (error) toast.error(`Could not save prediction: ${error.message}`);
      else toast.success("Prediction saved to history");
    }
    setBusy(false);
  };

  const copyResult = () => {
    if (!result || !savedPayload) return;
    const text = `
FraudGuard Claim Report
========================
Claimant: ${savedPayload.claimant_name || "N/A"}
Claim Type: ${savedPayload.claim_type}
Claim Amount: ${savedPayload.claim_amount ? `$${Number(savedPayload.claim_amount).toLocaleString()}` : "N/A"}
Policy Age: ${savedPayload.policy_age_months ? `${Number(savedPayload.policy_age_months).toFixed(1)} months` : "N/A"}
Date: ${new Date(String(savedPayload.timestamp)).toLocaleString()}

Fraud Score: ${result.fraud_score.toFixed(1)} / 100
Risk Level: ${result.risk_level}
Confidence: ${result.confidence}%

Reasoning:
${result.reasoning.map((r) => `• ${r}`).join("\n")}

Description:
${savedPayload.description}

Notes:
${savedPayload.notes || "None"}
    `.trim();
    navigator.clipboard.writeText(text).then(() => toast.success("Report copied to clipboard!"));
  };

  const downloadReport = () => {
    if (!result || !savedPayload) return;
    const text = `
FraudGuard Claim Report
========================
Claimant: ${savedPayload.claimant_name || "N/A"}
Claim Type: ${savedPayload.claim_type}
Claim Amount: ${savedPayload.claim_amount ? `$${Number(savedPayload.claim_amount).toLocaleString()}` : "N/A"}
Policy Age: ${savedPayload.policy_age_months ? `${Number(savedPayload.policy_age_months).toFixed(1)} months` : "N/A"}
Date: ${new Date(String(savedPayload.timestamp)).toLocaleString()}

Fraud Score: ${result.fraud_score.toFixed(1)} / 100
Risk Level: ${result.risk_level}
Confidence: ${result.confidence}%

Reasoning:
${result.reasoning.map((r) => `• ${r}`).join("\n")}

Top Signals:
${result.top_features.slice(0, 6).map((f) => `• ${f.term} (${f.direction === "fraud" ? "↑ increases" : "↓ decreases"} fraud score)`).join("\n")}

Description:
${savedPayload.description}

Notes:
${savedPayload.notes || "None"}
    `.trim();

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyze a claim</h1>
          <p className="text-muted-foreground">Enter claim details and get an instant fraud score with explanation.</p>
        </div>
        {result && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" /> New claim
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={submit} className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          {/* Claimant Name */}
          <div className="space-y-2">
            <Label htmlFor="claimant-name">Claimant name (optional)</Label>
            <Input
              id="claimant-name"
              placeholder="John Smith"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Claim type</Label>
              <Select value={claimType} onValueChange={setClaimType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="life">Life</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Claim amount ($)</Label>
              <Input id="amount" type="number" min="0" placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Policy age <span className="text-xs text-muted-foreground font-normal">(Years / Months / Days)</span></Label>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" min="0" placeholder="Years" value={policyAgeYears} onChange={(e) => setPolicyAgeYears(e.target.value)} />
                <Input type="number" min="0" max="11" placeholder="Months" value={policyAgeMonths} onChange={(e) => setPolicyAgeMonths(e.target.value)} />
                <Input type="number" min="0" max="30" placeholder="Days" value={policyAgeDays} onChange={(e) => setPolicyAgeDays(e.target.value)} />
              </div>
              {(policyAgeYears || policyAgeMonths || policyAgeDays) && (
                <p className="text-xs text-muted-foreground">
                  ≈ {((Number(policyAgeYears || 0) * 12) + Number(policyAgeMonths || 0) + (Number(policyAgeDays || 0) / 30)).toFixed(1)} total months
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="desc">Claim description</Label>
              <VoiceInputButton onTranscript={(t) => setDescription((prev) => (prev ? prev + " " : "") + t)} />
            </div>
            <Textarea
              id="desc"
              rows={5}
              placeholder="Describe what happened, when, where, and any supporting evidence..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{description.length} characters</p>
          </div>

          {/* Notes field */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-1">
              <StickyNote className="h-3.5 w-3.5" /> Internal notes (optional)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Add any internal notes or flags not included in the claim description..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button id="btn-detect-fraud" type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {busy ? "Analyzing..." : "Detect fraud"}
          </Button>

          <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <Stat label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(0)}%`} />
            <Stat label="Precision" value={`${(metrics.precision * 100).toFixed(0)}%`} />
            <Stat label="Recall" value={`${(metrics.recall * 100).toFixed(0)}%`} />
            <Stat label="F1" value={metrics.f1.toFixed(2)} />
          </div>
        </form>

        {/* Result */}
        <div ref={resultRef} className="rounded-xl border border-border/60 bg-[var(--gradient-card)] p-6 shadow-sm">
          {!result ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="mb-3 h-10 w-10 opacity-30" />
              <p>Submit a claim to see the fraud analysis here.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Risk Banner */}
              <div
                className="rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2"
                style={{
                  backgroundColor: `color-mix(in oklab, ${RISK_COLORS[result.risk_level]} 12%, transparent)`,
                  color: RISK_COLORS[result.risk_level],
                  border: `1px solid color-mix(in oklab, ${RISK_COLORS[result.risk_level]} 30%, transparent)`,
                }}
              >
                {result.risk_level === "Low" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {result.risk_level === "Low" && "Low Risk — Claim appears legitimate"}
                {result.risk_level === "Medium" && "Medium Risk — Warrants manual review"}
                {result.risk_level === "High" && "High Risk — Likely fraudulent, investigate"}
                {result.risk_level === "Critical" && "Critical Risk — Likely fraudulent, escalate immediately"}
              </div>

              <ScoreGauge score={result.fraud_score} level={result.risk_level} />

              <div className="rounded-lg bg-muted/50 p-3 text-center text-sm">
                Confidence: <span className="font-semibold">{result.confidence}%</span>
              </div>

              {result.reasoning.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold text-sm">
                    {result.risk_level === "Low" ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    Why this score
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {result.reasoning.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Top influential signals</h3>
                <div className="space-y-1.5">
                  {result.top_features.slice(0, 6).map((f) => {
                    const max = Math.max(...result.top_features.map((x) => Math.abs(x.impact)));
                    const widthPct = (Math.abs(f.impact) / max) * 100;
                    const color = f.direction === "fraud" ? "var(--danger)" : "var(--success)";
                    return (
                      <div key={f.term}>
                        <div className="mb-0.5 flex justify-between text-xs">
                          <span className="font-mono">{f.term}</span>
                          <span className="text-muted-foreground">
                            {f.direction === "fraud" ? "↑ fraud" : "↓ fraud"}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full transition-all" style={{ width: `${widthPct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Button variant="outline" size="sm" onClick={copyResult} className="flex-1">
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy report
                </Button>
                <Button variant="outline" size="sm" onClick={downloadReport} className="flex-1">
                  <Download className="mr-1 h-3.5 w-3.5" /> Download .txt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <div className="font-semibold text-foreground">{value}</div>
      <div>{label}</div>
    </div>
  );
}
