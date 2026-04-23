// Binary Logistic Regression with L2 regularization, trained via batch gradient descent.

export type LogRegModel = {
  weights: Float64Array;
  bias: number;
};

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

export function trainLogReg(
  X: Float64Array[],
  y: number[],
  opts: { lr?: number; epochs?: number; l2?: number } = {},
): LogRegModel {
  const lr = opts.lr ?? 0.5;
  const epochs = opts.epochs ?? 250;
  const l2 = opts.l2 ?? 0.01;
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const weights = new Float64Array(d);
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Float64Array(d);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      const xi = X[i];
      let z = bias;
      for (let j = 0; j < d; j++) z += weights[j] * xi[j];
      const p = sigmoid(z);
      const err = p - y[i];
      gradB += err;
      for (let j = 0; j < d; j++) gradW[j] += err * xi[j];
    }
    bias -= (lr * gradB) / n;
    for (let j = 0; j < d; j++) {
      weights[j] -= (lr * (gradW[j] / n + l2 * weights[j]));
    }
  }
  return { weights, bias };
}

export function predictProba(model: LogRegModel, x: Float64Array): number {
  let z = model.bias;
  for (let j = 0; j < model.weights.length; j++) z += model.weights[j] * x[j];
  return sigmoid(z);
}

// Per-feature contribution (weight * value) for explainability.
export function featureContributions(
  model: LogRegModel,
  x: Float64Array,
): Float64Array {
  const out = new Float64Array(x.length);
  for (let j = 0; j < x.length; j++) out[j] = model.weights[j] * x[j];
  return out;
}
