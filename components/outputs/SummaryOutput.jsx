'use client';

export default function SummaryOutput({ data }) {
  const { overview = '', keypoints = [], terms = [] } = data;
  return (
    <div>
      <p className="summary-overview">{overview}</p>
      <ul className="summary-pts">
        {keypoints.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
      {terms.length > 0 && (
        <>
          <p className="terms-label">Key terms</p>
          <div>{terms.map((t, i) => <span key={i} className="ktag">{t}</span>)}</div>
        </>
      )}
    </div>
  );
}
