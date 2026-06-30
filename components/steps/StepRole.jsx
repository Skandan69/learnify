'use client';

const ROLES = [
  { id: 'student',      icon: '🎓', name: 'Student',               desc: 'Studying for exams, assignments, or new subjects — make it stick.' },
  { id: 'trainer',      icon: '🎤', name: 'Trainer / Teacher',      desc: 'Create engaging materials and exercises to teach others.' },
  { id: 'professor',    icon: '🏛️', name: 'Professor / Academic',   desc: 'Transform lectures and research into accessible formats.' },
  { id: 'professional', icon: '💼', name: 'Working Professional',   desc: 'Absorb reports, training docs, and industry content faster.' },
];

export default function StepRole({ role, onSelect, onNext }) {
  return (
    <div>
      <div className="step-ind">Step 1 of 3 — who are you?</div>
      <h2>Welcome — let&apos;s personalise this</h2>
      <p className="sub">Your role shapes the tone, depth, and format we use to transform your content.</p>

      <div className="role-grid">
        {ROLES.map((r) => (
          <button
            key={r.id}
            className={`role-card${role === r.id ? ' sel' : ''}`}
            onClick={() => onSelect(r.id)}
          >
            <div className="role-icon">{r.icon}</div>
            <p className="role-name">{r.name}</p>
            <p className="role-desc">{r.desc}</p>
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={onNext} disabled={!role}>
        Continue →
      </button>
    </div>
  );
}
