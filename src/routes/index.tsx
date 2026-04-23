import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Brain, Zap, BarChart3, FileSpreadsheet, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FraudGuard — AI-Powered Insurance Fraud Detection" },
      { name: "description", content: "Detect fraudulent insurance claims in real time using NLP and machine learning. TF-IDF, logistic regression, explainable AI." },
      { property: "og:title", content: "FraudGuard — AI Insurance Fraud Detection" },
      { property: "og:description", content: "Real-time fraud scoring with explainable AI for insurance claims." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "NLP-powered analysis", desc: "TF-IDF + logistic regression analyzes claim narratives for suspicious patterns." },
  { icon: Zap, title: "Real-time scoring", desc: "Fraud probability and risk level returned in under a second." },
  { icon: Shield, title: "Explainable AI", desc: "See exactly which words and signals influenced the decision." },
  { icon: Mic, title: "Voice input", desc: "Dictate claim descriptions hands-free with browser speech recognition." },
  { icon: FileSpreadsheet, title: "Bulk CSV scoring", desc: "Upload thousands of claims and download scored results." },
  { icon: BarChart3, title: "Analytics dashboard", desc: "Track fraud trends, risk distribution, and prediction history." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-hero)] opacity-[0.07]" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-success" />
            Powered by TF-IDF + Logistic Regression
          </div>
          <h1 className="mx-auto max-w-3xl bg-[var(--gradient-hero)] bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
            Detect insurance fraud before it costs you.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            FraudGuard analyzes claim descriptions and structured data with NLP and machine
            learning. Get a fraud score, risk level, and clear explanation in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">Start detecting</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/predict">Try a prediction</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border/60 bg-[var(--gradient-card)] p-6 shadow-sm transition-shadow hover:shadow-[var(--shadow-soft)]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        FraudGuard — Educational demo. Not for production underwriting decisions.
      </footer>
    </div>
  );
}
