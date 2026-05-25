export const LEGACY_PROGRESS_KEY = "progress_data";

export const getProgressStorageKey = (userId?: string | null): string => {
  if (userId) {
    return `progress_data_${userId}`;
  }
  return "progress_data_guest";
};

export const readProgressData = (userId?: string | null): {
  key: string;
  stored: string | null;
} => {
  const key = getProgressStorageKey(userId);
  const stored = window.localStorage.getItem(key);
  if (stored) {
    return { key, stored };
  }

  if (!userId) {
    const legacy = window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (legacy) {
      window.localStorage.setItem(key, legacy);
      window.localStorage.removeItem(LEGACY_PROGRESS_KEY);
      return { key, stored: legacy };
    }
  }

  return { key, stored: null };
};
