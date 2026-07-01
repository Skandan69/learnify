'use client';
import { useRef, useState } from 'react';
import { FORMAT_META } from '@/lib/prompts';

const FORMATS = Object.entries(FORMAT_META).map(([id, meta]) => ({ id, ...meta }));

function extractFrames(file, numFrames = 10) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      const interval = duration / (numFrames + 1);
      const frames = [];
      const canvas = document.createElement('canvas');
      canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      const captureAt = (time) => new Promise((res) => {
        video.currentTime = time;
        video.addEventListener('seeked', () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
          res();
        }, { once: true });
      });
      const times = Array.from({ length: numFrames }, (_, i) => interval * (i + 1));
      (async () => { for (const t of times) await captureAt(t); URL.revokeObjectURL(url); resolve(frames); })();
    });
    video.addEventListener('error', () => { URL.revokeObjectURL(url); reject(new Error('Could not load video')); });
  });
}

async function loadPdfJs() {
  if (window.pdfjsLib) return;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function extractPdfText(file) {
  await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n\n';
  }
  return text.trim();
}

export default function StepContent({ content, fmt, onContentChange, onFmtChange, onBack, onNext }) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const imgRef = useRef(null);
  const vidRef = useRef(null);
  const docRef = useRef(null);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadMsg('Reading your notes...');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/ocr', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onContentChange(data.text);
      setUploadMsg('Notes extracted - review and transform!');
    } catch (err) { setUploadMsg('Error: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function handleVideoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadMsg('Extracting frames from video...');
    try {
      const frames = await extractFrames(file, 10);
      setUploadMsg('Reading video content with AI...');
      const res = await fetch('/api/transcribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onContentChange(data.text);
      setUploadMsg('Video content extracted - review and transform!');
    } catch (err) { setUploadMsg('Error: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function handleDocUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setUploadMsg('Reading ' + files.length + ' file(s)...');
    try {
      const parts = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadMsg('Reading file ' + (i + 1) + ' of ' + files.length + ': ' + file.name + '...');
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const text = await extractPdfText(file);
          parts.push('--- ' + file.name + ' ---\n' + text);
        } else {
          const text = await file.text();
          parts.push('--- ' + file.name + ' ---\n' + text);
        }
      }
      const combined = (content ? content + '\n\n' : '') + parts.join('\n\n');
      onContentChange(combined);
      setUploadMsg(files.length + ' file(s) extracted - review and transform!');
    } catch (err) { setUploadMsg('Error: ' + err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  const uploadBtnStyle = {
    flex: 1, padding: '9px 12px', borderRadius: 'var(--radius)',
    border: '1.5px dashed var(--border)', background: 'var(--surface2)',
    fontSize: 13, color: 'var(--text2)', cursor: uploading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.15s', fontFamily: 'inherit',
  };

  return (
    <div>
      <button className="btn-back" onClick={onBack}>Back</button>
      <div className="step-ind">Step 2 of 3 - your content and format</div>
      <h2>Paste what you want to learn</h2>
      <p className="sub">Your content stays exactly as-is. We only change how it is presented - never what it says.</p>

      <div className="note">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Core content is never altered - we only repackage it to keep you engaged and focused.</span>
      </div>

      <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
      <input ref={vidRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoUpload} />
      <input ref={docRef} type="file" accept=".pdf,.txt,.md,.csv" multiple style={{ display: 'none' }} onChange={handleDocUpload} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button type="button" onClick={() => imgRef.current?.click()} disabled={uploading} style={uploadBtnStyle}>
          Scan handwritten notes
        </button>
        <button type="button" onClick={() => vidRef.current?.click()} disabled={uploading} style={uploadBtnStyle}>
          Upload lecture video
        </button>
      </div>
      <button
        type="button"
        onClick={() => docRef.current?.click()}
        disabled={uploading}
        style={{ ...uploadBtnStyle, width: '100%', marginBottom: 10, color: 'var(--accent,#7c3aed)', borderColor: 'var(--accent,#7c3aed)', background: 'rgba(124,58,237,0.04)' }}
      >
        Upload PDF or documents (select multiple)
      </button>

      {uploadMsg && (
        <p style={{
          fontSize: 12, marginBottom: 8,
          color: uploadMsg.startsWith('Notes') || uploadMsg.startsWith('Video') || uploadMsg.match(/^[0-9]/) ? 'var(--success-text)' : uploadMsg.startsWith('Error') ? 'var(--danger-text)' : 'var(--text2)',
        }}>
          {uploading && <span style={{ marginRight: 6 }}>Loading...</span>}{uploadMsg}
        </p>
      )}

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Paste a chapter, lecture notes, bullet points, a report - or scan/upload above..."
        disabled={uploading}
      />
      <div className="char-ct">{content.length} characters</div>

      <p className="fmt-section-title">Choose your output format</p>
      <div className="fmt-grid">
        {FORMATS.map((f) => (
          <button key={f.id} className={'fb' + (fmt === f.id ? ' sel' : '')} onClick={() => onFmtChange(f.id)}>
            <div className="f-icon">{f.icon}</div>
            <p className="f-label">{f.label}</p>
            <p className="f-sub">{f.sub}</p>
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={onNext} disabled={content.trim().length < 20 || uploading}>
        Transform it
      </button>
    </div>
  );
}