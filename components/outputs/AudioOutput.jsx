'use client';

export default function AudioOutput({ data }) {
  const { title, script = '' } = data;
  const parts = script.split(/(\[pause\])/gi);
  return (
    <div>
      <p className="audio-title">🎙️ {title || 'Audio script'}</p>
      <div className="audio-script">
        {parts.map((part, i) =>
          /\[pause\]/i.test(part)
            ? <span key={i} className="ptag">[pause]</span>
            : <span key={i}>{part}</span>
        )}
      </div>
    </div>
  );
}
