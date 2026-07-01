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
    if (fmt === 'story') return [parsed.scenes?.map(s => s.label + '\n\n' + s.text).join('\n\n---\n\n'), parsed.takeaway ? '\nTakeaway: ' + parsed.takeaway : ''].join('');
    if (fmt === 'visual') return parsed.panels?.map(p => p.emoji + ' ' + p.title + '\n' + p.description).join('\n\n') || '';
    if (fmt === 'flashcard') return parsed.cards?.map((c, i) => 'Q' + (i+1) + ': ' + c.question + '\nA: ' + c.answer).join('\n\n') || '';
    if (fmt === 'audio') return parsed.title + '\n\n' + parsed.script;
    if (fmt === 'mindmap') return [parsed.center, ...(parsed.branches || []).map(b => '\n' + b.title + '\n' + b.points?.map(p => '  - ' + p).join('\n'))].join('\n');
    if (fmt === 'quiz') return parsed.questions?.map((q, i) => 'Q' + (i+1) + ': ' + q.q + '\nA) ' + q.options[0] + '\nB) ' + q.options[1] + '\nC) ' + q.options[2] + '\nD) ' + q.options[3] + '\nAnswer: ' + ['A','B','C','D'][q.correct]).join('\n\n') || '';
    if (fmt === 'summary') return ['Overview:\n' + parsed.overview, '\nKey Points:\n' + parsed.keypoints?.map(k => '- ' + k).join('\n'), '\nTerms:\n' + parsed.terms?.map(t => '- ' + t).join('\n')].join('\n');
    if (fmt === 'ppt') return parsed.slides?.map(s => s.title + '\n' + s.bullets?.map(b => '  - ' + b).join('\n')).join('\n\n') || '';
    if (fmt === 'analogy') return parsed.analogies?.map(a => a.concept + '\nAnalogy: ' + a.analogy + '\n' + a.explanation).join('\n\n') || '';
    if (fmt === 'freewrite') return 'Topic: ' + parsed.topic + '\n\nHints:\n' + parsed.hints?.map(h => '- ' + h).join('\n');
    if (fmt === 'imgstory') return parsed.scenes?.map(s => s.label + '\n' + s.text).join('\n\n') || '';
    if (fmt === 'video') return [parsed.title, ...(parsed.scenes || []).map(s => '\n' + s.title + '\n' + s.narration + '\n[Key fact] ' + s.keyfact)].join('\n');
    if (fmt === 'flowchart') return [parsed.title, ...(parsed.nodes || []).map((n, i) => (i+1) + '. [' + n.type.toUpperCase() + '] ' + n.label + (n.yesLabel ? ' -> Yes: ' + n.yesLabel : '') + (n.noLabel ? ' / No: ' + n.noLabel : ''))].join('\n');
  } catch(e) {}
  return JSON.stringify(parsed, null, 2);
}

export default function StepOutput({ fmt, loading, error, parsed, content, onBack, onRetry }) {
  const meta = FORMAT_META[fmt] || {};
  const OutputComponent = OUTPUT_MAP[fmt];
  const [showDl, setShowDl] = useState(false);

  async function handleDownload(type) {
    setShowDl(false);
    if (type === 'png') {
      if (!window.html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const el = document.querySelector('.out-card');
      if (!el) return;
      const canvas = await window.html2canvas(el, { useCORS: true, scale: 2 });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'learnify-' + fmt + '.png';
      a.click();
      return;
    }
    if (type === 'pdf') {
      window.print();
      return;
    }
    const text = buildDownloadText(fmt, parsed);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnify-' + fmt + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <button className="btn-back" onClick={onBack}>Back</button>
      <div className="step-ind">Step 3 of 3 - your content, reimagined</div>
      <h2>{meta.label || 'Your content'}</h2>
      <p className="sub">Same knowledge - more engaging packaging.</p>

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
            <button className="btn-retry" onClick={onRetry}>Retry</button>
          </div>
        )}

        {!loading && !error && parsed && OutputComponent && (
          <OutputComponent data={parsed} sourceContent={content} />
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onBack}>
          Try a different format
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onRetry}>
          Regenerate
        </button>
        {!loading && !error && parsed && (
          <div style={{ flex: 1, position: 'relative' }}>
            <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setShowDl(v => !v)}>
              Download
            </button>
            {showDl && (
              <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                <button onClick={() => handleDownload('text')} style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13 }}>
                  Text (.txt)
                </button>
                <button onClick={() => handleDownload('png')} style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13 }}>
                  Screenshot (.png)
                </button>
                <button onClick={() => handleDownload('pdf')} style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                  Print / PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}