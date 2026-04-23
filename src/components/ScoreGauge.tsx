// Visual fraud score gauge.
import { cn } from "@/lib/utils";

export function ScoreGauge({
  score,
  level,
}: {
  score: number;
  level: "Low" | "Medium" | "High" | "Critical";
}) {
  const pct = Math.max(0, Math.min(100, score));
  const colorVar =
    level === "Critical" || level === "High"
      ? "var(--danger)"
      : level === "Medium"
        ? "var(--warning)"
        : "var(--success)";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex h-44 w-44 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${colorVar} ${pct * 3.6}deg, oklch(0.94 0.01 250) 0deg)`,
        }}
      >
        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-card shadow-inner">
          <span className="text-4xl font-bold tabular-nums" style={{ color: colorVar }}>
            {pct.toFixed(1)}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Fraud score</span>
        </div>
      </div>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-sm font-semibold",
        )}
        style={{ backgroundColor: `color-mix(in oklab, ${colorVar} 15%, transparent)`, color: colorVar }}
      >
        {level} risk
      </span>
    </div>
  );
}
