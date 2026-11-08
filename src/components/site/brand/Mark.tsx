/**
 * ContentOS mark: the paper plane from the app (public/images/content-os-logo.png on main),
 * served as a small 96px copy for the nav and the demo.
 */
export function Mark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/plane.webp"
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
