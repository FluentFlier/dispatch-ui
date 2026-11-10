"use client";

import { useRef, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

/**
 * A value people copy (the MCP URL): the text in mono, a Copy button that says Copied for a moment.
 * If the clipboard is refused, the text is selected and the button says how to copy it by hand.
 */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const text = useRef<HTMLElement>(null);
  const timer = useRef<number>();

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      const range = document.createRange();
      if (text.current) range.selectNodeContents(text.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      setState("manual");
    }
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  };

  return (
    <div className="cos-copy">
      <code ref={text} className="cos-copy-value" aria-label={label}>
        {value}
      </code>
      <button type="button" className="cos-copy-btn" onClick={copy} data-state={state}>
        {state === "copied" ? <IconCheck size={15} stroke={2} aria-hidden="true" /> : <IconCopy size={15} stroke={1.8} aria-hidden="true" />}
        <span>{state === "copied" ? "Copied" : state === "manual" ? "Press ⌘C" : "Copy"}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Copied to the clipboard" : state === "manual" ? "Selected. Press Command C or Control C to copy." : ""}
      </span>
    </div>
  );
}
