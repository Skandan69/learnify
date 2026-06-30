'use client';
import { useState } from 'react';

export default function QuizOutput({ data }) {
  const { questions = [] } = data;
  const [answers, setAnswers] = useState({});

  function answer(qi, oi) {
    if (answers[qi] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  const score = Object.entries(answers).filter(([qi, oi]) => questions[qi]?.correct === oi).length;

  return (
    <div>
      {questions.map((q, qi) => (
        <div key={qi} className="quiz-item">
          <p className="quiz-q">{qi + 1}. {q.q}</p>
          {(q.options || []).map((opt, oi) => {
            const answered = answers[qi] !== undefined;
            const isChosen = answers[qi] === oi;
            const isCorrect = q.correct === oi;
            let cls = 'qopt';
            if (answered && isCorrect) cls += ' correct';
            else if (answered && isChosen) cls += ' wrong';
            return (
              <button key={oi} className={cls} onClick={() => answer(qi, oi)} disabled={answered}>
                {opt}
              </button>
            );
          })}
        </div>
      ))}
      {Object.keys(answers).length === questions.length && questions.length > 0 && (
        <div className="takeaway">
          Score: {score} / {questions.length} — {score === questions.length ? '🎉 Perfect!' : score >= questions.length * 0.7 ? '👍 Good job!' : '📚 Keep studying!'}
        </div>
      )}
    </div>
  );
}
