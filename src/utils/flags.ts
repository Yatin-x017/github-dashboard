// Simple localStorage-backed flag store for repo items.
// Keyed by repo id.

const KEY_PREFIX = 'repo_flags_';

export const getFlagsFor = (id: any): string[] => {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${id}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    return [];
  }
};

export const setFlagsFor = (id: any, flags: string[]) => {
  try {
    localStorage.setItem(`${KEY_PREFIX}${id}`, JSON.stringify(flags));
    return flags;
  } catch (e) {
    return flags;
  }
};

export const toggleFlagFor = (id: any, flag: string): string[] => {
  const current = getFlagsFor(id);
  const exists = current.includes(flag);
  const updated = exists ? current.filter((f) => f !== flag) : [...current, flag];
  setFlagsFor(id, updated);
  return updated;
};
