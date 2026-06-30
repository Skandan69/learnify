'use client';
import { useState } from 'react';

export default function ImageStoryOutput({ data }) {
  const { scenes = [] } = data;
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  async function generateImage(i, prompt) {
    setLoading((prev) => ({ ...prev, [i]: true }));
    setErrors((prev) => ({ ...prev, [i]: null }));
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Image generation failed');
      setImages((prev) => ({ ...prev, [i]: json.image }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [i]: e.message }));
    } finally {
      setLoading((prev) => ({ ...prev, [i]: false }));
    }
  }

  async function generateAll() {
    for (let i = 0; i < scenes.length; i++) {
      if (!images[i]) await generateImage(i, scenes[i].prompt);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button className="btn-ghost" style={{ width: 'auto', padding: '6px 14px', fontSize: 13 }} onClick={generateAll}>
          🎨 Generate all images
        </button>
      </div>

      {scenes.map((s, i) => (
        <div key={i} style={{ marginBottom: '1.5rem' }}>
          <div className="scene-label">{s.label}</div>
          <p className="scene-text">{s.text}</p>

          {images[i] ? (
            <img
              src={images[i]}
              alt={s.label}
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginTop: '0.5rem', display: 'block' }}
            />
          ) : (
            <div style={{
              background: 'var(--surface2)', border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              textAlign: 'center', marginTop: '0.5rem',
            }}>
              {loading[i] ? (
                <div className="loader" style={{ justifyContent: 'center' }}>
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
              ) : (
                <>
                  {errors[i] && <p style={{ color: 'var(--danger-text)', fontSize: 12, marginBottom: 8 }}>{errors[i]}</p>}
                  <button
                    className="btn-ghost"
                    style={{ width: 'auto', padding: '6px 14px', fontSize: 13 }}
                    onClick={() => generateImage(i, s.prompt)}
                  >
                    🖼️ Generate image
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="note" style={{ marginTop: '1rem', fontSize: 12 }}>
        <span>💡 Tip: save the images and combine them in CapCut or Canva to create a video story.</span>
      </div>
    </div>
  );
}
