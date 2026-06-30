'use client';
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
    if (fmt === 'quiz') return parsed.questions?.map((q, i) => 'Q' + (i+1) + ': ' + q.q + '\nA) ' + q.options[0] + '\nB) ' + q.options[1] + '\nC) ' + q.options[2] + '\nD) ' + q.options[3] + '\nAnswer: ' + ['A','B','C','D'][q.correct]).join('\n\n') || '';
    if (fmt === 'ppt') return parsed.slides?.map(s => s.title + '\n' + s.bullets?.map(b => '  - ' + b).join('\n')).join('\n\n') || '';
    if (fmt === 'video') return [parsed.title, ...(parsed.scenes || []).map(s => '\n' + s.title + '\n' + s.narration)].join('\n');
  } catch(e) {}
  return JSON.stringify(parsed, null, 2);
}

export default function StepOutput({ fmt, loading, error, parsed, content, onBack, onRetry }) {
  const meta = FORMAT_META[fmt] || {};
  const OutputComponent = OUTPUT_MAP[fmt];

  function handleDownload() {
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
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onBack}>Try a different format</button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onRetry}>Regenerate</button>
        {!loading && !error && parsed && (
          <button className="btn-ghost" style={{ flex: 1 }} onClick={handleDownload}>Download</button>
        )}
      </div>
    </div>
  );
}
