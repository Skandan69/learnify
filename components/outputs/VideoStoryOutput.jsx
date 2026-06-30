'use client';
import { useState, useRef, useCallback } from 'react';

export default function VideoStoryOutput({ data }) {
  const { title = '', scenes = [] } = data;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const progRef = useRef(null);
  const scene = scenes[current] || {};

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    clearInterval(progRef.current);
    setLoadingAudio(false);
  }, []);

  const goTo = useCallback((idx) => {
    stopAudio(); setPlaying(false); setProgress(0); setCurrent(idx);
  }, [stopAudio]);

  const playScene = useCallback(async (idx) => {
    stopAudio(); setProgress(0);
    const s = scenes[idx];
    if (!s) return;
    setLoadingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: s.narration }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url); clearInterval(progRef.current); setProgress(0); setPlaying(false);
        if (idx + 1 < scenes.length) { setCurrent(idx + 1); setTimeout(() => playScene(idx + 1), 300); }
      };
      audio.onerror = () => { URL.revokeObjectURL(url); stopAudio(); setPlaying(false); };
      audio.ontimeupdate = () => { if (audio.duration) setProgress(audio.currentTime / audio.duration); };
      setLoadingAudio(false); setPlaying(true); audio.play();
    } catch (e) { setLoadingAudio(false); setPlaying(false); }
  }, [scenes, stopAudio]);

  const handlePlayPause = () => {
    if (loadingAudio) return;
    if (playing) { audioRef.current?.pause(); clearInterval(progRef.current); setPlaying(false); }
    else if (audioRef.current?.paused) { audioRef.current.play(); setPlaying(true); }
    else { playScene(current); }
  };

  if (!scenes.length) return <p style={{ color: 'var(--text2)' }}>No video script generated.</p>;

  return (
    <div>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2, #888)', marginBottom: 12 }}>{title}</p>

      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 280, padding: '28px 24px 24px' }}>
        <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 10, letterSpacing: 2, color: 'var(--accent, #7c3aed)', fontWeight: 700, textTransform: 'uppercase' }}>
          Scene {current + 1} / {scenes.length}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 28, opacity: 0.8 }}>{scene.emoji || ''}</div>
        <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginTop: 32, marginBottom: 12, lineHeight: 1.3 }}>{scene.title}</h3>
        {scene.keyfact && (
          <div style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 6, padding: '6px 12px', marginBottom: 14, fontSize: 12, color: '#c4b5fd', fontWeight: 600 }}>{scene.keyfact}</div>
        )}
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13.5, lineHeight: 1.75 }}>{scene.narration}</p>
        {playing && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ width: (progress * 100) + '%', height: '100%', background: 'var(--accent, #7c3aed)', transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
        <button onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'none', color: 'var(--text1, #eee)', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.4 : 1, fontSize: 16 }}>{'<'}</button>
        <button onClick={handlePlayPause} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--accent, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loadingAudio ? 'wait' : 'pointer' }}>
          {loadingAudio ? 'Loading...' : playing ? '|| Pause' : '> Play Documentary'}
        </button>
        <button onClick={() => goTo(Math.min(scenes.length - 1, current + 1))} disabled={current === scenes.length - 1} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'none', color: 'var(--text1, #eee)', cursor: current === scenes.length - 1 ? 'not-allowed' : 'pointer', opacity: current === scenes.length - 1 ? 0.4 : 1, fontSize: 16 }}>{'>'}</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {scenes.map((s, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, border: '2px solid ' + (i === current ? 'var(--accent, #7c3aed)' : 'transparent'), background: i === current ? 'rgba(124,58,237,0.2)' : 'var(--surface1, #1e1e2e)', cursor: 'pointer', fontSize: 18 }}>
            {s.emoji || ''}
          </button>
        ))}
      </div>
    </div>
  );
}
