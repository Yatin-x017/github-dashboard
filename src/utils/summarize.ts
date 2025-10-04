// Lightweight summarizer: strip markdown, pick first meaningful paragraph and
// return first ~20 words as a summary.

const stripMarkdown = (md: string) => {
  if (!md) return '';
  // remove code blocks, inline code, images, links, headings, emphasis
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~>-]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const summarizeToWords = (text: string, words = 20) => {
  if (!text) return '';
  const stripped = stripMarkdown(text);

  // prefer the first ~300 chars as a paragraph
  const candidate = stripped.slice(0, 1000);

  const toks = candidate.split(/\s+/).filter(Boolean);
  if (toks.length <= words) return toks.join(' ');
  return toks.slice(0, words).join(' ') + '...';
};
