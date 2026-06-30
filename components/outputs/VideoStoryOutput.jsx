'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = [
  ['#1a1a2e', '#16213e', '#e94560'],
  ['#0f3460', '#533483', '#e94560'],
  ['#1b1b2f', '#2c2c54', '#f5a623'],
  ['#162447', '#1f4068', '#1b6ca8'],
  ['#1a1a1a', '#2d2d2d', '#00b4d8'],
  ['#0d0d0d', '#1a1a2e', '#7209b7'],
  ['#0a0a23', '#1a1a3e', '#06d6a0'],
  ['#1c1c1e', '#2c2c2e', '#ff6b6b'],
];

export default function VideoStoryOutput({ data }) {
  const { scenes = [], title = '' } = data;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [images, setImages] = useState({});
  const [imgLoading, setImgLoading] = useState({});
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef(null);
  const progRef = useRef(null);
  const blobUrls = useRef({});
  const fetchingImg = useRef({});

  const fetchImage = useCallback(async (idx) => {
    if (images[idx] || fetchingImg.current[idx] || !scenes[idx]) return;
    fetchingImg.current[idx] = true;
    setImgLoading(l => ({ ...l, [idx]: true }));
    try {
      const scene = scenes[idx];
      const prompt = `${scene.title}. ${scene.narration.slice(0, 120)}`;
      const res = await fetch('/api/scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const d = await res.json();
      if (d.image) setImages(im => ({ ...im, [idx]: d.image }));
    } catch (e) {}
    setImgLoading(l => ({ ...l, [idx]: false }));
    fetchingImg.current[idx] = false;
  }, [images, scenes]);

  useEffect(() => {
    fetchImage(current);
    if (current + 1 < scenes.length) fetchImage(current + 1);
  }, [current, scenes.length]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    clearInterval(progRef.current);
    setLoadingAudio(false);
  }, []);

  const goToScene = useCallback((idx, autoPlay = false) => {
    stopAudio();
    setCurrent(idx);
    setAnimKey(k => k + 1);
    setProgress(0);
    if (autoPlay) setPlaying(true);
  }, [stopAudio]);

  const playScene = useCallback(async (idx) => {
    if (!scenes[idx]) { setPlaying(false); return; }
    const narration = scenes[idx].narration;
    setLoadingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: narration }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (blobUrls.current[idx]) URL.revokeObjectURL(blobUrls.current[idx]);
      blobUrls.current[idx] = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      setLoadingAudio(false);

      audio.ontimeupdate = () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => {
        setProgress(100);
        setTimeout(() => {
          if (idx + 1 < scenes.length) goToScene(idx + 1, true);
          else setPlaying(false);
        }, 600);
      };
      audio.onerror = () => {
        if (idx + 1 < scenes.length) goToScene(idx + 1, true);
        else setPlaying(false);
      };
      await audio.play();
    } catch (e) {
      setLoadingAudio(false);
      // fallback timer
      const dur = 6000;
      const start = Date.now();
      progRef.current = setInterval(() => {
        const p = Math.min(100, ((Date.now() - start) / dur) * 100);
        setProgress(p);
        if (p >= 100) {
          clearInterval(progRef.current);
          if (idx + 1 < scenes.length) goToScene(idx + 1, true);
          else setPlaying(false);
        }
      }, 50);
    }
  }, [scenes, goToScene]);

  useEffect(() => {
    if (playing) playScene(current);
    else stopAudio();
    return () => stopAudio();
  }, [playing, current]);

  useEffect(() => () => {
    stopAudio();
    Object.values(blobUrls.current).forEach(u => URL.revokeObjectURL(u));
  }, []);

  if (!scenes.length) return <p style={{ color: 'var(--text2)' }}>No scenes generated.</p>;

  const scene = scenes[current];
  const [bg1, bg2, accent] = COLORS[current % COLORS.length];
  const imgSrc = images[current] ? `data:image/jpeg;base64,${images[current]}` : null;

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {title && (
        <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          {title}
        </p>
      )}

      <div
        key={animKey}
        style={{
          position: 'relative', borderRadius: 12, overflow: 'hidden',
          minHeight: 340, display: 'flex', flexDirection: 'column',
          background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
          boxShadow: `0 0 0 1px ${accent}22, 0 8px 32px #0008`,
          animation: 'fadeInScene 0.5s ease',
        }}
      >
        {/* AI background image with Ken Burns */}
        {imgSrc && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img
              src={imgSrc}
              alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                animation: 'kenBurns 14s ease-in-out forwards',
                opacity: 0.5,
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(135deg, ${bg1}bb 0%, ${bg2}88 100%)`,
            }} />
          </div>
        )}

        {/* Image loading indicator */}
        {imgLoading[current] && !imgSrc && (
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            background: '#00000077', borderRadius: 6, padding: '4px 10px',
          }}>
            <span style={{ fontSize: 11, color: '#fff8' }}>✨ Generating scene...</span>
          </div>
        )}

        {/* Audio loading indicator */}
        {loadingAudio && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 2,
            background: accent + '33', border: `1px solid ${accent}66`,
            borderRadius: 6, padding: '4px 10px',
          }}>
            <span style={{ fontSize: 11, color: accent }}>🎙 Loading voice...</span>
          </div>
        )}

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1, padding: '32px 28px 28px',
          display: 'flex', flexDirection: 'column', flex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <span style={{
              fontSize: 11, color: accent, fontWeight: 700,
              letterSpacing: 3, textTransform: 'uppercase', opacity: 0.9,
            }}>
              Scene {current + 1} / {scenes.length}
            </span>
            <span style={{ fontSize: 28 }}>{scene.emoji || '🎬'}</span>
          </div>

          <h3 style={{
            color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.3,
            marginBottom: 16, textShadow: '0 2px 12px #000a',
            animation: 'slideUp 0.5s ease 0.1s both',
          }}>
            {scene.title}
          </h3>

          {scene.keyfact && (
            <div style={{
              background: accent + '22', border: `1px solid ${accent}66`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              animation: 'slideUp 0.5s ease 0.25s both',
            }}>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, margin: 0 }}>
                {scene.keyfact}
              </p>
            </div>
          )}

          <div style={{
            background: '#00000066', borderRadius: 8, padding: '12px 16px',
            animation: 'slideUp 0.5s ease 0.35s both', flex: 1,
          }}>
            <p style={{ color: '#ffffffcc', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {scene.narration}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {playing && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#ffffff22' }}>
            <div style={{ height: '100%', background: accent, width: progress + '%', transition: 'width 0.15s linear' }} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => { if (current > 0) goToScene(current - 1, playing); }}
          disabled={current === 0}
          style={ctrlBtn(current === 0)}
        >◀</button>
        <button
          onClick={() => setPlaying(p => !p)}
          disabled={loadingAudio}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 700,
            fontSize: 14, cursor: loadingAudio ? 'wait' : 'pointer',
            opacity: loadingAudio ? 0.7 : 1,
          }}
        >
          {loadingAudio ? '🎙 Loading...' : playing ? '⏸ Pause' : current === 0 ? '▶ Play Documentary' : '▶ Resume'}
        </button>
        <button
          onClick={() => { if (current + 1 < scenes.length) goToScene(current + 1, playing); }}
          disabled={current === scenes.length - 1}
          style={ctrlBtn(current === scenes.length - 1)}
        >▶</button>
      </div>

      {/* Scene thumbnail strip */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {scenes.map((s, i) => {
          const [c1, c2, ac] = COLORS[i % COLORS.length];
          return (
            <button
              key={i}
              onClick={() => goToScene(i, playing)}
              style={{
                flex: '0 0 auto', width: 72, height: 48, borderRadius: 6,
                background: images[i]
                  ? `url(data:image/jpeg;base64,${images[i]}) center/cover`
                  : `linear-gradient(135deg, ${c1}, ${c2})`,
                border: i === current ? `2px solid ${ac}` : '2px solid transparent',
                cursor: 'pointer', fontSize: 16, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {images[i] && <div style={{ position: 'absolute', inset: 0, background: '#0005' }} />}
              <span style={{ position: 'relative', zIndex: 1 }}>{s.emoji || '🎬'}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInScene {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kenBurns {
          from { transform: scale(1) translate(0, 0); }
          to { transform: scale(1.08) translate(-2%, -1%); }
        }
      `}</style>
    </div>
  );
}

function ctrlBtn(disabled) {
  return {
    padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface2)', color: disabled ? 'var(--text3)' : 'var(--text1)',
    fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
  };
}
