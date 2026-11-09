import { ClayzoScene } from "./ClayzoScene";

/**
 * Act 3: starting conversations. Act 2 ends on a lead and a plan; this plays the plan out
 * (animations/outreach-thread.ts): a comment, a connection note held to LinkedIn's 300
 * characters, a DM, each approved, then sent or scheduled at a human time,
 * until she replies. A split this time, words beside the visual, so the page keeps changing shape.
 */
export function ActOutreach() {
  return (
    <section
      className="cos-act cos-act-split"
      id="conversations"
      aria-labelledby="act-outreach-title"
    >
      <div className="cos-act-inner">
        <div className="cos-act-head">
          <h2 id="act-outreach-title" className="cos-act-title">
            Turn leads into conversations.
          </h2>
          <p className="cos-act-lede">
            Each lead gets a plan: a comment, then a connection note, then a
            DM, days apart. Nothing goes out until you approve it, and then it
            goes out at a human pace.
          </p>
        </div>

        <ClayzoScene
          name="outreach-thread"
          width={600}
          height={582}
          narrow={{ width: 348, height: 628 }}
          stillTick={2280}
          className="cos-act-thread"
          label="Outreach to Hannah Weiss in three approved steps: a comment on her post, sent today; a LinkedIn connection note of 130 of 300 characters, scheduled for Tuesday at 10:14; and a direct message offering an onboarding checklist, scheduled for Friday at 9:40. Hannah replies: That would help a lot. Free for a call Thursday? Her stage moves from Engaging to Replied."
        />
      </div>
    </section>
  );
}
