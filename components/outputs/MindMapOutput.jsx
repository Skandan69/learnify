'use client';
import { useRef, useLayoutEffect, useState, useCallback } from 'react';

const COLORS = ['#e94560','#f5a623','#06d6a0','#00b4d8','#7209b7','#1b6ca8','#ff6b6b','#0096c7'];

function BranchNode({ branch, color, side, nodeRef }) {
  return (
    <div ref={nodeRef} style={{
      border: `2px solid ${color}`,
      borderRadius: 10,
      overflow: 'hidden',
      maxWidth: 210,
      width: '100%',
      background: 'var(--surface1, #1e1e2e)',
      textAlign: side === 'left' ? 'right' : 'left',
    }}>
      <div style={{
        background: color, padding: '6px 12px', fontWeight: 700,
        fontSize: 12, color: '#fff', lineHeight: 1.3,
      }}>
        {branch.title}
      </div>
      <div style={{
        padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: 4,
        justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
      }}>
        {(branch.points || []).map((p, i) => (
          <span key={i} style={{
            background: color + '18', border: `1px solid ${color}55`,
            borderRadius: 4, padding: '2px 7px', fontSize: 10.5,
            color: 'var(--text1, #eee)', lineHeight: 1.4,
          }}>{p}</span>
        ))}
      </div>
    </div>
  );
}

export default function MindMapOutput({ data }) {
  const { center = '', branches = [] } = data;
  const containerRef = useRef(null);
  const centerRef = useRef(null);
  const branchRefs = useRef({});
  const [paths, setPaths] = useState([]);

  const computePaths = useCallback(() => {
    if (!containerRef.current || !centerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const centR = centerRef.current.getBoundingClientRect();
    const cy = centR.top + centR.height / 2 - cr.top;
    const centLeft = centR.left - cr.left;
    const centRight = centR.right - cr.left;

    const newPaths = [];
    branches.forEach((_, i) => {
      const el = branchRefs.current[i];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const by = r.top + r.height / 2 - cr.top;
      const isLeft = i % 2 === 0;
      const bx = isLeft ? r.right - cr.left : r.left - cr.left;
      const ex = isLeft ? centLeft : centRight;
      const mx = (bx + ex) / 2;
      newPaths.push({
        d: `M${bx},${by} C${mx},${by} ${mx},${cy} ${ex},${cy}`,
        color: COLORS[i % COLORS.length],
      });
    });
    setPaths(newPaths);
  }, [branches]);

  useLayoutEffect(() => {
    computePaths();
    window.addEventListener('resize', computePaths);
    return () => window.removeEventListener('resize', computePaths);
  }, [computePaths]);

  if (!branches.length) return <p style={{ color: 'var(--text2)' }}>No mind map generated.</p>;

  const left  = branches.map((b, i) => ({ ...b, i })).filter((_, i) => i % 2 === 0);
  const right = branches.map((b, i) => ({ ...b, i })).filter((_, i) => i % 2 === 1);

  return (
    <div ref={containerRef} style={{ position: 'relative', padding: '8px 0' }}>
      {/* connector lines */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible', zIndex: 0,
      }}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} stroke={p.color} strokeWidth={2}
            fill="none" opacity={0.65} strokeLinecap="round" />
        ))}
      </svg>

      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 12, position: 'relative', zIndex: 1,
      }}>
        {/* LEFT branches */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          gap: 12, alignItems: 'flex-end',
        }}>
          {left.map(b => (
            <BranchNode key={b.i} branch={b} color={COLORS[b.i % COLORS.length]}
              side="left" nodeRef={el => { branchRefs.current[b.i] = el; }} />
          ))}
        </div>

        {/* CENTER node */}
        <div ref={centerRef} style={{
          flexShrink: 0, width: 110, minHeight: 110,
          background: 'var(--accent, #7c3aed)', color: '#fff',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center',
          fontWeight: 800, fontSize: 13, lineHeight: 1.3,
          padding: 12, boxShadow: '0 4px 24px var(--accent, #7c3aed)55',
        }}>
          {center}
        </div>

        {/* RIGHT branches */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          gap: 12, alignItems: 'flex-start',
        }}>
          {right.map(b => (
            <BranchNode key={b.i} branch={b} color={COLORS[b.i % COLORS.length]}
              side="right" nodeRef={el => { branchRefs.current[b.i] = el; }} />
          ))}
        </div>
      </div>
    </div>
  );
}
