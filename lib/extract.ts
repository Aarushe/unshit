import "server-only";
import { parse, type HTMLElement } from "node-html-parser";
import type { SiteContent } from "./schema";

// Turns raw HTML into (a) a compact outline Claude can restructure and
// (b) a best-effort SiteContent built from heuristics alone.

export type PageDigest = {
  url: string;
  host: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  blocks: { tag: string; text: string }[];
  ctas: string[];
  quotes: { text: string; cite: string }[];
  faqs: { q: string; a: string }[];
  dated: { date: string; title: string }[];
};

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const words = (s: string, n: number) => {
  const w = s.split(" ");
  return w.length <= n ? s : w.slice(0, n).join(" ") + "…";
};
const firstSentence = (s: string) => clean(s).match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? s;
const noPeriod = (s: string) => s.replace(/[.!]+$/, "");

export function digest(html: string, url: URL): PageDigest {
  const root = parse(html, { comment: false });
  const meta = (sel: string) => clean(root.querySelector(sel)?.getAttribute("content") ?? "");

  root
    .querySelectorAll("script, style, noscript, svg, template, iframe, [aria-hidden=true]")
    .forEach((el) => el.remove());

  const title = clean(root.querySelector("title")?.text ?? "");
  const host = url.hostname.replace(/^www\./, "");
  const name =
    meta('meta[property="og:site_name"]') ||
    title.split(/\s[|–—·:-]\s/).map(clean).sort((a, b) => a.length - b.length)[0] ||
    host;
  const description =
    meta('meta[name="description"]') || meta('meta[property="og:description"]');
  const body = root.querySelector("main") ?? root.querySelector("body") ?? root;
  // Pages with several h1s use them as section labels; the title is safer then.
  const h1s = body.querySelectorAll("h1").map((h) => clean(h.text)).filter(Boolean);
  const h1 = h1s.length === 1 ? h1s[0] : meta('meta[property="og:title"]') || title;

  // Document-order outline of meaningful text, skipping site chrome.
  const blocks: PageDigest["blocks"] = [];
  const seen = new Set<string>();
  const inChrome = (el: HTMLElement) => {
    for (let p: HTMLElement | null = el; p; p = p.parentNode as HTMLElement | null) {
      const tag = p.tagName?.toLowerCase();
      if (tag === "nav" || tag === "footer" || tag === "header" || tag === "form") return true;
      if (/cookie|consent|newsletter|modal/i.test(p.getAttribute?.("class") ?? "")) return true;
    }
    return false;
  };
  for (const el of body.querySelectorAll("h1, h2, h3, h4, p, li, blockquote, dt, dd, figcaption")) {
    if (inChrome(el)) continue;
    const tag = el.tagName.toLowerCase();
    // Skip list items that only wrap links (menus, link farms).
    if (tag === "li" && el.querySelectorAll("a").length > 0 && clean(el.text).length < 30) continue;
    const text = clean(el.text);
    if (text.length < (tag.startsWith("h") ? 2 : 25) || text.length > 1200 || seen.has(text)) continue;
    seen.add(text);
    blocks.push({ tag, text });
    if (blocks.length >= 220) break;
  }

  const ctas = [
    ...new Set(
      body
        .querySelectorAll("a, button")
        .filter((el) => /btn|button|cta/i.test(el.getAttribute("class") ?? "") || el.getAttribute("role") === "button")
        .map((el) => clean(el.text))
        .filter((t) => t.length >= 3 && t.length <= 28),
    ),
  ].slice(0, 6);

  const quotes = body
    .querySelectorAll("blockquote")
    .map((q) => ({
      text: clean(q.querySelector("p")?.text ?? q.text),
      cite: clean(q.querySelector("cite, footer")?.text ?? ""),
    }))
    .filter((q) => q.text.length > 30)
    .slice(0, 3);

  const faqs: PageDigest["faqs"] = body
    .querySelectorAll("details")
    .map((d) => {
      const q = clean(d.querySelector("summary")?.text ?? "");
      return { q, a: clean(d.text.replace(q, "")) };
    })
    .filter((f) => f.q && f.a.length > 10);
  blocks.forEach((b, i) => {
    const next = blocks[i + 1];
    if (/^h[2-4]$/.test(b.tag) && b.text.endsWith("?") && next?.tag === "p") {
      faqs.push({ q: b.text, a: next.text });
    }
  });

  const dated = body
    .querySelectorAll("time")
    .map((t) => {
      const box = (t.closest("article") ?? t.closest("li") ?? t.parentNode) as HTMLElement | null;
      const heading = clean(box?.querySelector("h2, h3, h4, a")?.text ?? "");
      return { date: clean(t.text) || (t.getAttribute("datetime") ?? "").slice(0, 10), title: heading };
    })
    .filter((d) => d.date && d.title && d.title.length < 120)
    .filter((d, i, all) => all.findIndex((x) => x.title === d.title) === i)
    .slice(0, 6);

  return { url: url.toString(), host, name, title, description, h1, blocks, ctas, quotes, faqs: faqs.slice(0, 4), dated };
}

