'use client';
import { useState, useEffect, useRef } from 'react';

export default function VideoStoryOutput({ data }) {
  const [current, setCurrent] = useState(0);
  const [images, setImages] = useState({});
  const [loadingImg, setLoadingImg] = useState({});
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const audioRef = useRef(null);
  const cardRef = useRef(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);

  const scenes = data?.scenes || [];
  const scene = scenes[current] || {};

  useEffect(() => {
    if (!scene.title || images[current] !== undefined || loadingImg[current]) return;
    const prompt = scene.title + '. ' + (scene.narration || '').slice(0, 150) + '. Historical setting, cinematic.';
    setLoadingImg(prev => ({ ...prev, [current]: true }));
    fetch('/api/scene-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
      .then(r => r.json())
      .then(d => { setImages(prev => ({ ...prev, [current]: d.url || null })); })
      .catch(() => { setImages(prev => ({ ...prev, [current]: null })); })
      .finally(() => setLoadingImg(prev => ({ ...prev, [current]: false })));
  }, [current, scene.title]);

  async function playNarration() {
    if (!scene.narration) return;
    setAudioLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.narration })
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
        setPlaying(true);
        audioRef.current.onended = () => setPlaying(false);
      }
    } catch(e) { console.error(e); }
    setAudioLoading(false);
  }

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false);
  }

  function go(i) { stopAudio(); setCurrent(i); }

  async function downloadPNG() {
    if (!cardRef.current) return;
    if (!window.html2canvas) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const canvas = await window.html2canvas(cardRef.current, { useCORS: true, scale: 2 });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'learnify-scene-' + (current + 1) + '.png';
    a.click();
  }

  async function toggleRecord() {
    if (recording) {
      if (mrRef.current) mrRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'learnify-documentary.webm'; a.click();
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
    } catch(e) { console.error('Recording error:', e); }
  }

  const img = images[current];
  const isLoadingImg = !!loadingImg[current];

  return (
    <div>
      <audio ref={audioRef} style={{ display: 'none' }} />
      {data?.title && (
        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2,#888)', marginBottom: 8, textAlign: 'center' }}>{data.title}</p>
      )}

      <div ref={cardRef} style={{ background: '#1a1a2e', borderRadius: 14, overflow: 'hidden' }}>
        {isLoadingImg && (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,58,237,0.08)' }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: '#888' }}>Generating image...</span>
          </div>
        )}
        {!isLoadingImg && img && (
          <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
            <img src={img} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #1a1a2e)' }} />
          </div>
        )}

        <div style={{ padding: '12px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, letterSpacing: 2, color: '#7c3aed', textTransform: 'uppercase' }}>
              Scene {current + 1} / {scenes.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={downloadPNG} style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 4, padding: '3px 8px', color: '#ccc', cursor: 'pointer' }}>
                PNG
              </button>
              <button onClick={toggleRecord} style={{ fontSize: 11, background: recording ? '#ef4444' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 4, padding: '3px 8px', color: '#fff', cursor: 'pointer' }}>
                {recording ? 'Stop Rec' : 'Record'}
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{scene.title}</h3>

          {scene.keyfact && (
            <div style={{ background: 'rgba(124,58,237,0.2)', borderRadius: 6, padding: '5px 10px', marginBottom: 10, fontSize: 12, color: '#a78bfa' }}>
              {scene.keyfact}
            </div>
          )}

          <p style={{ fontSize: 13, lineHeight: 1.65, color: '#ccc', margin: 0 }}>{scene.narration}</p>
        </div>
      </div>

      <button
        onClick={playing ? stopAudio : playNarration}
        disabled={audioLoading}
        style={{ width: '100%', marginTop: 10, padding: '11px 0', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: audioLoading ? 'not-allowed' : 'pointer', opacity: audioLoading ? 0.7 : 1 }}
      >
        {audioLoading ? 'Loading audio...' : playing ? 'Stop' : '> Play Documentary'}
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => go(current - 1)}
          disabled={current === 0}
          style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: '#fff', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.3 : 1, fontSize: 13 }}
        >
          {'<'} Prev
        </button>
        <button
          onClick={() => go(current + 1)}
          disabled={current === scenes.length - 1}
          style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: '#fff', cursor: current === scenes.length - 1 ? 'not-allowed' : 'pointer', opacity: current === scenes.length - 1 ? 0.3 : 1, fontSize: 13 }}
        >
          Next {'>'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {scenes.map((s, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            title={s.title}
            style={{
              flex: '0 0 44px', height: 44, borderRadius: 8, padding: 0,
              border: i === current ? '2px solid #7c3aed' : '2px solid transparent',
              overflow: 'hidden', cursor: 'pointer',
              background: images[i] ? 'none' : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}
          >
            {images[i] ? (
              <img src={images[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : loadingImg[i] ? (
              <span style={{ fontSize: 8, color: '#888' }}>...</span>
            ) : (
              <span>{s.emoji || '?'}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}