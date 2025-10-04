// Simple client-side semantic ranking utility using TF-IDF and cosine similarity.
// This is a lightweight AI-like implementation that reorders fetched GitHub
// repositories by relevance to a descriptive query.

const STOP_WORDS = new Set([
  'the','is','at','which','on','and','a','an','with','for','to','of','in','that','this','it','by','from','as','are','be','or','was','were','but','has','have','had','not','you','your'
]);

const tokenize = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[\p{P}$+<=>^`|~]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && !STOP_WORDS.has(t));
};

const termFreq = (tokens: string[]) => {
  const tf: Record<string, number> = {};
  tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
  return tf;
};

const computeIdf = (docsTokens: string[][]) => {
  const df: Record<string, number> = {};
  docsTokens.forEach((tokens) => {
    const seen = new Set(tokens);
    seen.forEach((t) => { df[t] = (df[t] || 0) + 1; });
  });
  const N = docsTokens.length || 1;
  const idf: Record<string, number> = {};
  Object.keys(df).forEach((t) => { idf[t] = Math.log((N) / (1 + df[t])); });
  return idf;
};

const dot = (a: Record<string, number>, b: Record<string, number>) => {
  let s = 0;
  Object.keys(a).forEach((k) => { if (b[k]) s += a[k] * b[k]; });
  return s;
};

const norm = (v: Record<string, number>) => {
  let s = 0;
  Object.keys(v).forEach((k) => { s += v[k] * v[k]; });
  return Math.sqrt(s);
};

export const computeSimilarityScores = <T = any>(query: string, docs: T[], getter?: (d: T) => string) => {
  if (!query || !docs || docs.length === 0) return docs;

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return docs;

  // Build tokens for each doc
  const docsTokens = docs.map((d) => tokenize(getter ? getter(d) : JSON.stringify(d)));

  const idf = computeIdf(docsTokens.concat([qTokens]));

  const qTf = termFreq(qTokens);
  const qVec: Record<string, number> = {};
  Object.keys(qTf).forEach((t) => { qVec[t] = qTf[t] * (idf[t] || 0); });

  const docVecs: Record<number, Record<string, number>> = {};
  docsTokens.forEach((tokens, i) => {
    const tf = termFreq(tokens);
    const v: Record<string, number> = {};
    Object.keys(tf).forEach((t) => { v[t] = tf[t] * (idf[t] || 0); });
    docVecs[i] = v;
  });

  const qNorm = norm(qVec) || 1;

  const scores = docs.map((d, i) => {
    const v = docVecs[i];
    const s = dot(qVec, v) / (qNorm * (norm(v) || 1));
    return { item: d, score: Number.isFinite(s) ? s : 0 };
  });

  // Sort by score desc, keep stable order for equal scores
  scores.sort((a, b) => b.score - a.score);

  return scores.map((s) => s.item);
};
