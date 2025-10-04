const STORAGE_KEY = 'repo_flags_v1';

type FlagName = 'red' | 'yellow' | 'blue' | 'green' | 'violet';

const loadAll = (): Record<string, FlagName[]> => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveAll = (data: Record<string, FlagName[]>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
};

export const getFlagsFor = (repoId: string | number): FlagName[] => {
  const all = loadAll();
  return all[String(repoId)] || [];
};

export const toggleFlagFor = (repoId: string | number, flag: FlagName): FlagName[] => {
  const all = loadAll();
  const key = String(repoId);
  const existing = new Set(all[key] || []);
  if (existing.has(flag)) existing.delete(flag); else existing.add(flag);
  all[key] = Array.from(existing);
  saveAll(all);
  return all[key];
};

export const setFlagsFor = (repoId: string | number, flags: FlagName[]) => {
  const all = loadAll();
  all[String(repoId)] = flags;
  saveAll(all);
};

export const clearFlags = (repoId: string | number) => {
  const all = loadAll();
  delete all[String(repoId)];
  saveAll(all);
};

export type { FlagName };
