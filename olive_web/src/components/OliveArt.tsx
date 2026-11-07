/** Flat drawing of an olive branch, in the page's own colours. Decorative. */
export function OliveArt({ className = "" }: { className?: string }) {
  const leaves: [number, number, number][] = [
    [150, 260, -35], [230, 215, 30], [250, 295, -20], [345, 245, 25], [370, 330, -25],
    [455, 280, 20], [490, 365, -30], [560, 320, 15],
  ];
  return (
    <svg viewBox="0 0 640 520" role="img" aria-label="An olive branch with three olives" className={className}>
      <path d="M40 470 C200 380 380 330 600 250" stroke="#8fa35a" strokeWidth="10" fill="none" strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="62" ry="17" transform={`rotate(${r} ${x} ${y})`} fill={i % 2 ? "#6f8a35" : "#9bb256"} />
      ))}
      {[[300, 400, 44], [410, 370, 40], [505, 270, 36]].map(([x, y, r], i) => (
        <g key={i}>
          <path d={`M${x} ${y - r} L${x + 8} ${y - r - 55}`} stroke="#8fa35a" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx={x} cy={y} rx={r * 0.78} ry={r} fill={i === 1 ? "#d6b13a" : "#2f4318"} />
          <ellipse cx={x - r * 0.28} cy={y - r * 0.35} rx={r * 0.14} ry={r * 0.3} fill="#f6f8ee" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}
