"use client";

import Link from "next/link";
import { ClayzoScene } from "./sections/ClayzoScene";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The page's last word: the promise, the way around the site (the nav's pages, the sections of this
 * page, and the brief's Company links), then ContentOS across the full width, drawn in the brand's
 * own paper planes (animations/plane-wordmark.ts). A wave loops the planes through the mark's
 * colours; on a desktop they turn away from the cursor.
 */
const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Write in your voice", href: "#product" },
      { label: "Find customers", href: "#customers" },
      { label: "Start conversations", href: "#conversations" },
      { label: "Autopilot and agents", href: "#more" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "Compare", href: "/compare" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Book a call", href: "/book-demo" },
      { label: "Sign in", href: "/login" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="cos-foot">
      <div className="cos-foot-inner">
        <div className="cos-foot-top">
          <p className="cos-foot-promise">
            Content and leads.
            <br />
            One loop.
          </p>
          <nav className="cos-foot-cols" aria-label="Footer">
            {COLUMNS.map((c) => (
              <div key={c.title} className="cos-foot-col">
                <h2 className="cos-foot-title">{c.title}</h2>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="cos-foot-link">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="cos-foot-base">
          <span>© {new Date().getFullYear()} ContentOS</span>
          <ThemeToggle />
        </div>
      </div>
      <div className="cos-foot-word">
        <ClayzoScene
          name="plane-wordmark"
          width={1440}
          height={242}
          narrow={{ width: 390, height: 62 }}
          narrowBelow={719}
          playWhen="visible"
          interactive
          label="ContentOS"
        />
      </div>
    </footer>
  );
}
