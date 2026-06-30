'use client';

export default function VisualOutput({ data }) {
  const { panels = [] } = data;
  return (
    <div className="vis-grid">
      {panels.map((p, i) => (
        <div key={i} className="vis-panel">
          <div className="vis-emoji">{p.emoji || '📌'}</div>
          <p className="vis-title">{p.title}</p>
          <p className="vis-desc">{p.description}</p>
        </div>
      ))}
    </div>
  );
}
