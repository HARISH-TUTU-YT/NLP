// TF-IDF vectorizer with vocabulary capture for explainability.
import { tokenize } from "./nlp";

export type Vocab = {
  index: Record<string, number>; // term -> column index
  idf: number[];                 // idf weight per index
  terms: string[];               // index -> term
};

export function fitTfidf(docs: string[], maxFeatures = 600, minDf = 2): Vocab {
  const tokenized = docs.map(tokenize);
  const df = new Map<string, number>();
  for (const tokens of tokenized) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = docs.length;
  const candidates = [...df.entries()]
    .filter(([, c]) => c >= minDf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFeatures);

  const index: Record<string, number> = {};
  const terms: string[] = [];
  const idf: number[] = [];
  candidates.forEach(([term, count], i) => {
    index[term] = i;
    terms.push(term);
    idf.push(Math.log((1 + N) / (1 + count)) + 1);
  });
  return { index, idf, terms };
}

export function transformOne(text: string, vocab: Vocab): Float64Array {
  const tokens = tokenize(text);
  const tf = new Map<number, number>();
  for (const tok of tokens) {
    const idx = vocab.index[tok];
    if (idx === undefined) continue;
    tf.set(idx, (tf.get(idx) ?? 0) + 1);
  }
  const vec = new Float64Array(vocab.terms.length);
  let norm = 0;
  for (const [idx, count] of tf) {
    const v = count * vocab.idf[idx];
    vec[idx] = v;
    norm += v * v;
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

export function transformMany(docs: string[], vocab: Vocab): Float64Array[] {
  return docs.map((d) => transformOne(d, vocab));
}
