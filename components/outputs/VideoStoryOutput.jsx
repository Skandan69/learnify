'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

const AVATARS = [
  { id: 'Anna_public_3_20240108',    name: 'Anna',    emoji: '\u{1F469}\u200D\u{1F4BC}', style: 'Professional' },
  { id: 'Susan_public_2_20240328',   name: 'Susan',   emoji: '\u{1F469}\u200D\u{1F3EB}', style: 'Educator' },
  { id: 'William_public_3_20240108', name: 'William', emoji: '\u{1F468}\u200D\u{1F4BC}', style: 'Professional' },
  { id: 'Daisy_public_2_20240408',   name: 'Daisy',   emoji: '\u{1F469}\u200D\u{1F3A4}', style: 'Energetic' },
];

function HeyGenPanel({ scenes, title }) {
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [status, setStatus] = useState('idle');
  const [videoUrl, setVideoUrl] = useState(null);
  const [pollMsg, setPollMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef(null);

  const startGeneration = async () => {
    setStatus('generating');
    setErrorMsg('');
    setVideoUrl(null);
    try {
      const res = await fetch('/api/heygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, avatarId, title }),
      });
      const data = await res.json();
      if (!res.ok || !data.video_id) throw new Error(data.error || 'Failed to start generation');
      setStatus('polling');
      setPollMsg('HeyGen is rendering your video... this usually takes 2-5 minutes.');
      pollStatus(data.video_id);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message);
    }
  };

  const pollStatus = (video_id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/heygen?video_id=' + video_id);
        const data = await res.json();
        if (data.status === 'completed' && data.video_url) {
          clearInterval(pollRef.current);
          setVideoUrl(data.video_url);
          setStatus('done');
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current);
          setStatus('error');
          setErrorMsg('HeyGen rendering failed. Please try again.');
        } else {
          const pct = data.progress ? ' (' + Math.round(data.progress * 100) + '%)' : '';
          setPollMsg('Rendering in progress' + pct + '... checking again in 10 seconds.');
        }
      } catch (e) {}
    }, 10000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  return (
    <div style={{ marginTop: 28, borderTop: '1px solid var(--border, #2a2a3e)', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}></span>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text1, #eee)' }}>Generate Real AI Video</span>
        <span style={{ fontSize: 10, background: '#7c3aed', color: '#fff', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>PREMIUM</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text2, #aaa)', marginBottom: 14, lineHeight: 1.5 }}>
        Turn this script into a professional video with a consistent AI presenter â same character across all scenes.
      </p>

      {status === 'idle' && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {AVATARS.map(av => (
              <button key={av.id} onClick={() => setAvatarId(av.id)} style={{
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                border: '2px solid ' + (avatarId === av.id ? 'var(--accent, #7c3aed)' : 'var(--border, #333)'),
                background: avatarId === av.id ? 'rgba(124,58,237,0.15)' : 'var(--surface1, #1e1e2e)',
                color: 'var(--text1, #eee)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <span style={{ fontSize: 22 }}>{av.emoji}</span>
                <span style={{ fontWeight: 600 }}>{av.name}</span>
                <span style={{ color: 'var(--text2, #aaa)', fontSize: 10 }}>{av.style}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text2, #888)', marginBottom: 12 }}>
            {Math.min(scenes.length, 10)} scenes Â· renders in 2-5 min
          </p>
          <button onClick={startGeneration} style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', width: '100%', boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          }}>
            Generate with {AVATARS.find(a => a.id === avatarId)?.name || 'Avatar'}
          </button>
        </>
      )}

      {status === 'generating' && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text2, #aaa)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          <p style={{ fontSize: 13 }}>Submitting to HeyGen...</p>
        </div>
      )}

      {status === 'polling' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          <p style={{ fontSize: 13, color: 'var(--text2, #aaa)', lineHeight: 1.5 }}>{pollMsg}</p>
          <p style={{ fontSize: 11, color: 'var(--text2, #666)', marginTop: 8 }}>You can leave this tab open â we check every 10 seconds.</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: 14, background: 'rgba(233,69,96,0.1)', border: '1px solid #e94560', borderRadius: 8 }}>
          <p style={{ color: '#e94560', fontWeight: 600, marginBottom: 6 }}>Generation failed</p>
          <p style={{ color: 'var(--text2, #aaa)', fontSize: 12 }}>{errorMsg}</p>
          <button onClick={() => setStatus('idle')} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', background: 'none', border: '1px solid #e94560', color: '#e94560', fontSize: 12 }}>â© Try again</button>
        </div>
      )}

      {status === 'done' && videoUrl && (
        <div>
          <video src={videoUrl} controls style={{ width: '100%', borderRadius: 10, marginBottom: 12 }} />
          <a href={videoUrl} download="learnify-video.mp4" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--accent, #7c3aed)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
             Download MP4
          </a>
          <button onClick={() => { setStatus('idle'); setVideoUrl(null); }} style={{ marginTop: 8, width: '100%', padding: '8px', borderRadius: 8, background: 'none', border: '1px solid var(--border, #333)', color: 'var(--text2, #aaa)', cursor: 'pointer', fontSize: 12 }}>
            â© Generate with a different avatar
          </button>
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
    else { audioRef.current?.paused ? (audioRef.current.play(), setPlaying(true)) : playScene(current); }
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
          {loadingAudio ? ' Loading...' : playing ? '|| Pause' : '> Play Documentary'}
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

      <HeyGenPanel scenes={scenes} title={title} />
    </div>
  );
}