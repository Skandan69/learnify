'use client';
import { deleteFromHistory, clearHistory } from '@/lib/history';

export default function HistoryPanel({ history, onLoad, onRefresh, onClose }) {
  function handleDelete(e, id) {
    e.stopPropagation();
    deleteFromHistory(id);
    onRefresh();
  }

  function handleClear() {
    if (confirm('Clear all history?')) { clearHistory(); onRefresh(); }
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Recent transformations</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {history.length > 0 && (
            <button onClick={handleClear} style={{ fontSize: 12, color: 'var(--danger-text)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
          <button onClick={onClose} style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Close</button>
        </div>
      </div>

      {history.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '1rem 0' }}>No history yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onLoad(entry)}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '10px 12px',
                cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', background: 'var(--accent-bg)', padding: '1px 8px', borderRadius: 20, border: '1px solid var(--accent-border)' }}>
                    {entry.fmtLabel}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{entry.role}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.contentSnippet}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(entry.savedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, entry.id)}
                style={{ fontSize: 14, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
