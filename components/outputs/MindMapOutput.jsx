'use client';

const COLORS = ['#e94560','#f5a623','#06d6a0','#00b4d8','#7209b7','#1b6ca8','#ff6b6b','#0096c7'];

export default function MindMapOutput({ data }) {
  const { center = '', branches = [] } = data;
  if (!branches.length) return <p style={{ color: 'var(--text2)' }}>No mind map generated.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          background: 'var(--accent)', color: '#fff', borderRadius: 20,
          padding: '10px 28px', fontWeight: 700, fontSize: 15,
          boxShadow: '0 2px 16px var(--accent)44', textAlign: 'center',
        }}>
          {center}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {branches.map((b, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <div key={i} style={{ border: `1.5px solid ${color}44`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: color, padding: '8px 14px', fontWeight: 600, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, opacity: 0.8 }}>◆</span>
                {b.title}
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(b.points || []).map((p, j) => (
                  <span key={j} style={{
                    background: 'var(--surface2)', borderRadius: 6,
                    padding: '4px 10px', fontSize: 12, color: 'var(--text1)',
                    border: '1px solid var(--border)', lineHeight: 1.4,
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
