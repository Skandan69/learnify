'use client';

const TYPE_STYLE = {
  start:    { bg: '#06d6a044', border: '#06d6a0', color: '#06d6a0', radius: 20, label: '▶ ' },
  end:      { bg: '#e9456044', border: '#e94560', color: '#e94560', radius: 20, label: '■ ' },
  process:  { bg: 'var(--surface2)', border: 'var(--border)', color: 'var(--text1)', radius: 8, label: '' },
  decision: { bg: '#f5a62322', border: '#f5a623', color: '#f5a623', radius: 8, label: '⬡ ' },
};

export default function FlowchartOutput({ data }) {
  const { title = '', nodes = [] } = data;
  if (!nodes.length) return <p style={{ color: 'var(--text2)' }}>No flowchart generated.</p>;

  return (
    <div>
      {title && (
        <p style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
          {title}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {nodes.map((node, i) => {
          const s = TYPE_STYLE[node.type] || TYPE_STYLE.process;
          const isLast = i === nodes.length - 1;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{
                background: s.bg, color: s.color,
                border: `1.5px solid ${s.border}`,
                borderRadius: s.radius,
                padding: '10px 20px', fontWeight: 600, fontSize: 13,
                maxWidth: 340, width: '100%', textAlign: 'center',
                boxSizing: 'border-box',
              }}>
                {s.label}{node.label}
                {node.type === 'decision' && (node.yesLabel || node.noLabel) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontWeight: 500 }}>
                    <span style={{ color: '#06d6a0' }}>✓ {node.yesLabel || 'Yes'}</span>
                    <span style={{ color: '#e94560' }}>✗ {node.noLabel || 'No'}</span>
                  </div>
                )}
              </div>
              {!isLast && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
                  <div style={{ width: 2, height: 16, background: 'var(--border)' }} />
                  <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid var(--border)' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
