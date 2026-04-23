// NLP utilities: tokenization, stopword removal, light stemming/lemmatization.

const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","has","have","had","he","she","it","in","is",
  "of","on","or","that","the","to","was","were","will","with","i","my","me","we","our","you","your",
  "they","them","their","this","these","those","but","if","then","so","not","no","do","does","did",
  "been","being","because","while","when","what","which","who","how","there","here","just","also",
  "very","much","more","most","some","any","all","one","two","each","other","than","too","s","t",
]);

// Tiny rule-based lemmatizer/stemmer (covers common suffixes).
function lemmatize(token: string): string {
  if (token.length <= 3) return token;
  const rules: Array<[RegExp, string]> = [
    [/(.+)ies$/, "$1y"],
    [/(.+)sses$/, "$1ss"],
    [/(.+)ied$/, "$1y"],
    [/(.+)ying$/, "$1y"],
    [/(.+)ing$/, "$1"],
    [/(.+)edly$/, "$1"],
    [/(.+)ed$/, "$1"],
    [/(.+)ly$/, "$1"],
    [/(.+)es$/, "$1"],
    [/(.+)s$/, "$1"],
  ];
  for (const [re, rep] of rules) {
    const m = token.match(re);
    if (m && m[1].length >= 3) return token.replace(re, rep);
  }
  return token;
}

export function cleanText(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  const cleaned = cleanText(input);
  if (!cleaned) return [];
  const raw = cleaned.split(" ");
  const out: string[] = [];
  for (const tok of raw) {
    if (!tok || tok.length < 2) continue;
    if (STOPWORDS.has(tok)) continue;
    if (/^\d+$/.test(tok)) continue;
    out.push(lemmatize(tok));
  }
  return out;
}
