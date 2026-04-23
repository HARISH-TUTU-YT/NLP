import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FraudGuard" }] }),
  component: DashboardPage,
});

type Pred = {
  id: string;
  description: string;
  claim_amount: number | null;
  claim_type: string | null;
  fraud_score: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  source: string;
  created_at: string;
};

const RISK_COLORS: Record<string, string> = {
  Low: "oklch(0.65 0.18 150)",
  Medium: "oklch(0.75 0.18 70)",
  High: "oklch(0.62 0.24 20)",
  Critical: "oklch(0.5 0.25 15)",
};

function DashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Pred[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("predictions")
      .select("id, description, claim_amount, claim_type, fraud_score, risk_level, confidence, source, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Pred[]);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const stats = useMemo(() => {
    const total = rows.length;
    const fraudish = rows.filter((r) => r.risk_level === "High" || r.risk_level === "Critical").length;
    const avgScore = total ? rows.reduce((s, r) => s + Number(r.fraud_score), 0) / total : 0;
    return { total, fraudish, avgScore };
  }, [rows]);

  const riskData = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    rows.forEach((r) => { counts[r.risk_level] = (counts[r.risk_level] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const trendData = useMemo(() => {
    const byDay = new Map<string, { date: string; count: number; fraud: number }>();
    for (const r of rows) {
      const d = new Date(r.created_at).toISOString().slice(0, 10);
      const cur = byDay.get(d) ?? { date: d, count: 0, fraud: 0 };
      cur.count++;
      if (r.risk_level === "High" || r.risk_level === "Critical") cur.fraud++;
      byDay.set(d, cur);
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [rows]);

  const del = async (id: string) => {
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all your fraud predictions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Total predictions" value={stats.total.toString()} color="var(--primary)" />
        <StatCard icon={AlertTriangle} label="High/Critical risk" value={stats.fraudish.toString()} color="var(--danger)" />
        <StatCard icon={ShieldCheck} label="Avg fraud score" value={stats.avgScore.toFixed(1)} color="var(--warning)" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
          No predictions yet. Run a prediction or upload a CSV to get started.
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Risk distribution">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {riskData.map((d) => (
                      <Cell key={d.name} fill={RISK_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Predictions per day (last 14)">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="oklch(0.55 0.22 265)" name="Total" />
                  <Bar dataKey="fraud" fill="oklch(0.62 0.24 20)" name="Fraud" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 p-4 font-semibold">Recent predictions</div>
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">When</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Score</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/40">
                      <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="max-w-[300px] truncate p-3">{r.description}</td>
                      <td className="p-3 capitalize">{r.claim_type ?? "—"}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">{Number(r.fraud_score).toFixed(1)}</td>
                      <td className="p-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `color-mix(in oklab, ${RISK_COLORS[r.risk_level]} 15%, transparent)`,
                            color: RISK_COLORS[r.risk_level],
                          }}
                        >
                          {r.risk_level}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => del(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`, color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
