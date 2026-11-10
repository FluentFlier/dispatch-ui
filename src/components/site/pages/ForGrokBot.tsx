"use client";

import Link from "next/link";
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
 * plane fly round it, and the two settle into the page's title, which the scene draws (the h1 is
 * for readers and search). Then how to connect it, what it may do, and the closing band.
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
            <h1 id="for-title" className="sr-only">
              ContentOS for Grok Bot
            </h1>
            <div className="cos-for-scene">
              <ClayzoScene
                name="grok-hero"
                width={1200}
                height={600}
                narrow={{ width: 390, height: 560 }}
                narrowBelow={719}
                playWhen="visible"
                stillTick={1872}
              />
            </div>
            <div className="cos-for-intro">
              <p className="cos-for-lede">
                Connect ContentOS to your Grok Bot. It drafts posts in your voice, and nothing publishes until you say so.
              </p>
              <div className="cos-hero-actions cos-for-actions">
                <Link href={cta.href} className="cos-btn cos-btn-metal">
                  <span>{cta.label}</span>
                </Link>
                {!funnel.loggedIn && (
                  <Link href="/book-demo" className="cos-btn cos-btn-silver">
                    <span>Book a call</span>
                  </Link>
                )}
              </div>
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

              {/* the exchange in step 3, as it reads in a chat with the bot */}
              <figure className="cos-for-chat" aria-label="Example: asking Grok Bot for a LinkedIn draft">
                <div className="cos-for-chat-bar">
                  <span className="cos-for-face" aria-hidden="true">
                    <i />
                    <i />
                  </span>
                  Grok Bot
                </div>
                <p className="cos-for-msg" data-me="">
                  Draft a LinkedIn post from this week&apos;s customer calls.
                </p>
                <div className="cos-for-msg">
                  <p>Done. It&apos;s in ContentOS as a draft, in your voice.</p>
                  <div className="cos-for-draft">
                    <span className="cos-for-draft-tag">
                      <img src="/brand/plane.webp" alt="" width={14} height={14} />
                      ContentOS draft
                    </span>
                    <p>Three founders told me the same thing this week: the post that got them a call was the one they almost didn&apos;t send.</p>
                    <span className="cos-for-draft-state">Waiting for your review</span>
                  </div>
                </div>
              </figure>
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
          </section>

          <CtaBand cta={cta} loggedIn={funnel.loggedIn} />
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
