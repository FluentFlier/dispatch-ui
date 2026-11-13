"use client";

import Link from "next/link";
import { ClayzoScene } from "./ClayzoScene";

/**
 * The closing band: the hero's sky again, at sunset, drawn in the page's halftone
 * (animations/cta-field.ts). A lens drifts across it showing the painting; on a desktop it follows
 * the cursor. The words sit in the calm middle, where the dots step back. Two ways in, as the brief
 * asks everywhere: Get started and Book a call.
 */
export function CtaBand({
  cta,
  loggedIn,
}: {
  cta: { href: string; label: string };
  loggedIn: boolean;
}) {

  return (
    <section className="cos-cta" aria-labelledby="cos-cta-title">
      <div className="cos-cta-field" aria-hidden="true">
        <ClayzoScene
          name="cta-field-india"
          width={1440}
          height={640}
          narrow={{ width: 390, height: 640 }}
          narrowBelow={719}
          playWhen="visible"
          interactive
        />
      </div>
      <div className="cos-cta-inner">
        <h2 id="cos-cta-title" className="cos-cta-title">
          Your next customer is scrolling.
        </h2>
        <p className="cos-cta-sub">
          ContentOS writes in your voice, posts when you say, and shows you who is ready to talk.
        </p>
        <div className="cos-cta-actions">
          <Link href={cta.href} className="cos-btn cos-btn-metal">
            <span>{cta.label}</span>
          </Link>
          {!loggedIn && (
            <Link href="/book-demo" className="cos-btn cos-btn-silver">
              <span>Book a call</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
