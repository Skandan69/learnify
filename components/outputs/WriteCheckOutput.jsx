'use client';
import { useState } from 'react';
import { parseResponse } from '@/lib/parsers';

export default function WriteCheckOutput({ data, sourceContent }) {
  const { topic = '', hints = [] } = data;
  const [answer, setAnswer] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function grade() {
    if (!answer.trim()) return;
    setGrading(true);
    setError(null);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContent, topic, userAnswer: answer }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Grading failed');
      const parsed = parseResponse('grade', json.text);
      setResult(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setGrading(false);
    }
  }

  const scoreColor = result
    ? result.score >= 80 ? 'var(--success-text)' : result.score >= 50 ? 'var(--warn-text)' : 'var(--danger-text)'
    : 'var(--text)';

  return (
    <div>
      <p className="scene-label">Your challenge</p>
      <p className="scene-text" style={{ marginBottom: '1rem' }}>{topic}</p>

      {hints.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="terms-label">Hints to jog your memory</p>
          <div>{hints.map((h, i) => <span key={i} className="ktag">{h}</span>)}</div>
        </div>
      )}

      {!result ? (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write everything you know about this topic here. Don't look at your notes — try to recall from memory..."
            style={{ minHeight: 160 }}
          />
          <div className="char-ct">{answer.length} characters</div>
          <button
            className="btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={grade}
            disabled={grading || answer.trim().length < 20}
          >
            {grading ? '⏳ Grading…' : '✓ Check my answer'}
          </button>
          {error && <p style={{ color: 'var(--danger-text)', fontSize: 13, marginTop: 8 }}>{error}</p>}
        </>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor }}>{result.score}%</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: scoreColor }}>{result.gradeLabel}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Coverage score</div>
            </div>
          </div>

          {result.feedback && (
            <div className="takeaway" style={{ marginBottom: '1rem' }}>{result.feedback}</div>
          )}

          {result.covered.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p className="terms-label" style={{ color: 'var(--success-text)' }}>✓ What you got right</p>
              <ul className="summary-pts" style={{ color: 'var(--success-text)' }}>
                {result.covered.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {result.missed.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <p className="terms-label" style={{ color: 'var(--danger-text)' }}>✗ What you missed</p>
              <ul className="summary-pts" style={{ color: 'var(--danger-text)' }}>
                {result.missed.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          <button className="btn-ghost" onClick={() => { setResult(null); setAnswer(''); }}>
            ↩ Try again
          </button>
        </div>
      )}
    </div>
  );
}
