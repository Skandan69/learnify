'use client';
import { useState } from 'react';
import { FORMAT_META } from '@/lib/prompts';
import StoryOutput from '../outputs/StoryOutput';
import VisualOutput from '../outputs/VisualOutput';
import FlashcardOutput from '../outputs/FlashcardOutput';
import AudioOutput from '../outputs/AudioOutput';
import MindMapOutput from '../outputs/MindMapOutput';
import QuizOutput from '../outputs/QuizOutput';
import SummaryOutput from '../outputs/SummaryOutput';
import SlideOutput from '../outputs/SlideOutput';
import AnalogyOutput from '../outputs/AnalogyOutput';
import WriteCheckOutput from '../outputs/WriteCheckOutput';
import ImageStoryOutput from '../outputs/ImageStoryOutput';
import VideoStoryOutput from '../outputs/VideoStoryOutput';
import FlowchartOutput from '../outputs/FlowchartOutput';

const OUTPUT_MAP = {
  story: StoryOutput,
  visual: VisualOutput,
  flashcard: FlashcardOutput,
  audio: AudioOutput,
  mindmap: MindMapOutput,
  quiz: QuizOutput,
  summary: SummaryOutput,
  ppt: SlideOutput,
  analogy: AnalogyOutput,
  freewrite: WriteCheckOutput,
  imgstory: ImageStoryOutput,
  video: VideoStoryOutput,
  flowchart: FlowchartOutput,
};

function buildDownloadText(fmt, parsed) {
  if (!parsed) return '';
  try {
    if (fmt === 'story') return [parsed.scenes?.map(s => `${s.label}\n\n${s.text}`).join('\n\n---\n\n'), parsed.takeaway ? `\nTakeaway: ${parsed.takeaway}` : ''].join('');
    if (fmt === 'visual') return parsed.panels?.map(p => `${p.emoji} ${p.title}\n${p.description}`).join('\n\n') || '';
    if (fmt === 'flashcard') return parsed.cards?.map((c, i) => `Q${i+1}: ${c.question}\nA: ${c.answer}`).join('\n\n') || '';
    if (fmt === 'audio') return `${parsed.title}\n\n${parsed.script}`;
    if (fmt === 'mindmap') return [parsed.center, ...(parsed.branches || []).map(b => `\n${b.title}\n${b.points?.map(p => `  • ${p}`).join('\n')}`)].join('\n');
    if (fmt === 'quiz') return parsed.questions?.map((q, i) => `Q${i+1}: ${q.q}\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}\nAnswer: ${['A','B','C','D'][q.correct]}`).join('\n\n') || '';
    if (fmt === 'summary') return [`Overview:\n${parsed.overview}`, `\nKey Points:\n${parsed.keypoints?.map(k => `• ${k}`).join('\n')}`, `\nTerms:\n${parsed.terms?.map(t => `• ${t}`).join('\n')}`].join('\n');
    if (fmt === 'ppt') return parsed.slides?.map(s => `${s.title}\n${s.bullets?.map(b => `  • ${b}`).join('\n')}`).join('\n\n') || '';
    if (fmt === 'analogy') return parsed.analogies?.map(a => `${a.concept}\nAnalogy: ${a.analogy}\n${a.explanation}`).join('\n\n') || '';
    if (fmt === 'freewrite') return `Topic: ${parsed.topic}\n\nHints:\n${parsed.hints?.map(h => `• ${h}`).join('\n')}`;
    if (fmt === 'imgstory') return parsed.scenes?.map(s => `${s.label}\n${s.text}`).join('\n\n') || '';
    if (fmt === 'video') return [`${parsed.title}`, ...(parsed.scenes || []).map(s => `\n${s.title}\n${s.narration}\n📌 ${s.keyfact}`)].join('\n');
    if (fmt === 'flowchart') return [`${parsed.title}`, ...(parsed.nodes || []).map((n, i) => `${i+1}. [${n.type.toUpperCase()}] ${n.label}${n.yesLabel ? ` → Yes: ${n.yesLabel}` : ''}${n.noLabel ? ` / No: ${n.noLabel}` : ''}`)].join('\n');
  } catch(e) {}
  return JSON.stringify(parsed, null, 2);
}

