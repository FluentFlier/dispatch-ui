import { ClayzoScene } from "./ClayzoScene";

/**
 * Act 1: the voice check. The hero shows posts going out; this shows what happens to a draft
 * before anyone sees it (animations/voice-check.ts): the humanizer's AI tells are flagged, Voice QA
 * scores it on the app's six checks, a draft that misses is rewritten, and only a passing draft
 * waits for approval.
 */
export function ActVoice() {
  return (
    <section className="cos-act" id="product" aria-labelledby="act-voice-title">
      <div className="cos-act-mark" aria-hidden="true">
        <ClayzoScene
          name="dither-plane"
          width={1000}
          height={1000}
          playWhen="visible"
        />
      </div>

      {/* phones have no room for the big plane: a small flock crosses the band above the heading */}
      <div className="cos-act-flock" aria-hidden="true">
        <ClayzoScene
          name="plane-flock"
          width={390}
          height={160}
          playWhen="visible"
          stillTick={480}
        />
      </div>

      <div className="cos-act-inner">
        <h2 id="act-voice-title" className="cos-act-title">
          Drafts that sound like you.
        </h2>
        <p className="cos-act-lede">
          ContentOS learns how you write from your past posts. Every draft is
          checked before you see it, and anything that sounds generic gets
          rewritten.
        </p>

        <ClayzoScene
          name="voice-check"
          width={1200}
          height={404}
          narrow={{ width: 348, height: 564 }}
          stillTick={2280}
          className="cos-act-scene"
          label="A LinkedIn draft opening with 'In today's fast-paced world' is flagged for three AI tells and scores below threshold in Voice QA. It is rewritten as 'We lost 3 of our first 10 customers in month two', which passes all six checks: Persona, Unique, Specific, So what, Pain and AI slop. It then waits for your approval."
        />
      </div>
    </section>
  );
}
