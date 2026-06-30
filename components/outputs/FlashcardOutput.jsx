'use client';
import { useState } from 'react';

export default function FlashcardOutput({ data }) {
  const { cards = [] } = data;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return <p style={{ color: 'var(--text3)', fontSize: 14 }}>No flashcards returned — please retry.</p>;

  const card = cards[index];

  const goTo = (i) => { setIndex(i); setFlipped(false); };

  return (
    <div>
      <p className="fc-counter">Card {index + 1} of {cards.length} — tap the card to flip</p>
      <div className="fc-wrap" onClick={() => setFlipped(!flipped)}>
        <div className={`fc${flipped ? ' flipped' : ''}`}>
          <div className="fc-face fc-front">
            <p className="fc-q">{card.question}</p>
            <p className="fc-hint">Tap to reveal answer</p>
          </div>
          <div className="fc-face fc-back">
            <p className="fc-a">{card.answer}</p>
          </div>
        </div>
      </div>
      <div className="fc-nav">
        <button onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0}>← Previous</button>
        <button onClick={() => goTo(Math.min(cards.length - 1, index + 1))} disabled={index === cards.length - 1}>Next →</button>
      </div>
    </div>
  );
}
