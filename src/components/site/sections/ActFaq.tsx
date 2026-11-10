"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";

/**
 * What people ask before they start, answered from the product handover only (no pricing: it is not confirmed).
 * The heading holds the left column on a desktop; each question opens in place on the right, as the phone
 * menu's rows do. Several can be open at once. Closed answers leave the tab order.
 */
const QUESTIONS = [
  {
    q: "Will it post without asking me?",
    a: "No. Autopilot is off until you switch it on, and nothing is scheduled until you say so.",
  },
  {
    q: "Where does it post?",
    a: "LinkedIn, your profile and the company pages it manages, plus X and Threads.",
  },
  {
    q: "How does it learn my voice?",
    a: "It trains on posts you already wrote, and you can read and correct the voice it learned in Voice Lab. Then it learns from what you keep, edit and skip. You can turn that learning off.",
  },
  {
    q: "Does it reply to people for me?",
    a: "On X it finds posts worth replying to and drafts replies in your voice, and you post them. On LinkedIn it can answer new comments on your posts; anything unclear waits for you.",
  },
  {
    q: "Can my AI use it?",
    a: "Yes, over MCP. Each API key gets only the scopes you pick: read, write, publish or outreach. Publish and outreach stay off unless you add them.",
  },
  {
    q: "Can I take back what it learned?",
    a: "Yes. You can export what it has learned, or reset it, at any time.",
  },
];

export function ActFaq() {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section className="cos-act cos-faq" id="faq" aria-labelledby="act-faq-title">
      <div className="cos-act-inner cos-faq-inner">
        <div className="cos-faq-head">
          <h2 id="act-faq-title" className="cos-act-title">
            Before you start.
          </h2>
          <p className="cos-act-lede">What founders ask us first.</p>
        </div>

        <ul className="cos-faq-list">
          {QUESTIONS.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <li key={item.q} className="cos-faq-row" data-open={isOpen || undefined}>
                <h3 className="cos-faq-q">
                  <button
                    type="button"
                    className="cos-faq-btn"
                    aria-expanded={isOpen}
                    aria-controls={`cos-faq-a-${i}`}
                    id={`cos-faq-q-${i}`}
                    onClick={() => toggle(i)}
                  >
                    <span>{item.q}</span>
                    <IconPlus size={20} stroke={1.7} aria-hidden="true" className="cos-faq-icon" />
                  </button>
                </h3>
                <div id={`cos-faq-a-${i}`} role="region" aria-labelledby={`cos-faq-q-${i}`} className="cos-faq-body">
                  <div className="cos-faq-inner-a">
                    <p className="cos-faq-a">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
