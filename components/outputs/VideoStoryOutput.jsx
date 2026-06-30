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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const utterRef = useRef(null);
  const timerRef = useRef(null);
  const progRef = useRef(null);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (utterRef.current) utterRef.current = null;
    clearInterval(timerRef.current);
    clearInterval(progRef.current);
  }, []);

  const goToScene = useCallback((idx, autoPlay = false) => {
    stopSpeech();
    setCurrent(idx);
    setAnimKey(k => k + 1);
    setProgress(0);
    if (autoPlay) setPlaying(true);
  }, [stopSpeech]);

  const speakAndAdvance = useCallback((idx) => {
    if (!scenes[idx]) { setPlaying(false); return; }
    const narration = scenes[idx].narration || '';
    if (!voiceEnabled || !narration || typeof window === 'undefined' || !window.speechSynthesis) {
      // No speech — auto-advance after 6s
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
      return;
    }

    const utter = new SpeechSynthesisUtterance(narration);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;
    utterRef.current = utter;

    const wordCount = narration.split(' ').length;
    const estimatedMs = (wordCount / 2.5) * 1000;
    const start = Date.now();
    progRef.current = setInterval(() => {
      const p = Math.min(95, ((Date.now() - start) / estimatedMs) * 100);
      setProgress(p);
    }, 100);

    utter.onend = () => {
      clearInterval(progRef.current);
      setProgress(100);
      setTimeout(() => {
        if (idx + 1 < scenes.length) goToScene(idx + 1, true);
        else setPlaying(false);
      }, 600);
    };

    utter.onerror = () => {
      clearInterval(progRef.current);
      if (idx + 1 < scenes.length) goToScene(idx + 1, true);
      else setPlaying(false);
    };

    window.speechSynthesis.speak(utter);
  }, [scenes, voiceEnabled, goToScene]);

  useEffect(() => {
    if (playing) speakAndAdvance(current);
    else stopSpeech();
    return () => stopSpeech();
  }, [playing, current]);

  useEffect(() => { return () => stopSpeech(); }, []);

  if (!scenes.length) return <p style={{ color: 'var(--text2)' }}>No scenes generated.</p>;

  const scene = scenes[current];
  const [bg1, bg2, accent] = COLORS[current % COLORS.length];

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
          background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
          minHeight: 320, padding: '40px 32px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: `0 0 0 1px ${accent}22, 0 8px 32px #0008`,
          animation: 'fadeInScene 0.5s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            fontSize: 11, color: accent, fontWeight: 700, letterSpacing: 3,
            textTransform: 'uppercase', opacity: 0.9,
          }}>
            Scene {current + 1} / {scenes.length}
          </span>
          <span style={{ fontSize: 28 }}>{scene.emoji || '🎜'}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 0' }}>
          <h3 style={{
            color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.3,
            marginBottom: 16, textShadow: '0 2px 8px #0008',
            animation: 'slideUp 0.5s ease 0.1s both',
          }}>
            {scene.title}
          </h3>
          {scene.keyfact && (
            <div style={{
              background: accent + '22', border: `1px solid ${accent}66`,
              borderRadius: 8, padding: '10px 14px',
              animation: 'slideUp 0.5s ease 0.25s both',
            }}>
              <p style={{ color: accent, fontSize: 13, fontWeight: 600, margin: 0 }}>
                {scene.keyfact}
              </p>
            </div>
          )}
        </div>
        <div style={{
          background: '#00000066', borderRadius: 8, padding: '12px 16px',
          animation: 'slideUp 0.5s ease 0.35s both',
        }}>
          <p style={{ color: '#ffffffcc', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            {scene.narration}
          </p>
        </div>
        {playing && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#ffffff22' }}>
            <div style={{
              height: '100%', background: accent,
              width: progress + '%', transition: 'width 0.1s linear',
            }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => { if (current > 0) goToScene(current - 1, playing); }}
          disabled={current === 0}
          style={ctrlBtn(current === 0)}
        >
          ◀
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          {playing ? '⏸ Pause' : current === 0 ? '▶ Play Documentary' : '▶ Resume'}
        </button>
        <button
          onClick={() => { if (current + 1 < scenes.length) goToScene(current + 1, playing); }}
          disabled={current === scenes.length - 1}
          style={ctrlBtn(current === scenes.length - 1)}
        >
          ▶
        </button>
        <button
          onClick={() => setVoiceEnabled(v => !v)}
          title={voiceEnabled ? 'Mute narration' : 'Enable narration'}
          style={{ ...ctrlBtn(false), fontSize: 16, padding: '8px 12px' }}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {scenes.map((s, i) => {
          const [c1, c2, ac] = COLORS[i % COLORS.length];
          return (
            <button
              key={i}
              onClick={() => goToScene(i, playing)}
              style={{
                flex: '0 0 auto', width: 72, height: 48, borderRadius: 6,
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                border: i === current ? `2px solid ${ac}` : '2px solid transparent',
                cursor: 'pointer', fontSize: 18, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {s.emoji || '🎜'}
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes fadeInScene { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
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
