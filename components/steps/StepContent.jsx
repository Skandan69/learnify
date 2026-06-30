'use client';
import { FORMAT_META } from '@/lib/prompts';

const FORMATS = Object.entries(FORMAT_META).map(([id, meta]) => ({ id, ...meta }));

export default function StepContent({ content, fmt, onContentChange, onFmtChange, onBack, onNext }) {
  return (
    <div>
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="step-ind">Step 2 of 3 — your content and format</div>
      <h2>Paste what you want to learn</h2>
      <p className="sub">Your content stays exactly as-is. We only change how it&apos;s presented — never what it says.</p>

      <div className="note">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Core content is never altered — we only repackage it to keep you engaged and focused.</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Paste a chapter, lecture notes, bullet points, a report — anything you want to transform..."
      />
      <div className="char-ct">{content.length} characters</div>

      <p className="fmt-section-title">Choose your output format</p>
      <div className="fmt-grid">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            className={`fb${fmt === f.id ? ' sel' : ''}`}
            onClick={() => onFmtChange(f.id)}
          >
            <div className="f-icon">{f.icon}</div>
            <p className="f-label">{f.label}</p>
            <p className="f-sub">{f.sub}</p>
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={onNext} disabled={content.trim().length < 20}>
        ✨ Transform it
      </button>
    </div>
  );
}
