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

const OUTPUT_MAP = {
  story:     StoryOutput,
  visual:    VisualOutput,
  flashcard: FlashcardOutput,
  audio:     AudioOutput,
  mindmap:   MindMapOutput,
  quiz:      QuizOutput,
  summary:   SummaryOutput,
  ppt:       SlideOutput,
  analogy:   AnalogyOutput,
  freewrite: WriteCheckOutput,
  imgstory:  ImageStoryOutput,
};

export default function StepOutput({ fmt, loading, error, parsed, content, onBack, onRetry }) {
  const meta = FORMAT_META[fmt] || {};
  const OutputComponent = OUTPUT_MAP[fmt];

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
          <OutputComponent data={parsed} sourceContent={content} />
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onBack}>
          ↩ Try a different format
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onRetry}>
          ↻ Regenerate
        </button>
      </div>
    </div>
  );
}
