"use client";

import { getFunnelCta, type FunnelState } from "@/lib/funnel-cta";
import { SiteNav } from "../SiteNav";
import { SiteFooter } from "../SiteFooter";
import { ClayzoScene } from "../sections/ClayzoScene";
import { CtaBand } from "../sections/CtaBand";
import { THEME_BOOT, ThemeProvider } from "../theme";
import { CopyField } from "./CopyField";
import "../site.css";
import "../demo/demo.css";

/**
 * /for/grok-bot. The hero is the scene (animations/grok-hero.ts): Grok Bot wakes, watches the ContentOS
 * plane fly round it, and the two settle into the page's title and its one line, which the scene
 * draws (the h1 and the line are also in the page for readers and search). No buttons here: the
 * closing band carries the page's call to action. Then how to connect it, what it may do, and the closing band.
 *
 * Product truth: the MCP URL and the four key scopes come from the product handover (Settings, AI and
 * API keys); custom connectors are xAI's documented way to add an MCP server to Grok.
 */
const MCP_URL = "https://trycos.ai/api/mcp";

const SCOPES = [
  { name: "Read", line: "See your drafts, calendar and results.", on: true },
  { name: "Write", line: "Draft and edit posts in your voice.", on: true },
  { name: "Publish", line: "Schedule and post to LinkedIn, X and Threads.", on: false },
  { name: "Outreach", line: "Comments, connection notes and DMs to leads.", on: false },
];

export function ForGrokBot({ funnel }: { funnel: FunnelState }) {
  const resolved = getFunnelCta(funnel);
  const cta = funnel.loggedIn
    ? { href: resolved.href, label: resolved.label.replace("Content OS", "ContentOS") }
    : { href: resolved.href, label: "Get started" };

  return (
    <ThemeProvider>
      <div className="cos" data-page="sub">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <a href="#main" className="cos-skip">
          Skip to content
        </a>
        <SiteNav cta={cta} loggedIn={funnel.loggedIn} />
        <main id="main">
          <section className="cos-for-hero" aria-labelledby="for-title">
            {/* the scene draws the title and the line under it; these carry them for readers and search */}
            <h1 id="for-title" className="sr-only">
              ContentOS for Grok Bot
            </h1>
            <p className="sr-only">
              Connect ContentOS to your Grok Bot. It drafts posts in your voice, and nothing publishes until you say so.
            </p>
            <div className="cos-for-scene">
              <ClayzoScene
                name="grok-hero"
                width={1200}
                height={600}
                narrow={{ width: 390, height: 560 }}
                narrowBelow={719}
                playWhen="visible"
                stillTick={1680}
              />
            </div>
          </section>

          <section className="cos-act cos-for-setup" aria-labelledby="for-setup-title">
            <div className="cos-act-inner cos-for-split">
              <div>
                <h2 id="for-setup-title" className="cos-act-title">
                  Connect it in a minute.
                </h2>
                <p className="cos-act-lede">ContentOS plugs into Grok as a custom connector.</p>
                <ol className="cos-for-steps">
                  <li>
                    <span className="cos-for-step-n" aria-hidden="true">1</span>
                    <div>
                      <p className="cos-for-step-title">Copy the ContentOS MCP URL.</p>
                      <CopyField value={MCP_URL} label="ContentOS MCP URL" />
                    </div>
                  </li>
                  <li>
                    <span className="cos-for-step-n" aria-hidden="true">2</span>
                    <div>
                      <p className="cos-for-step-title">Add it in Grok.</p>
                      <p className="cos-for-step-line">Open Connectors, choose New connector, then Custom, and paste the URL.</p>
                    </div>
                  </li>
                  <li>
                    <span className="cos-for-step-n" aria-hidden="true">3</span>
                    <div>
                      <p className="cos-for-step-title">Ask your Grok Bot for a post.</p>
                      <p className="cos-for-step-line">It writes in the voice ContentOS learned from your posts.</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* step 3 happening, on a crop of the painted sky like the landing's feature panels
                  (animations/grok-chat.ts) */}
              <div className="cos-for-panel">
                <ClayzoScene
                  name="grok-chat"
                  width={600}
                  height={420}
                  narrow={{ width: 340, height: 420 }}
                  narrowBelow={719}
                  stillTick={1320}
                  label="Asked for a LinkedIn post from this week's customer calls, Grok Bot runs the ContentOS step and answers that the draft is in ContentOS, in your voice, waiting for your review."
                />
              </div>
            </div>
          </section>

          <section className="cos-act cos-for-scopes" aria-labelledby="for-scopes-title">
            <div className="cos-act-inner cos-for-split" data-flip="">
              <div>
                <h2 id="for-scopes-title" className="cos-act-title">
                  You decide what it can do.
                </h2>
                <p className="cos-act-lede">
                  Each key gets only the scopes you pick. Publishing and outreach stay off unless you turn them on.
                </p>
              </div>
              {/* the key's scopes as a ContentOS window on a painted panel, like the chat above (Hampi,
                  animations/assets/panels/grok-keys-india-*); still, and real text */}
              <div className="cos-for-panel cos-for-keys-panel">
                <div className="cos-for-win">
                  <div className="cos-for-win-bar">
                    <img src="/brand/mark.svg" alt="" width={16} height={16} />
                    <span className="cos-for-win-name">ContentOS</span>
                    <span className="cos-for-win-sub">API key for Grok Bot</span>
                  </div>
                  <ul className="cos-for-keys" aria-label="Scopes on a ContentOS API key">
                    {SCOPES.map((s) => (
                      <li key={s.name} className="cos-for-key" data-on={s.on || undefined}>
                        <span className="cos-for-key-text">
                          <span className="cos-for-key-name">{s.name}</span>
                          <span className="cos-for-key-line">{s.line}</span>
                        </span>
                        <span className="cos-for-key-state">
                          <span className="cos-for-switch" aria-hidden="true" />
                          {s.on ? "On" : "Off"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <CtaBand cta={cta} loggedIn={funnel.loggedIn} />
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
