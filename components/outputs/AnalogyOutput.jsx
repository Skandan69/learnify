'use client';

export default function AnalogyOutput({ data }) {
  const { analogies = [] } = data;
  return (
    <div>
      {analogies.map((a, i) => (
        <div key={i} className={`analogy-item${i === analogies.length - 1 ? ' last' : ''}`}>
          <p className="analogy-concept">{a.concept}</p>
          <p className="analogy-headline">{a.analogy}</p>
          <p className="analogy-body">{a.explanation}</p>
        </div>
      ))}
    </div>
  );
}