export default function StepOutput({ fmt, loading, error, parsed, content, onBack, onRetry }) {
  const meta = FORMAT_META[fmt] || {};
  const OutputComponent = OUTPUT_MAP[fmt];
  const [dlOpen, setDlOpen] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);

  async function handleDownload(format) {
    setDlOpen(false);
    setDlBusy(true);
    try {
      if (format === 'txt') {
        const text = buildDownloadText(fmt, parsed);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `learnify-${fmt}.txt`; a.click();
        URL.revokeObjectURL(url);
      } else {
        const el = document.getElementById('learnify-output-content');
        if (!el) return;
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        if (format === 'png') {
          const a = document.createElement('a');
          a.download = `learnify-${fmt}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
        } else if (format === 'pdf') {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const imgW = pageW;
          const imgH = (canvas.height * imgW) / canvas.width;
          let y = 0;
          const imgData = canvas.toDataURL('image/png');
          if (imgH <= pageH) {
            pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
          } else {
            // Multi-page: slice canvas into pages
            let remaining = canvas.height;
            let srcY = 0;
            const sliceH = Math.floor(canvas.width * (pageH / imgW));
            let first = true;
            while (remaining > 0) {
              const sh = Math.min(sliceH, remaining);
              const slice = document.createElement('canvas');
              slice.width = canvas.width; slice.height = sh;
              slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, sh, 0, 0, canvas.width, sh);
              if (!first) pdf.addPage();
              pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, imgW, (sh * imgW) / canvas.width);
              srcY += sh; remaining -= sh; first = false;
            }
          }
          pdf.save(`learnify-${fmt}.pdf`);
        }
      }
    } catch(e) { console.error('Download error', e); }
    setDlBusy(false);
  }

  return (
    <div>
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="step-ind">Step 3 of 3 — your content, reimagined</div>
      <h2>{meta.label || 'Your content'}</h2>
      <p className="sub">Same knowledge — more engaging packaging.</p>

      <div className="out-card">
        {loading && (
          <div className="loader">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        )}
        {!loading && error && (
          <div className="err-box">
            <p className="err-title">Could not transform content</p>
            <p className="err-msg">{error}</p>
            <button className="btn-retry" onClick={onRetry}>↻ Retry</button>
          </div>
        )}
        {!loading && !error && parsed && OutputComponent && (
          <div id="learnify-output-content">
            <OutputComponent data={parsed} sourceContent={content} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onBack}>
          ↩ Try a different format
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onRetry}>
          ↻ Regenerate
        </button>
        {!loading && !error && parsed && (
          <div style={{ flex: 1, position: 'relative' }}>
            <button
              className="btn-ghost"
              style={{ width: '100%' }}
              onClick={() => setDlOpen(o => !o)}
              disabled={dlBusy}
            >
              {dlBusy ? '⏳ Saving…' : '⬇ Download ▾'}
            </button>
            {dlOpen && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0, right: 0,
                background: 'var(--surface1, #1e1e2e)',
                border: '1px solid var(--border, #333)',
                borderRadius: 8, overflow: 'hidden', zIndex: 99,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}>
                {[
                  { f: 'png', label: '🖼 PNG image' },
                  { f: 'pdf', label: '📄 PDF document' },
                  { f: 'txt', label: '📝 Text file' },
                ].map(({ f, label }) => (
                  <button key={f} onClick={() => handleDownload(f)} style={{
                    display: 'block', width: '100%', padding: '10px 14px',
                    background: 'none', border: 'none', color: 'var(--text1, #eee)',
                    textAlign: 'left', cursor: 'pointer', fontSize: 13,
                  }}
                  onMouseEnter={e => e.target.style.background = 'var(--surface2, #2a2a3e)'}
                  onMouseLeave={e => e.target.style.background = 'none'}
                  >{label}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
