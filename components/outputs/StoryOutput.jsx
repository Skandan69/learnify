'use client';

export default function StoryOutput({ data }) {
  const { scenes = [], takeaway } = data;
  return (
    <div>
      {scenes.map((s, i) => (
        <div key={i}>
          <div className="scene-label">{s.label}</div>
          <p className="scene-text">{s.text}</p>
        </div>
      ))}
      {takeaway && (
        <div className="takeaway">⭐ <strong>Key takeaway:</strong> {takeaway}</div>
      )}
    </div>
  );
}
