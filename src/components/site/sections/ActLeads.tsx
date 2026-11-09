import { ClayzoScene } from "./ClayzoScene";

/**
 * Act 2: finding customers. The hero shows the Leads board; this shows how people get onto it
 * (animations/lead-sort.ts): everyone who engaged with a post is matched against the ideal
 * customer, bucketed (ICP, Potential Lead, Community), ranked by fit with their signals, and the
 * top lead opens with why them, the angle in, and the next steps.
 */
export function ActLeads() {
  return (
    <section
      className="cos-act cos-act-flip"
      id="customers"
      aria-labelledby="act-leads-title"
    >
      {/* the audience as a halftone crowd, the buyers in it lighting up (animations/people-field.ts) */}
      <div className="cos-act-field" aria-hidden="true">
        <ClayzoScene
          name="people-field"
          width={1000}
          height={700}
          playWhen="visible"
        />
      </div>

      {/* under 1024 px the crowd becomes a strip above the heading */}
      <div className="cos-act-crowd" aria-hidden="true">
        <ClayzoScene
          name="people-field"
          width={390}
          height={190}
          narrow={{ width: 390, height: 190 }}
          playWhen="visible"
        />
      </div>

      <div className="cos-act-inner">
        <div className="cos-act-head">
          <h2 id="act-leads-title" className="cos-act-title">
            Find the buyers in your audience.
          </h2>
          <p className="cos-act-lede">
            ContentOS sorts everyone who likes or comments on your posts against
            your ideal customer, then tells you who to talk to first and why.
          </p>
        </div>

        <ClayzoScene
          name="lead-sort"
          width={1200}
          height={440}
          narrow={{ width: 348, height: 698 }}
          stillTick={1920}
          className="cos-act-scene cos-act-scene-leads"
          label="Six people who engaged with a post are sorted against the ideal customer: Hannah Weiss, a founder who raised funding, Owen Gallagher, a co-founder who joined an accelerator, and Arjun Mehta, a head of growth in a new role, are ICP; Fatima Rahman, who asked a question, is a Potential Lead; a writer and a designer are Community. Hannah is picked first: she commented on your onboarding post and raised a seed round last week, so the plan is to comment on her latest post today, connect in two days and send a DM in five."
        />
      </div>
    </section>
  );
}
