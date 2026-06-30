'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

function KlingPanel({ scenes, title }) {
  const [status, setStatus] = useState('idle');
  const [clips, setClips] = useState([]);
  const [current, setCurrent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState('');
  const pollRef = useRef(null);

  const buildPrompt = (scene) => {
    const base = 'Educational documentary video. ' + scene.title + '. ' + (scene.narration || '');
    return base.slice(0, 500);
  };

  const generateAll = async () => {
    setStatus('generating');
    setErrorMsg('');
    setClips([]);
    const sceneSlice = scenes.slice(0, 6);
    setProgress('Submitting ' + sceneSlice.length + ' scenes to Kling AI...');
    try {
      const taskIds = [];
      for (let i = 0; i < sceneSlice.length; i++) {
        setProgress('Submitting scene ' + (i + 1) + ' of ' + sceneSlice.length + '...');
        const res = await fetch('/api/kling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: buildPrompt(sceneSlice[i]), duration: 5, aspect_ratio: '16:9' }),
        });
        const data = await res.json();
        if (!res.ok || !data.task_id) throw new Error(data.error || 'Failed to submit scene ' + (i + 1));
        taskIds.push({ task_id: data.task_id, scene: sceneSlice[i], video_url: null, done: false });
        await new Promise(r => setTimeout(r, 1000));
      }
      setStatus('polling');
      setProgress('Rendering... Kling AI usually takes 30-90 seconds per clip.');
      pollAll(taskIds);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message);
    }
  };

  const pollAll = (tasks) => {
    const state = tasks.map(t => ({ ...t }));
    pollRef.current = setInterval(async () => {
      let doneCount = 0;
      for (let i = 0; i < state.length; i++) {
        if (state[i].done) { doneCount++; continue; }
        try {
          const res = await fetch('/api/kling?task_id=' + state[i].task_id);
          const data = await res.json();
          if (data.status === 'succeed' || data.status === 'completed') {
            state[i].video_url = data.video_url;
            state[i].done = true;
            doneCount++;
          } else if (data.status === 'failed') {
            state[i].done = true;
            doneCount++;
          }
        } catch (e) {}
      }
      const ready = state.filter(s => s.video_url);
      setClips([...ready]);
      setProgress(doneCount + ' of ' + state.length + ' clips ready...');
      if (doneCount === state.length) {
        clearInterval(pollRef.current);
        setStatus('done');
      }
    }, 8000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  return (
    <div style={{ marginTop: 28, borderTop: '1px solid var(--border, #2a2a3e)', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text1, #eee)' }}>Generate AI Video Clips</span>
        <span style={{ fontSize: 10, background: '#7c3aed', color: '#fff', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>PREMIUM</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text2, #aaa)', marginBottom: 14, lineHeight: 1.5 }}>
        Turn each scene into a real AI-generated video clip using Kling AI. Up to 6 scenes, ~30-90s per clip.
      </p>

      {status === 'idle' && (
        <>
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text2, #aaa)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text1, #eee)' }}>Setup required:</strong> Add your Kling API key to Vercel as <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>KLING_API_KEY</code>. Get a free key at{' '}
            <a href="https://klingapi.com" target="_blank" rel="noreferrer" style={{ color: '#7c3aed' }}>klingapi.com</a> (includes $1 free credits).
          </div>
          <button onClick={generateAll} style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', width: '100%', boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          }}>
            Generate {Math.min(scenes.length, 6)} Video Clips with Kling AI
          </button>
        </>
      )}

      {(status === 'generating' || status === 'polling') && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1.2s ease-in-out ' + (i * 0.2) + 's infinite alternate', opacity: 0.7 }} />
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2, #aaa)', lineHeight: 1.5 }}>{progress}</p>
          {clips.length > 0 && (
            <p style={{ fontSize: 11, color: '#7c3aed', marginTop: 6 }}>{clips.length} clip(s) ready - scroll down to preview</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: 14, background: 'rgba(233,69,96,0.1)', border: '1px solid #e94560', borderRadius: 8 }}>
          <p style={{ color: '#e94560', fontWeight: 600, marginBottom: 6 }}>Generation failed</p>
          <p style={{ color: 'var(--text2, #aaa)', fontSize: 12 }}>{errorMsg}</p>
          <button onClick={() => setStatus('idle')} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid #e94560', color: '#e94560', fontSize: 12 }}>Try again</button>
        </div>
      )}

      {clips.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text2, #888)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Generated clips</p>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
            {clips.map((c, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 6, border: '2px solid ' + (i === current ? '#7c3aed' : 'transparent'), background: i === current ? 'rgba(124,58,237,0.2)' : 'var(--surface1, #1e1e2e)', color: 'var(--text1, #eee)', cursor: 'pointer', fontSize: 11 }}>
                Scene {i + 1}
              </button>
            ))}
          </div>
          {clips[current] && (
            <div>
              <video key={clips[current].video_url} src={clips[current].video_url} controls autoPlay style={{ width: '100%', borderRadius: 10, marginBottom: 8, background: '#000' }} />
              <p style={{ fontSize: 11, color: 'var(--text2, #888)', marginBottom: 8 }}>{clips[current].scene?.title}</p>
              <a href={clips[current].video_url} download={'scene-' + (current + 1) + '.mp4'} style={{ display: 'block', textAlign: 'center', padding: '8px', background: 'var(--accent, #7c3aed)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                Download clip
              </a>
            </div>
          )}
          {status === 'done' && (
            <button onClick={() => { setStatus('idle'); setClips([]); }} style={{ marginTop: 8, width: '100%', padding: '8px', borderRadius: 8, background: 'none', border: '1px solid var(--border, #333)', color: 'var(--text2, #aaa)', cursor: 'pointer', fontSize: 12 }}>
              Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: s.narration }) });
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

      <KlingPanel scenes={scenes} title={title} />
    </div>
  );
}
