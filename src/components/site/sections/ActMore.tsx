"use client";

import { useEffect, useState } from "react";
import { ClayzoScene } from "./ClayzoScene";

/**
 * After the three acts: what else ContentOS does, four live features from the product handover v2,
 * each a card in the x.ai manner (animations/grid-panels.ts): its words on top, then a panel that runs
 * off the card's bottom edge, a crop of the hero's painted sky with one real piece of the product on
 * it, cut by the panel's edge, and one thing that moves. A grid this time, so the page changes shape
 * again after the split.
 */
type Box = { scene: string; wide: boolean; title: string; body: string; label: string };

// two rows, wide then narrow, narrow then wide: the visuals are 640 and 440 units wide, all 300 tall
const ROWS: Box[][] = [
  [
    {
      scene: "panel-agents",
      wide: true,
      title: "Works inside your AI",
      body: "Draft, schedule and check results from Claude, Codex, Cursor or VS Code. Publishing stays opt-in.",
      label: "In Claude, with ContentOS connected: asked to schedule the Northwind post for Tuesday morning, ContentOS schedules it for Tuesday at 9:00 AM. Also works in Codex, Cursor and VS Code.",
    },
    {
      scene: "panel-autopilot",
      wide: false,
      title: "Autopilot",
      body: "Posts in your voice, on your schedule. Nothing publishes until you switch it on.",
      label: "Maya Chen's Autopilot switches on, every weekday at 9:00 AM, and her next three posts line up for Tuesday, Wednesday and Thursday.",
    },
  ],
  [
    {
      scene: "panel-tools",
      wide: false,
      title: "Your sales tools",
      body: "Leads go to HubSpot and Apollo, and Slack tells you when someone shows buying intent.",
      label: "Hannah Weiss, Founder at Parcelry, syncs into HubSpot as a lead, and a Slack message from ContentOS flags her as a new lead signal.",
    },
    {
      scene: "panel-breakout",
      wide: true,
      title: "Breakout tracker",
      body: "See which posts beat your usual within 72 hours.",
      label: "The breakout tracker: the newest post, We almost lost Northwind in week two, reaches 3.4 times the usual post while recent posts sit near it.",
    },
  ],
];

export function ActMore() {
  // the panels are crops of the hero's painting, so they follow its backdrop (?bg=india, SkyField)
  const [bg, setBg] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("bg") === "india") setBg("-india");
  }, []);
  return (
    <section className="cos-act cos-more" id="more" aria-labelledby="act-more-title">
      {/* under 1024 px: a halftone clock above the heading, rings going out as it keeps time
          (animations/clock-mark.ts), the strip the other sections have in this place */}
      <div className="cos-act-clock" aria-hidden="true">
        <ClayzoScene name="clock-mark" width={390} height={500} playWhen="visible" />
      </div>

      <div className="cos-act-inner">
        <div className="cos-act-head">
          <h2 id="act-more-title" className="cos-act-title">
            Keeps working when you're busy.
          </h2>
          <p className="cos-act-lede">
            It posts on your schedule, takes requests from your AI, tells
            your sales tools about new leads, and shows which posts break out.
          </p>
        </div>

        <div className="cos-more-grid">
          {ROWS.map((row, r) => (
            <div key={r} className="cos-more-row" data-flip={r % 2 ? "" : undefined}>
              {row.map((b) => (
                <article key={b.scene} className="cos-more-box" data-narrow={b.wide ? undefined : ""}>
                  <h3 className="cos-more-title">{b.title}</h3>
                  <p className="cos-more-body">{b.body}</p>
                  <div className="cos-more-panel">
                    <ClayzoScene
                      name={`${b.scene}${bg}`}
                      width={b.wide ? 640 : 440}
                      height={340}
                      narrow={{ width: 320, height: 300 }}
                      narrowBelow={860}
                      stillTick={864}
                      label={b.label}
                    />
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
