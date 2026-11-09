import { ClayzoScene } from "./ClayzoScene";

/**
 * After the three acts: what else ContentOS does, four live features from the product handover v2,
 * one Clayzo fragment each (animations/grid-boxes.ts). A grid this time, so the page changes shape
 * again after the split.
 */
const BOXES = [
  {
    scene: "grid-autopilot",
    title: "Autopilot",
    body: "Posts in your voice, on your schedule. Nothing publishes until you switch it on.",
    label:
      "Maya Chen's Autopilot switches on, every day at 9:00 AM. Three posts line up under Coming up next for Tuesday, Wednesday and Thursday.",
  },
  {
    scene: "grid-agents",
    title: "Works inside your AI",
    body: "Draft, schedule and check results from Claude, Codex, Cursor or VS Code. Publishing stays opt-in.",
    label:
      "The ContentOS MCP address, trycos.ai/api/mcp, is copied, and Claude, Codex, Cursor and VS Code connect in one click. Read and write are allowed; publish and outreach are left off.",
  },
  {
    scene: "grid-breakout",
    title: "Breakout tracker",
    body: "See which posts beat your usual within 72 hours.",
    label:
      "Today's post runs to 3.4 times the usual post and is marked Breaking out. Two older posts sit at 1.2 and 0.8 times.",
  },
  {
    scene: "grid-tools",
    title: "Your sales tools",
    body: "Leads go to HubSpot and Apollo, and Slack tells you when someone shows buying intent.",
    label:
      "HubSpot, Apollo and Slack connect in turn, then a Slack message arrives: a lead signal for Hannah Weiss.",
  },
];

export function ActMore() {
  return (
    <section className="cos-act cos-more" id="more" aria-labelledby="act-more-title">
      <div className="cos-act-inner">
        <div className="cos-act-head">
          <h2 id="act-more-title" className="cos-act-title">
            Everything around the post.
          </h2>
          <p className="cos-act-lede">
            Schedule it, see how it did, run it from your AI, and send the
            leads where your team already works.
          </p>
        </div>

        <div className="cos-more-grid">
          {BOXES.map((b) => (
            <article key={b.scene} className="cos-more-box">
              <div className="cos-more-scene">
                <ClayzoScene
                  name={b.scene}
                  width={440}
                  height={280}
                  stillTick={1200}
                  label={b.label}
                />
              </div>
              <h3 className="cos-more-title">{b.title}</h3>
              <p className="cos-more-body">{b.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
