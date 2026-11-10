import type { ReactNode } from "react";
import { LinkedInLogo, ThreadsLogo, XLogo } from "../brand/Logos";

/**
 * What the desktop nav's menus hold, from the product handover and the redesign pack (no feature
 * here that the handover does not show). A menu is a few columns of grouped links and one card on a
 * crop of the site's painted sky. The pages' URLs are the planned site map: most of them do not
 * exist in this repo yet.
 */
export type NavItem = { label: string; href: string; icon?: ReactNode; soon?: boolean };
export type NavGroup = { label: string; items: NavItem[] };
export type NavCard = { title: string; line: string; href: string; image: string };
export type NavMenu = { id: string; label: string; columns: NavGroup[][]; card: NavCard };

// a black single-colour mark (Codex, Cursor) turns light on the dark theme
const logo = (file: string, mono = false) => (
  <img src={`/brand/logos/${file}.png`} alt="" width={15} height={15} data-mono={mono || undefined} />
);

export const MENUS: NavMenu[] = [
  {
    id: "product",
    label: "Product",
    columns: [
      [
        {
          label: "Create",
          items: [
            { label: "Write in your voice", href: "/product/write" },
            { label: "Voice Lab", href: "/product/voice" },
            { label: "Trends and ideas", href: "/product/ideas" },
          ],
        },
        {
          label: "Engage",
          items: [
            { label: "Comment replies", href: "/product/replies" },
            { label: "Reply Queue", href: "/product/reply-queue" },
          ],
        },
      ],
      [
        {
          label: "Publish",
          items: [
            { label: "Calendar", href: "/product/calendar" },
            { label: "Autopilot", href: "/product/autopilot" },
            { label: "Platform variants", href: "/product/variants" },
          ],
        },
        {
          label: "Grow",
          items: [
            { label: "Network", href: "/product/network" },
            { label: "Leads", href: "/product/leads" },
          ],
        },
      ],
      [
        {
          label: "Measure",
          items: [
            { label: "Analytics", href: "/product/analytics" },
            { label: "Breakout tracker", href: "/product/breakout" },
          ],
        },
      ],
    ],
    card: { title: "Autopilot", line: "Posts on your schedule. Off until you switch it on.", href: "/product/autopilot", image: "product" },
  },
  {
    id: "solutions",
    label: "Solutions",
    columns: [
      [
        {
          label: "Personal assistants",
          items: [
            { label: "ContentOS for Claude", href: "/for/claude", icon: logo("claude") },
            { label: "ContentOS for Grok", href: "/for/grok", icon: logo("grok", true) },
            { label: "ContentOS for Muse", href: "/for/muse" },
          ],
        },
        {
          label: "Coding agents",
          items: [
            { label: "ContentOS for Claude Code", href: "/for/claude-code", icon: logo("claude") },
            { label: "ContentOS for Codex", href: "/for/codex", icon: logo("codex", true) },
            { label: "ContentOS for Cursor", href: "/for/cursor", icon: logo("cursor", true) },
            { label: "ContentOS for VS Code", href: "/for/vscode", icon: logo("vscode") },
          ],
        },
      ],
      [
        {
          label: "For teams",
          items: [
            { label: "Founders", href: "/use-cases/founders" },
            { label: "B2B creators", href: "/use-cases/creators" },
            { label: "Agencies", href: "/use-cases/agencies" },
          ],
        },
        {
          label: "Sales tools",
          items: [
            { label: "HubSpot", href: "/integrations/hubspot", icon: logo("hubspot") },
            { label: "Apollo", href: "/integrations/apollo", icon: logo("apollo") },
            { label: "Slack", href: "/integrations/slack", icon: logo("slack") },
          ],
        },
      ],
      [
        {
          label: "Platforms",
          items: [
            { label: "LinkedIn", href: "/integrations/linkedin", icon: <LinkedInLogo size={14} /> },
            { label: "X", href: "/integrations/x", icon: <XLogo size={13} /> },
            { label: "Threads", href: "/integrations/threads", icon: <ThreadsLogo size={15} /> },
          ],
        },
      ],
    ],
    card: { title: "Works inside your AI", line: "Draft and schedule from Claude, Grok, Muse or your code editor.", href: "/for/claude", image: "solutions" },
  },
  {
    id: "compare",
    label: "Compare",
    columns: [
      [
        {
          label: "ContentOS vs",
          items: ["Taplio", "Supergrow", "AuthoredUp", "ContentIn"].map((n) => ({ label: n, href: `/compare/${n.toLowerCase()}` })),
        },
      ],
      [
        {
          label: " ",
          items: ["Buffer", "Hootsuite", "Typefully", "ChatGPT"].map((n) => ({ label: n, href: `/compare/${n.toLowerCase()}` })),
        },
      ],
      [
        {
          label: "Alternatives to",
          items: ["Taplio", "Supergrow", "Buffer"].map((n) => ({ label: n, href: `/alternatives/${n.toLowerCase()}` })),
        },
      ],
    ],
    card: { title: "See it on your posts", line: "A short call with the team, on your own account.", href: "/book-demo", image: "compare" },
  },
  {
    id: "resources",
    label: "Resources",
    columns: [
      [
        {
          label: "Read",
          items: [
            { label: "Blog", href: "/blog" },
            { label: "Changelog", href: "/changelog" },
            { label: "Roadmap", href: "/roadmap" },
          ],
        },
      ],
    ],
    card: { title: "Changelog", line: "What shipped, week by week.", href: "/changelog", image: "resources" },
  },
];
