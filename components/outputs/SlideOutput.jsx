'use client';

export default function SlideOutput({ data }) {
  const { slides = [] } = data;
  return (
    <div>
      {slides.map((s, i) => (
        <div key={i} className="slide-card">
          <p className="slide-num">Slide {i + 1}</p>
          <p className="slide-title">{s.title}</p>
          <ul className="slide-pts">
            {(s.bullets || []).map((b, j) => <li key={j}>{b}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
