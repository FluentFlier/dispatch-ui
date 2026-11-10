/**
 * ContentOS mark: the paper plane, two folds (blue and vermilion) in a dark outline. The vector is
 * public/brand/mark.svg; the favicon (src/app/icon.png), the app logo and the scenes' copies are
 * rendered from it.
 */
export function Mark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/mark.svg"
      alt=""
      width={size}
      height={size}
      className={`cos-mark ${className ?? ''}`}
      draggable={false}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`cos-wordmark ${className ?? ''}`}>
      <Mark size={26} />
      <span>ContentOS</span>
    </span>
  );
}
