// High-level fraud detection service.
// Combines TF-IDF text features with normalized structured features.
// Trained once per session (lazy singleton) on the seed dataset.

import { SEED_DATASET, type ClaimRow } from "./dataset";
import { fitTfidf, transformOne, type Vocab } from "./tfidf";
import {
  trainLogReg,
  predictProba,
  featureContributions,
  type LogRegModel,
} from "./logreg";

export type PredictionInput = {
  description: string;
  claim_amount?: number;
  policy_age_months?: number;
  claim_type?: string;
};

export type PredictionResult = {
  fraud_score: number;        // 0-100
  risk_level: "Low" | "Medium" | "High" | "Critical";
  confidence: number;         // 0-100
  top_features: Array<{ term: string; impact: number; direction: "fraud" | "genuine" }>;
  reasoning: string[];
};

const CLAIM_TYPES = ["auto", "property", "health", "other"];

// Structured feature vector appended after TF-IDF columns.
function structuredVector(input: PredictionInput): number[] {
  const amount = input.claim_amount ?? 0;
  const age = input.policy_age_months ?? 24;
  const type = (input.claim_type ?? "other").toLowerCase();
  // Log-scaled amount, normalized to roughly 0-1.
  const normAmount = Math.min(1, Math.log10(1 + amount) / 6);
  // Younger policies = higher fraud risk signal; normalize to 0-1.
  const youngPolicy = Math.max(0, 1 - Math.min(age, 60) / 60);
  // One-hot claim type.
  const oneHot = CLAIM_TYPES.map((t) => (type === t ? 1 : 0));
  // High-amount + young policy interaction.
  const interaction = normAmount * youngPolicy;
  return [normAmount, youngPolicy, interaction, ...oneHot];
}

const STRUCT_LABELS = [
  "high claim amount",
  "young policy",
  "high amount on new policy",
  "auto claim type",
  "property claim type",
  "health claim type",
  "other claim type",
];

type TrainedModel = {
  vocab: Vocab;
  textDim: number;
  model: LogRegModel;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    confusion: { tp: number; fp: number; tn: number; fn: number };
  };
};

let _cached: TrainedModel | null = null;

function buildVector(input: PredictionInput, vocab: Vocab, textDim: number): Float64Array {
  const text = transformOne(input.description, vocab);
  const struct = structuredVector(input);
  const out = new Float64Array(textDim + struct.length);
  out.set(text, 0);
  for (let i = 0; i < struct.length; i++) out[textDim + i] = struct[i];
  return out;
}

function trainOnce(): TrainedModel {
  const rows: ClaimRow[] = SEED_DATASET;
  const docs = rows.map((r) => r.description);
  const vocab = fitTfidf(docs, 400, 1);
  const textDim = vocab.terms.length;

  const X = rows.map((r) => buildVector(r, vocab, textDim));
  const y = rows.map((r) => r.label);
  const model = trainLogReg(X, y, { lr: 0.6, epochs: 400, l2: 0.02 });

  // Evaluate on training set (small dataset; informational).
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < X.length; i++) {
    const p = predictProba(model, X[i]);
    const pred = p >= 0.5 ? 1 : 0;
    const actual = y[i];
    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else fn++;
  }
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  const accuracy = (tp + tn) / Math.max(1, X.length);

  return {
    vocab,
    textDim,
    model,
    metrics: { accuracy, precision, recall, f1, confusion: { tp, fp, tn, fn } },
  };
}

export function getModel(): TrainedModel {
  if (!_cached) _cached = trainOnce();
  return _cached;
}

export function retrain(): TrainedModel {
  _cached = trainOnce();
  return _cached;
}

function riskLevel(score: number): PredictionResult["risk_level"] {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export function predictClaim(input: PredictionInput): PredictionResult {
  const { vocab, textDim, model } = getModel();
  const x = buildVector(input, vocab, textDim);
  const prob = predictProba(model, x);
  const score = Math.round(prob * 1000) / 10; // 0-100, 1 decimal

  // Confidence = distance from 0.5, scaled to 0-100.
  const confidence = Math.round(Math.abs(prob - 0.5) * 200);

  // Explainability: top contributing features (signed).
  const contribs = featureContributions(model, x);
  const labels: string[] = [...vocab.terms, ...STRUCT_LABELS];
  const ranked = Array.from(contribs)
    .map((c, i) => ({ term: labels[i] ?? `f${i}`, impact: c }))
    .filter((f) => Math.abs(f.impact) > 1e-6)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 8)
    .map((f) => ({
      term: f.term,
      impact: Math.round(f.impact * 1000) / 1000,
      direction: (f.impact > 0 ? "fraud" : "genuine") as "fraud" | "genuine",
    }));

  const reasoning: string[] = [];
  const fraudPushers = ranked.filter((r) => r.direction === "fraud").slice(0, 3);
  const genuinePushers = ranked.filter((r) => r.direction === "genuine").slice(0, 2);
  if (fraudPushers.length) {
    reasoning.push(
      `Suspicious signals: ${fraudPushers.map((f) => `"${f.term}"`).join(", ")}.`,
    );
  }
  if (genuinePushers.length) {
    reasoning.push(
      `Legitimate signals: ${genuinePushers.map((f) => `"${f.term}"`).join(", ")}.`,
    );
  }
  if ((input.claim_amount ?? 0) > 30000 && (input.policy_age_months ?? 99) < 6) {
    reasoning.push("High claim amount on a recently issued policy is a known fraud indicator.");
  }

  return {
    fraud_score: score,
    risk_level: riskLevel(score),
    confidence,
    top_features: ranked,
    reasoning,
  };
}

export function getMetrics() {
  return getModel().metrics;
}
