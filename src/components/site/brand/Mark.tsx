/**
 * ContentOS mark: eight cells running a loop around an empty centre, one of
 * them lit. The same cell grid the hero's glyph field is built on.
 */
const CELLS: [number, number][] = [
  [0, 0], [1, 0], [2, 0],
  [2, 1],
  [2, 2], [1, 2], [0, 2],
  [0, 1],
];

export function Mark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" focusable="false" className={className}>
      {CELLS.map(([x, y], i) => (
        <rect
          key={i}
          x={1 + x * 7}
          y={1 + y * 7}
          width="6"
          height="6"
          rx="1.6"
          fill={i === 2 ? 'var(--cos-blue)' : 'currentColor'}
        />
      ))}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`cos-wordmark ${className ?? ''}`}>
      <Mark size={22} />
      <span>ContentOS</span>
    </span>
  );
}
