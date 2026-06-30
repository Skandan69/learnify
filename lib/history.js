const HISTORY_KEY = 'learnify_history';
const MAX_HISTORY = 20;

export function getHistory() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveToHistory({ role, fmt, contentSnippet, fmtLabel, parsed }) {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      role,
      fmt,
      fmtLabel,
      contentSnippet: contentSnippet.slice(0, 120).trim() + (contentSnippet.length > 120 ? '…' : ''),
      parsed,
      savedAt: new Date().toISOString(),
    };
    const updated = [entry, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return entry;
  } catch {
    // localStorage may be full — silently ignore
  }
}

export function deleteFromHistory(id) {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function clearHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
