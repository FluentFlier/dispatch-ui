"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconCheck, IconMinus, IconPlus } from "@tabler/icons-react";
import { getFunnelCta, type FunnelState } from "@/lib/funnel-cta";
import { SiteNav } from "../SiteNav";
import { SiteFooter } from "../SiteFooter";
import { CtaBand } from "../sections/CtaBand";
import { THEME_BOOT, ThemeProvider } from "../theme";
import "../site.css";
import "../demo/demo.css";

/**
 * /pricing, in the landing's system like /for/grok-bot. People come here for the price, so it leads: the
 * word Pricing, then the card (the price, an account counter, what every account includes). Then the
 * closing band.
 *
 * Product truth: the price, what an account covers, the included list, "billed monthly, cancel anytime"
 * and the 50-account limit come from the live hosted pricing page.
 */
const PRICE = 1000;
const MAX = 50;

const INCLUDED = [
  "One LinkedIn, one X and one Threads profile per account",
  "Posts drafted in your own voice",
  "Scheduling, publishing and analytics",
  "Autopilot on every account",
  "Email and SMS outreach",
  "10,000 AI generations a month per account",
];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function Pricing({ funnel }: { funnel: FunnelState }) {
  const resolved = getFunnelCta(funnel);
  const cta = funnel.loggedIn
    ? { href: resolved.href, label: resolved.label.replace("Content OS", "ContentOS") }
    : { href: resolved.href, label: "Get started" };

  const [accounts, setAccounts] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("trial") === "expired") setNotice("Your trial has ended. Add your accounts to keep going.");
    else if (q.get("checkout") === "canceled") setNotice("Checkout canceled. Pick up where you left off when you're ready.");
  }, []);

  return (
    <ThemeProvider>
      <div className="cos" data-page="sub">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <a href="#main" className="cos-skip">
          Skip to content
        </a>
        <SiteNav cta={cta} loggedIn={funnel.loggedIn} />
        <main id="main">
          <section className="cos-price" aria-labelledby="price-title">
            <div className="cos-act-inner">
              <h1 id="price-title" className="cos-act-title cos-price-title">
                Pricing
              </h1>

              {notice && (
                <p className="cos-price-notice" role="status">
                  {notice}
                </p>
              )}

              <div className="cos-price-stage">
                <div className="cos-price-card">
                  <div className="cos-price-calc">
                    <p className="cos-price-name">ContentOS</p>
                    <p className="cos-price-amount">
                      {money(PRICE)}
                      <span>per account / month</span>
                    </p>

                    <div className="cos-price-box">
                      <div className="cos-price-row">
                        <div>
                          <p className="cos-price-row-title" id="accounts-label">
                            Accounts
                          </p>
                          <p className="cos-price-row-line">One LinkedIn, X and Threads profile each</p>
                        </div>
                        <div className="cos-step" role="group" aria-labelledby="accounts-label">
                          <button
                            type="button"
                            className="cos-step-btn"
                            onClick={() => setAccounts((n) => Math.max(1, n - 1))}
                            disabled={accounts <= 1}
                            aria-label="Remove an account"
                          >
                            <IconMinus size={16} stroke={1.8} aria-hidden="true" />
                          </button>
                          <output className="cos-step-n" aria-live="polite">
                            {accounts}
                          </output>
                          <button
                            type="button"
                            className="cos-step-btn"
                            onClick={() => setAccounts((n) => Math.min(MAX, n + 1))}
                            disabled={accounts >= MAX}
                            aria-label="Add an account"
                          >
                            <IconPlus size={16} stroke={1.8} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="cos-price-total">
                        <span>Monthly total</span>
                        <span className="cos-price-total-n">
                          {money(PRICE * accounts)}
                          <small>/mo</small>
                        </span>
                      </div>
                    </div>

                    <p className="cos-price-note">Billed monthly, cancel anytime.</p>
                    <Link href={cta.href} className="cos-btn cos-btn-metal cos-price-go">
                      <span>{cta.label}</span>
                    </Link>
                    <Link href="/book-demo" className="cos-price-more">
                      More than {MAX} accounts? Book a call
                      <IconArrowRight size={16} stroke={1.8} aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="cos-price-incl">
                    <p className="cos-price-incl-title">Included on every account</p>
                    <ul>
                      {INCLUDED.map((item) => (
                        <li key={item}>
                          <IconCheck size={16} stroke={2} aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
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
