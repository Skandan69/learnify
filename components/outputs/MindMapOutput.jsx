'use client';

function escXML(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapText(text, maxChars) {
  const words = (text || '').split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    if ((cur + ' ' + word).trim().length > maxChars && cur.length > 0) {
      lines.push(cur.trim()); cur = word;
    } else {
      cur = (cur + ' ' + word).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
}

function buildMindMapSVG(d) {
  const branches = d.branches || [];
  const center = d.center || 'Mind Map';
  const CX = 340, CY_TOP = 60, CW = 160, CH = 44, BW = 200, BH = 36, PH = 22, HGAP = 60, PAD = 12;
  const right = [], left = [];
  branches.forEach((b, i) => (i % 2 === 0 ? right : left).push(b));

  function colHeight(col) {
    return col.reduce((h, b) => h + BH + (b.points || []).length * PH + 16, 0);
  }
  const lh = colHeight(left), rh = colHeight(right);
  const innerH = Math.max(lh, rh, 100);
  const totalH = innerH + CY_TOP + CH + 60;
  const totalW = CX * 2;
  const CY = CY_TOP + CH / 2;

  const COLORS = [
    { fill: '#eef1fe', stroke: '#4f6ef7', text: '#2d45c4', line: '#4f6ef7' },
    { fill: '#edfaf3', stroke: '#1a7a4a', text: '#1a7a4a', line: '#1a7a4a' },
    { fill: '#fff7ed', stroke: '#c2763a', text: '#92400e', line: '#c2763a' },
    { fill: '#fdf4ff', stroke: '#9333ea', text: '#6b21a8', line: '#9333ea' },
    { fill: '#fff1f2', stroke: '#e11d48', text: '#9f1239', line: '#e11d48' },
    { fill: '#f0fdf4', stroke: '#16a34a', text: '#14532d', line: '#16a34a' },
    { fill: '#fffbeb', stroke: '#d97706', text: '#92400e', line: '#d97706' },
  ];

  const parts = [];
  function drawSide(col, isRight) {
    const x0 = isRight ? CX + CW / 2 + HGAP : CX - CW / 2 - HGAP - BW;
    let y = CXWOP;
    col.forEach((b, i) => {
      const c = COLORS[i % COLORS.length];
      const pts = b.points || [];
      const boxH = BH + pts.length * PH + 8;
      parts.push(`<rect x="${x0}" y="${y}" width="${BW}" height="${boxH}" rx="10" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`);
      const titleLines = wrapText(b.title || '', 24);
      titleLines.forEach((tl, ti) => {
        parts.push(`<text x="${x0 + PAD}" y="${y + 14 + ti * 14}" font-size="12" font-weight="700" fill="${c.text}">${escXML(tl)}</text>`);
      });
      const divY = y + BH - 6;
      parts.push(`<line x1="${x0 + 8}" y1="${divY}" x2="${x0 + BW - 8}" y2="${divY}" stroke="${c.stroke}" stroke-width="0.75" opacity="0.5"/>`);
      pts.forEach((pt, pi) => {
        const py = y + BH + pi * PH + 2;
        const ptLines = wrapText(pt, 26);
        parts.push(`<circle cx="${x0 + PAD + 4}" cy="${py + 5}" r="2.5" fill="${c.stroke}"/>`);
        parts.push(`<text x="${x0 + PAD + 14}" y="${py + 8}" font-size="10" fill="#888">${escXML(ptLines[0] || '')}</text>`);
        if (ptLines[1]) parts.push(`<text x="${x0 + PAD + 14}" y="${py + 20}" font-size="10" fill="#888">${escXML(ptLines[1])}</text>`);
      });
      const branchMidY = y + boxH / 2;
      const lineX1 = isRight ? CX + CW / 2 : CX - CW / 2;
      const lineX2 = isRight ? x0 : x0 + BW;
      const ctrlX = (lineX1 + lineX2) / 2;
      parts.push(`<path d="M ${lineX1} ${CY} C ${ctrlX} ${CY} ${ctrlX} ${branchMidY} ${lineX2} ${branchMidY}" fill="none" stroke="${c.line}" stroke-width="1.5" opacity="0.6"/>`);
      y += boxH + 16;
    });
  }

  drawSide(right, true);
  drawSide(left, false);

  parts.push(`<rect x="${CX - CW / 2}" y="${CY_TOP}" width="${CW}" height="${CH}" rx="12" fill="#4f6ef7" stroke="#2d45c4" stroke-width="2"/>`);
  const centerLines = wrapText(center, 20);
  const cTextY = CY_TOP + (CH - centerLines.length * 16) / 2 + 14;
  centerLines.forEach((cl, ci) => {
    parts.push(`<text x="${CX}" y="${cTextY + ci * 16}" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">${escXML(cl)}</text>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" style="width:100%;min-width:560px;display:block;background:#fff;border-radius:12px">${parts.join('')}</svg>`;
}

export default function MindMapOutput({ data }) {
  const svg = buildMindMapSVG(data);
  return (
    <div style={{ overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
