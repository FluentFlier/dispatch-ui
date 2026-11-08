"use client";

import { getFunnelCta, type FunnelState } from "@/lib/funnel-cta";
import { SiteNav } from "./SiteNav";
import { Hero } from "./hero/Hero";
import { THEME_BOOT, ThemeProvider } from "./theme";
import "./site.css";
import "./demo/demo.css";

export function SiteHome({ funnel }: { funnel: FunnelState }) {
  const resolved = getFunnelCta(funnel);
  // Brief: two CTAs everywhere, Get started (self-serve) and Book a call. Brand is spelled ContentOS.
  const cta = funnel.loggedIn
    ? {
        href: resolved.href,
        label: resolved.label.replace("Content OS", "ContentOS"),
      }
    : { href: resolved.href, label: "Get started" };

  return (
    <ThemeProvider>
      <div className="cos">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <a href="#main" className="cos-skip">
          Skip to content
        </a>
        <SiteNav cta={cta} />
        <main id="main">
          <Hero cta={cta} />
        </main>
      </div>
    </ThemeProvider>
  );
}
