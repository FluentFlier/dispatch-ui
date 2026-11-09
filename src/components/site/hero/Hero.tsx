import Link from "next/link";
import { ProductDemo } from "../demo/ProductDemo";
import { PlatformIcon } from "../brand/Logos";
import { SkyField } from "./SkyField";

/** The hero's actions follow the nav: signed in, just the way back into the app; signed out, Get started (sign up) and Sign in. */
export function Hero({
  cta,
  loggedIn,
}: {
  cta: { href: string; label: string };
  loggedIn: boolean;
}) {
  return (
    <section className="cos-hero" aria-labelledby="cos-hero-title">
      <div className="cos-panel" aria-hidden="true">
        <SkyField />
      </div>
      <div className="cos-hero-inner">
        <div className="cos-hero-copy">
          <h1 id="cos-hero-title" className="cos-hero-title">
            <span
              className="cos-line cos-rise"
              style={{ ["--d" as string]: 1 }}
            >
              Grow beyond
            </span>
            <span
              className="cos-line cos-rise"
              style={{ ["--d" as string]: 2 }}
            >
              word of mouth.
            </span>
          </h1>

          <p className="cos-hero-sub cos-rise" style={{ ["--d" as string]: 3 }}>
            Create and publish content in your voice, find potential customers,
            and start conversations across{" "}
            <span className="cos-nowrap">
              <PlatformIcon name="linkedin" />,
            </span>{" "}
            <PlatformIcon name="x" /> and{" "}
            <span className="cos-nowrap">
              <PlatformIcon name="threads" />.
            </span>
          </p>

          <div
            className="cos-hero-actions cos-rise"
            style={{ ["--d" as string]: 4 }}
          >
            <Link href={cta.href} className="cos-btn cos-btn-metal">
              <span>{cta.label}</span>
            </Link>
            {!loggedIn && (
              <Link href="/login" className="cos-btn cos-btn-silver">
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>

        <div
          className="cos-hero-demo cos-rise"
          style={{ ["--d" as string]: 5 }}
        >
          <ProductDemo wideFrom={760} />
        </div>
      </div>
    </section>
  );
}
