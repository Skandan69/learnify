'use client';
import { useState, useEffect } from 'react';
import StepRole from './steps/StepRole';
import StepContent from './steps/StepContent';
import StepOutput from './steps/StepOutput';
import HistoryPanel from './HistoryPanel';
import { buildPrompt, FORMAT_META } from '@/lib/prompts';
import { parseResponse } from '@/lib/parsers';
import { getHistory, saveToHistory } from '@/lib/history';
import styles from './LearnifyApp.module.css';

export default function LearnifyApp() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [content, setContent] = useState('');
  const [fmt, setFmt] = useState('story');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { setHistory(getHistory()); }, []);

  const PROG = { 1: 25, 2: 60, 3: 100 };

  async function generate() {
    setLoading(true);
    setError(null);
    setParsed(null);
    try {
      const prompt = buildPrompt(fmt, content, role);
      const res = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
      if (!json.text) throw new Error('Empty response — please retry.');
      const p = parseResponse(fmt, json.text);
      setParsed(p);
      const entry = saveToHistory({
        role, fmt,
        contentSnippet: content,
        fmtLabel: FORMAT_META[fmt]?.label || fmt,
        parsed: p,
      });
      if (entry) setHistory(getHistory());
    } catch (e) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function goTo(s) {
    setStep(s);
    if (s === 3) generate();
  }

  function loadHistoryEntry(entry) {
    setRole(entry.role);
    setFmt(entry.fmt);
    setParsed(entry.parsed);
    setStep(3);
    setShowHistory(false);
  }

  function refreshHistory() { setHistory(getHistory()); }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className={styles.brandName}>Learnify</div>
            <div className={styles.brandTag}>Make any content engaging</div>
          </div>
          <button className={styles.historyBtn} onClick={() => setShowHistory(!showHistory)} title="History">
            🕐 History {history.length > 0 && <span className={styles.historyBadge}>{history.length}</span>}
          </button>
        </div>

        {/* History panel */}
        {showHistory && (
          <HistoryPanel
            history={history}
            onLoad={loadHistoryEntry}
            onRefresh={refreshHistory}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Main card */}
        <div className={styles.card}>
          <div className={styles.progBar}>
            <div className={styles.progFill} style={{ width: `${PROG[step] || 25}%` }} />
          </div>

          {step === 1 && (
            <StepRole role={role} onSelect={setRole} onNext={() => goTo(2)} />
          )}
          {step === 2 && (
            <StepContent
              content={content}
              fmt={fmt}
              onContentChange={setContent}
              onFmtChange={setFmt}
              onBack={() => goTo(1)}
              onNext={() => goTo(3)}
            />
          )}
          {step === 3 && (
            <StepOutput
              fmt={fmt}
              loading={loading}
              error={error}
              parsed={parsed}
              content={content}
              onBack={() => goTo(2)}
              onRetry={generate}
            />
          )}
        </div>

        <p className={styles.footer}>Made with ♥ — content is yours, always.</p>
      </div>
    </div>
  );
}