/** Plain-text rendering of the digest for the model. */
export function outline(d: PageDigest): string {
  const lines = [
    `URL: ${d.url}`,
    `Title: ${d.title}`,
    `Site name: ${d.name}`,
    d.description && `Meta description: ${d.description}`,
    d.ctas.length && `Buttons: ${d.ctas.join(" | ")}`,
    "",
    ...d.blocks.map((b) => `[${b.tag}] ${b.text}`),
    d.quotes.length && "\nQuotes:",
    ...d.quotes.map((q) => `> ${q.text} — ${q.cite}`),
    d.dated.length && "\nDated items:",
    ...d.dated.map((x) => `- ${x.date}: ${x.title}`),
  ];
  return lines.filter((l) => l !== 0 && l !== "" && l !== undefined).join("\n").slice(0, 60_000);
}

/* ----------------------------------------------------------------------------
 * Heuristic mapping — used when no API key is configured.
 * ------------------------------------------------------------------------- */

type Section = { heading: string; body: string; level: number };

function sections(d: PageDigest): Section[] {
  const out: Section[] = [];
  d.blocks.forEach((b, i) => {
    if (!/^h[2-4]$/.test(b.tag) || b.text.endsWith("?")) return;
    const following: string[] = [];
    for (let j = i + 1; j < d.blocks.length && !/^h[1-4]$/.test(d.blocks[j].tag); j++) {
      following.push(d.blocks[j].text);
      if (following.join(" ").length > 220) break;
    }
    const body = following.join(" ");
    if (b.text.length <= 70 && body.length >= 20) {
      out.push({ heading: b.text, body: words(body, 28), level: Number(b.tag[1]) });
    }
  });
  return out;
}

function splitLines(text: string, perLine = 6, max = 8): string[] {
  const w = text.split(" ");
  const lines: string[] = [];
  for (let i = 0; i < w.length && lines.length < max; i += perLine) {
    lines.push(w.slice(i, i + perLine).join(" "));
  }
  return lines;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
const initials = (s: string) =>
  s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "··";

export function heuristicContent(d: PageDigest): SiteContent {
  const paragraphs = d.blocks.filter((b) => b.tag === "p").map((b) => b.text);
  const secs = sections(d);

  const principleCount = secs.length >= 8 ? 6 : Math.min(3, secs.length);
  const principles = secs.slice(0, principleCount).map((s) => ({ title: s.heading, body: s.body }));
  const rest = secs.slice(principleCount);
  const programs = (rest.length >= 4 ? rest.slice(0, 4) : rest.slice(0, 2)).map((s, i) => ({
    slug: slug(s.heading) || `item-${i + 1}`,
    name: words(s.heading, 5),
    kind: `${String(i + 1).padStart(2, "0")}`,
    tags: [],
    body: s.body,
  }));

  const text = d.blocks.map((b) => b.text).join(" ");
  const stats = [
    ...text.matchAll(/(?<![\w$])(\$?\d[\d,.]*\s?(?:[kKmMbB]\b|%|\+)?\+?)\s+(?:[a-z]+\s){0,1}([a-z]{4,})/g),
  ]
    .filter((m) => !/^(19|20)\d\d$/.test(m[1].trim()) && m[1].replace(/\D/g, "").length >= 2)
    .map((m) => ({ value: m[1].trim(), label: m[2] }))
    .filter((s, i, all) => all.findIndex((x) => x.label === s.label) === i)
    .slice(0, 3);

  const lead = d.description || paragraphs[0] || d.title;
  const about = paragraphs.find((p) => p.length > 120) ?? lead;
  const quote = d.quotes[0];
  const spot = quote
    ? {
        initials: initials(quote.cite || d.name),
        title: quote.cite || d.name,
        subtitle: d.host,
        body: words(quote.text, 30),
        tags: [],
        ref: d.host,
      }
    : {
        initials: initials(d.name),
        title: d.name,
        subtitle: d.host,
        body: words(firstSentence(lead), 30),
        tags: (secs.slice(0, 3).map((s) => words(s.heading, 3))),
        ref: new Date().getFullYear().toString(),
      };

  const h2s = d.blocks.filter((b) => b.tag === "h2").map((b) => b.text);
  return {
    name: d.name,
    label: "redesign",
    badge: "",
    meta: [d.host, `${secs.length} sections`],
    headline: words(d.h1 || d.title || d.name, 12),
    tagline: noPeriod(firstSentence(lead)),
    intro: words(paragraphs.slice(0, 2).join(" ") || lead, 60),
    highlights: [],
    stats,
    spotlight: spot,
    statement: { title: "about", note: d.host, lines: splitLines(words(about, 48)) },
    command: `open https://${d.host}`,
    sections: {
      principles: { eyebrow: "Overview", title: h2s[0] ?? `What ${d.name} is about`, body: "" },
      programs: { eyebrow: "More", title: h2s[1] ?? "Take a closer look", body: "" },
      events: { eyebrow: "Latest", title: "Recent updates", body: "" },
    },
    principles,
    programs,
    events: d.dated.map((x) => ({ date: x.date, city: d.host, title: x.title, type: "Post" })),
    faqs: d.faqs,
    cta: {
      title: h2s.at(-1) && h2s.at(-1)!.length < 60 ? h2s.at(-1)! : `Visit ${d.name}`,
      body: words(firstSentence(lead), 25),
      primary: d.ctas[0] ?? "Get started",
      secondary: d.ctas[1] ?? "Stay in the loop",
    },
  };
}
