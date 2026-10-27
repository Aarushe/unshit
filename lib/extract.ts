import "server-only";
import { parse, type HTMLElement, type Node } from "node-html-parser";
import { fixCase, learnCasing, type CaseDictionary } from "./casing";

// Reads a web page into an ordered list of content blocks — the page's own
// words, links, images, tables and forms, nothing added — so it can be
// re-rendered in our layout.

export type Inline = { t: string; href?: string; b?: true; i?: true; code?: true };

export type Field = {
  kind: "input" | "textarea" | "select" | "choice";
  type: string;
  name: string;
  label: string;
  required: boolean;
  placeholder: string;
  value: string;
  multiple: boolean;
  options: { label: string; value: string }[];
};

export type Block =
  | { k: "h"; level: number; text: string }
  | { k: "p"; c: Inline[] }
  | { k: "list"; ordered: boolean; items: { c: Inline[]; depth: number }[] }
  | { k: "quote"; c: Inline[] }
  | { k: "code"; text: string }
  | { k: "table"; head: string[]; rows: Inline[][][] }
  | { k: "img"; src: string; alt: string; caption: string }
  | { k: "form"; action: string; method: string; fields: Field[]; submit: string }
  /** Collapsible content: <details>, and pop-up dialogs the page opens from buttons. */
  | { k: "details"; summary: string; blocks: Block[]; id?: string }
  | { k: "hr" }
  /** Figure + label pairs that the page lays out as stats. */
  | { k: "stats"; items: { value: string; label: Inline[] }[] }
  /** Runs of short linked lines (feeds, indexes): a link line plus its meta lines. */
  | { k: "rows"; items: { main: Inline[]; meta: Inline[][] }[] };

export type Card = { title: string; blocks: Block[] };
export type Item = Block | { k: "cards"; cards: Card[] };
export type Section = { heading?: string; items: Item[] };

export type Page = {
  url: string;
  host: string;
  siteName: string;
  title: string;
  lead: Inline[] | null;
  nav: { label: string; href: string }[];
  kind: "article" | "page" | "feed";
  sections: Section[];
  words: number;
};

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

const ELEMENT = 1;
const TEXT = 3;
const isEl = (n: Node): n is HTMLElement => n.nodeType === ELEMENT;
const tag = (el: HTMLElement) => (el.rawTagName ?? "").toLowerCase();
const squash = (s: string) => s.replace(/\s+/g, " ");
const clean = (s: string) => squash(s).trim();

const INLINE = new Set([
  "a", "span", "b", "strong", "i", "em", "u", "s", "small", "big", "font", "code", "kbd",
  "samp", "var", "sup", "sub", "abbr", "time", "mark", "label", "cite", "q", "br", "dfn",
  "del", "ins", "bdi", "bdo", "wbr", "data", "tt",
]);
const DROP = new Set([
  "script", "style", "noscript", "svg", "template", "iframe", "object", "embed", "canvas",
  "video", "audio", "map", "dialog", "button", "input", "select", "textarea", "head", "link", "meta",
]);
const BOILERPLATE =
  /cookie|consent|gdpr|skip-?link|skip-?to|newsletter-?popup|modal|banner-?ad|advert|mw-editsection|noprint|dropdown|vector-menu|page-?tools|toolbar/i;

function hidden(el: HTMLElement): boolean {
  if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return true;
  const style = (el.getAttribute("style") ?? "").replace(/\s/g, "").toLowerCase();
  if (style.includes("display:none") || style.includes("visibility:hidden")) return true;
  const cls = `${el.getAttribute("class") ?? ""} ${el.id ?? ""}`;
  return /\b(sr-only|visually-hidden|screen-reader-text)\b/.test(cls) || BOILERPLATE.test(cls);
}

const DIALOG = /(^|\s)(modal|popup|lightbox|dialog)(\s|$)/i;
const PROMO = /cookie|consent|gdpr|newsletter|subscribe|sign-?up-?popup/i;

/** Pop-ups the page opens from a button. Their content is real, just hidden until clicked. */
function isDialog(el: HTMLElement): boolean {
  const role = el.getAttribute("role");
  const cls = el.getAttribute("class") ?? "";
  if (!(tag(el) === "dialog" || role === "dialog" || role === "alertdialog" || DIALOG.test(cls))) return false;
  return !PROMO.test(`${cls} ${el.id ?? ""} ${el.text.slice(0, 300)}`);
}

export const dialogAnchor = (id: string) => `dialog-${id.replace(/[^\w-]/g, "")}`;

function absolute(href: string | undefined, base: URL): string | undefined {
  if (!href) return undefined;
  try {
    const u = new URL(href.trim(), base);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

const textOf = (c: Inline[]) => c.map((s) => s.t).join("");
const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Merge adjacent same-format segments and normalise whitespace. */
function tidy(c: Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const seg of c) {
    const t = seg.t === "\n" ? "\n" : squash(seg.t);
    if (!t) continue;
    const prev = out.at(-1);
    if (prev && prev.t !== "\n" && t !== "\n" && prev.href === seg.href && prev.b === seg.b && prev.i === seg.i && prev.code === seg.code) {
      prev.t += t;
    } else out.push({ ...seg, t });
  }
  // Trim edges and collapse spaces across segment boundaries.
  while (out.length && (out[0].t === "\n" || !out[0].t.trim())) out.shift();
  while (out.length && (out.at(-1)!.t === "\n" || !out.at(-1)!.t.trim())) out.pop();
  if (out[0]) out[0].t = out[0].t.trimStart();
  if (out.at(-1)) out.at(-1)!.t = out.at(-1)!.t.trimEnd();
  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1], cur = out[i];
    if (prev.t.endsWith(" ") && cur.t.startsWith(" ")) cur.t = cur.t.slice(1);
    // Two different links touching in markup are separated visually on the original.
    else if (prev.href && cur.href && prev.href !== cur.href && !/\s$/.test(prev.t) && !/^\s/.test(cur.t)) {
      cur.t = ` ${cur.t}`;
    }
  }
  return out.filter((s) => s.t);
}

/* ----------------------------------------------------------------------------
 * Walker
 * ------------------------------------------------------------------------- */

const MAX_BLOCKS = 900;

class Reader {
  blocks: Block[] = [];
  labels = new Map<string, string>();
  /** Text of the buttons/links that open each dialog, by dialog id. */
  openers = new Map<string, string>();
  /** Dialog content, kept apart: it is hidden until clicked on the original. */
  dialogs: Block[] = [];
  constructor(private base: URL) {}

  full() {
    return this.blocks.length >= MAX_BLOCKS;
  }

  inlines(node: Node, fmt: Omit<Inline, "t"> = {}, out: Inline[] = []): Inline[] {
    if (node.nodeType === TEXT) {
      out.push({ ...fmt, t: (node as unknown as { text: string }).text });
      return out;
    }
    if (!isEl(node) || hidden(node)) return out;
    const name = tag(node);
    if (DROP.has(name) || name === "img") return out;
    if (name === "br") {
      out.push({ t: "\n" });
      return out;
    }
    const next = { ...fmt };
    if (name === "a") {
      const target = node.getAttribute("data-bs-target") ?? node.getAttribute("data-target") ?? "";
      const href = target.startsWith("#") ? `#${dialogAnchor(target.slice(1))}` : absolute(node.getAttribute("href"), this.base);
      if (href) next.href = href;
      // Image-only links: use the accessible name a screen reader would announce.
      if (href && !clean(node.text)) {
        const label = clean(
          node.getAttribute("aria-label") || node.getAttribute("title") || node.querySelector("img")?.getAttribute("alt") || "",
        );
        if (label) out.push({ ...next, t: label });
        return out;
      }
    }
    if (name === "b" || name === "strong") next.b = true;
    if (name === "i" || name === "em" || name === "cite" || name === "dfn") next.i = true;
    if (name === "code" || name === "kbd" || name === "samp" || name === "tt") next.code = true;
    if (name === "sup" && /^\[?\d+\]?$/.test(clean(node.text))) return out; // footnote markers
    for (const child of node.childNodes) this.inlines(child, next, out);
    return out;
  }

  /** Splits an inline run on blank lines (`<br><br>`) into paragraphs. */
  emitRun(run: Inline[]) {
    const parts: Inline[][] = [[]];
    for (let i = 0; i < run.length; i++) {
      const seg = run[i];
      if (seg.t === "\n" && run[i + 1]?.t === "\n") {
        parts.push([]);
        while (run[i + 1]?.t === "\n") i++;
      } else parts.at(-1)!.push(seg);
    }
    for (const part of parts) {
      const c = tidy(part);
      if (textOf(c).trim().length >= 1) this.blocks.push({ k: "p", c });
    }
  }

  image(el: HTMLElement, caption = "") {
    const src =
      absolute(el.getAttribute("src"), this.base) ??
      absolute(el.getAttribute("data-src"), this.base) ??
      absolute(el.getAttribute("srcset")?.split(/[\s,]+/)[0], this.base);
    if (!src || el.hasAttribute("usemap")) return; // image maps are navigation
    const alt = clean(el.getAttribute("alt") ?? "");
    // Alt text like "arrow_02" is a filename, not a description.
    const described = /\s/.test(alt) || (alt.length > 0 && !/[-_.]|\d$/.test(alt));
    if (!described && /arrow|spacer|bullet|divider|separator|\bicon/i.test(`${src} ${el.getAttribute("class") ?? ""}`)) return; // decoration
    const w = Number(el.getAttribute("width")), h = Number(el.getAttribute("height"));
    if ((w && w < 48) || (h && h < 48)) return; // icons, spacers, trackers
    this.blocks.push({ k: "img", src, alt: clean(el.getAttribute("alt") ?? ""), caption });
  }

  walk(el: HTMLElement) {
    let run: Inline[] = [];
    const flush = () => {
      if (run.length) this.emitRun(run);
      run = [];
    };

    for (const child of el.childNodes) {
      if (this.full()) break;
      if (child.nodeType === TEXT) {
        run.push({ t: (child as unknown as { text: string }).text });
        continue;
      }
      if (!isEl(child)) continue;
      if (isDialog(child)) {
        flush();
        this.dialog(child);
        continue;
      }
      if (hidden(child)) continue;
      const name = tag(child);
      if (DROP.has(name)) continue;
      if (INLINE.has(name)) {
        // Inline wrappers that hide whole blocks (e.g. <span><p>…</p></span>) are walked.
        if (child.querySelector("p, div, ul, ol, table, h1, h2, h3, h4, form, img, blockquote, pre")) {
          flush();
          this.walk(child);
        } else this.inlines(child, {}, run);
        continue;
      }
      flush();
      this.block(child, name);
    }
    flush();
  }

  block(el: HTMLElement, name: string) {
    if (/^h[1-6]$/.test(name)) {
      const text = clean(el.text);
      if (text) this.blocks.push({ k: "h", level: Number(name[1]), text });
      return;
    }
    switch (name) {
      case "p": {
        if (el.querySelector("p, div, ul, ol, table")) return this.walk(el);
        this.emitRun(this.inlines(el));
        el.querySelectorAll("img").forEach((img) => this.image(img));
        return;
      }
      case "img":
        return this.image(el);
      case "figure": {
        const caption = clean(el.querySelector("figcaption")?.text ?? "");
        const imgs = el.querySelectorAll("img");
        if (imgs.length) return imgs.forEach((img, i) => this.image(img, i === 0 ? caption : ""));
        return this.walk(el);
      }
      case "picture": {
        const img = el.querySelector("img");
        if (img) this.image(img);
        return;
      }
      case "ul":
      case "ol":
        return this.list(el, name === "ol");
      case "dl": {
        const items = el.childNodes.filter(isEl).map((d) => ({
          c: tidy(tag(d) === "dt" ? [{ t: clean(d.text), b: true as const }] : this.inlines(d)),
          depth: tag(d) === "dd" ? 1 : 0,
        }));
        if (items.length) this.blocks.push({ k: "list", ordered: false, items });
        return;
      }
      case "blockquote": {
        if (el.querySelector("p, div")) {
          const c = tidy(el.querySelectorAll("p").flatMap((p) => [...this.inlines(p), { t: " " }]));
          if (c.length) this.blocks.push({ k: "quote", c });
          return;
        }
        const c = tidy(this.inlines(el));
        if (c.length) this.blocks.push({ k: "quote", c });
        return;
      }
      case "pre": {
        const text = el.text.replace(/\n+$/, "");
        if (text.trim()) this.blocks.push({ k: "code", text });
        return;
      }
      case "hr":
        this.blocks.push({ k: "hr" });
        return;
      case "table":
        return this.table(el);
      case "form":
        return this.form(el);
      case "details": {
        const summaryEl = el.querySelector("summary");
        const summary = clean(summaryEl?.text ?? "");
        summaryEl?.remove();
        const blocks = this.read(el);
        if (summary && blocks.length) this.blocks.push({ k: "details", summary, blocks });
        else this.blocks.push(...blocks);
        return;
      }
      default:
        this.walk(el);
    }
  }

  /** Reads an element's content as its own block list. */
  read(el: HTMLElement): Block[] {
    const sub = new Reader(this.base);
    sub.labels = this.labels;
    sub.openers = this.openers;
    sub.dialogs = this.dialogs;
    sub.walk(el);
    return sub.blocks;
  }

  dialog(el: HTMLElement) {
    const labelled = el.getAttribute("aria-labelledby");
    const titleEl =
      (labelled ? el.querySelector(`#${labelled.split(/\s+/)[0]}`) : null) ??
      el.querySelector('.modal-title, [class*="title"], h1, h2, h3, h4, h5');
    // The button that opens it names it best; the dialog's own title is next.
    const summary = (el.id && this.openers.get(el.id)) || clean(titleEl?.text ?? "");
    if (titleEl && clean(titleEl.text).length <= 80) titleEl.remove();
    // Walk the dialog's body, skipping its frame (header, close buttons, footer).
    const body = el.querySelector('.modal-body, [class*="dialog-body"], [class*="popup-body"]') ?? el;
    const blocks = this.read(body);
    const words = blocks.reduce((n, b) => n + (b.k === "p" || b.k === "quote" ? wordCount(textOf(b.c)) : b.k === "list" ? b.items.length * 5 : 10), 0);
    if (words < 3) return;
    this.dialogs.push({ k: "details", summary: summary || "More", blocks, id: el.id ? dialogAnchor(el.id) : undefined });
  }

  list(el: HTMLElement, ordered: boolean, depth = 0, into?: { c: Inline[]; depth: number }[]) {
    const items = into ?? [];
    for (const li of el.childNodes.filter(isEl)) {
      if (tag(li) !== "li" || hidden(li)) continue;
      if (li.querySelector("a[hreflang], a[lang]")) continue; // language switchers
      const own: Inline[] = [];
      const nested: HTMLElement[] = [];
      for (const child of li.childNodes) {
        if (isEl(child) && (tag(child) === "ul" || tag(child) === "ol")) nested.push(child);
        else this.inlines(child, {}, own);
      }
      const c = tidy(own.map((s) => (s.t === "\n" ? { ...s, t: " " } : s)));
      if (c.length) items.push({ c, depth });
      nested.forEach((n) => this.list(n, tag(n) === "ol", depth + 1, items));
      if (items.length > 150) break;
    }
    if (!into && items.length) this.blocks.push({ k: "list", ordered, items });
  }

  table(el: HTMLElement) {
    const rows = el.querySelectorAll("tr").filter((tr) => tr.closest("table") === el);
    const nested = el.querySelector("table");
    const cells = (tr: HTMLElement) => tr.childNodes.filter(isEl).filter((c) => ["td", "th"].includes(tag(c)));
    const isData =
      !nested &&
      !el.querySelector("form") &&
      rows.length >= 2 &&
      // Only tables that declare headers are data; header-less ones are usually layout.
      (el.querySelector("th") !== null || el.querySelector("thead") !== null) &&
      el.getAttribute("role") !== "presentation";

    if (!isData) {
      // Layout table: read cell contents in order.
      for (const tr of rows) for (const cell of cells(tr)) this.walk(cell);
      if (rows.length === 0) this.walk(el);
      return;
    }

    const first = rows[0];
    const headerRow = cells(first).every((c) => tag(c) === "th");
    const head = headerRow ? cells(first).map((c) => clean(c.text)) : [];
    const body = (headerRow ? rows.slice(1) : rows).slice(0, 80);
    this.blocks.push({
      k: "table",
      head,
      rows: body.map((tr) => cells(tr).map((c) => tidy(this.inlines(c).map((s) => (s.t === "\n" ? { ...s, t: " " } : s))))),
    });
  }

  form(el: HTMLElement) {
    const action = absolute(el.getAttribute("action") || this.base.toString(), this.base);
    if (!action) return;
    const method = (el.getAttribute("method") ?? "get").toLowerCase() === "post" ? "post" : "get";
    const fields: Field[] = [];
    const labelFor = (input: HTMLElement) =>
      clean(
        (input.id && this.labels.get(input.id)) ||
          input.closest("label")?.text ||
          input.getAttribute("aria-label") ||
          input.getAttribute("title") ||
          input.getAttribute("placeholder") ||
          input.getAttribute("name") ||
          "",
      );

    for (const input of el.querySelectorAll("input, textarea, select")) {
      const name = input.getAttribute("name") ?? "";
      const t = (input.getAttribute("type") ?? "text").toLowerCase();
      if (["submit", "button", "image", "reset", "file"].includes(t)) continue;
      const base: Field = {
        kind: "input",
        type: t,
        name,
        label: labelFor(input),
        required: input.hasAttribute("required"),
        placeholder: input.getAttribute("placeholder") ?? "",
        value: input.getAttribute("value") ?? "",
        multiple: input.hasAttribute("multiple"),
        options: [],
      };
      const n = tag(input);
      if (n === "textarea") fields.push({ ...base, kind: "textarea", value: input.text });
      else if (n === "select") {
        fields.push({
          ...base,
          kind: "select",
          options: input.querySelectorAll("option").map((o) => ({
            label: clean(o.text),
            value: o.getAttribute("value") ?? clean(o.text),
          })),
        });
      } else if (t === "radio" || t === "checkbox") {
        // Group choices that share a name; the group label comes from a fieldset legend.
        const legend = clean(input.closest("fieldset")?.querySelector("legend")?.text ?? "");
        const group = fields.find((f) => f.kind === "choice" && f.name === name && f.type === t);
        const option = { label: labelFor(input), value: input.getAttribute("value") ?? "on" };
        if (group) group.options.push(option);
        else fields.push({ ...base, kind: "choice", label: legend || (t === "radio" ? name : ""), options: [option] });
      } else fields.push(base);
    }

    const submitEl = el.querySelector('button:not([type=button]):not([type=reset]), input[type=submit]');
    const submit = clean(submitEl?.getAttribute("value") || submitEl?.text || "") || "Submit";
    if (fields.some((f) => f.type !== "hidden")) {
      this.blocks.push({ k: "form", action, method, fields, submit });
    }
    // Text that lives inside the form (headings, help copy) still matters.
    for (const child of el.querySelectorAll("h1, h2, h3, h4, p")) {
      if (!child.closest("label")) this.block(child, tag(child));
    }
  }
}

/* ----------------------------------------------------------------------------
 * Grouping
 * ------------------------------------------------------------------------- */

/** A paragraph that reads like a feed line: short, and either linked or a tiny marker. */
function rowish(b: Block): boolean {
  if (b.k !== "p") return false;
  const text = textOf(b.c).trim();
  return text.length <= 4 || (text.length <= 240 && b.c.some((s) => s.href));
}

function collapseRows(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; ) {
    let j = i;
    while (j < blocks.length && rowish(blocks[j])) j++;
    if (j - i >= 6) {
      const items: { main: Inline[]; meta: Inline[][] }[] = [];
      let prefix: Inline[] = [];
      for (const b of blocks.slice(i, j) as { k: "p"; c: Inline[] }[]) {
        const text = textOf(b.c).trim();
        if (text.length <= 4) {
          prefix = [...prefix, ...b.c, { t: " " }];
          continue;
        }
        if (b.c[0]?.href || prefix.length || items.length === 0) {
          items.push({ main: tidy([...prefix, ...b.c]), meta: [] });
          prefix = [];
        } else items.at(-1)!.meta.push(b.c);
      }
      out.push({ k: "rows", items });
      i = j;
    } else {
      out.push(blocks[i]);
      i++;
    }
  }
  return out;
}

const figure = (b: Block | undefined) =>
  b?.k === "p" && /\d/.test(textOf(b.c)) && textOf(b.c).trim().length <= 10;
const caption = (b: Block | undefined) =>
  b?.k === "p" && !figure(b) && textOf(b.c).trim().length <= 90;

/** "135+" followed by "currencies supported", repeated, reads as a stats row. */
function collapseStats(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; ) {
    let j = i;
    while (figure(blocks[j]) && caption(blocks[j + 1])) j += 2;
    if (j - i >= 4) {
      const items = [];
      for (let n = i; n < j; n += 2) {
        items.push({
          value: textOf((blocks[n] as { c: Inline[] }).c).trim(),
          label: (blocks[n + 1] as { c: Inline[] }).c,
        });
      }
      out.push({ k: "stats", items });
      i = j;
    } else out.push(blocks[i++]);
  }
  return out;
}

function wordsIn(blocks: Block[], kinds: Block["k"][]) {
  let n = 0;
  for (const b of blocks) {
    if (!kinds.includes(b.k)) continue;
    if (b.k === "p" || b.k === "quote") n += wordCount(textOf(b.c));
    if (b.k === "list") n += b.items.reduce((a, it) => a + wordCount(textOf(it.c)), 0);
  }
  return n;
}

function group(blocks: Block[], cards: boolean): Section[] {
  const levels = blocks.flatMap((b) => (b.k === "h" && b.level > 1 ? [b.level] : []));
  const counts = new Map<number, number>();
  levels.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));
  const top = [...counts.keys()].sort((a, b) => a - b).find((l) => counts.get(l)! >= 2) ?? Math.min(...levels, 2);

  const sections: Section[] = [{ items: [] }];
  for (const b of blocks) {
    if (b.k === "h" && b.level <= top) sections.push({ heading: b.text, items: [] });
    else sections.at(-1)!.items.push(b);
  }

  if (!cards) return sections.filter((s) => s.heading || s.items.length);

  // Short sub-sections under one heading read better side by side.
  for (const s of sections) {
    const items = s.items as Block[];
    const starts = items.flatMap((b, i) => (b.k === "h" ? [i] : []));
    if (starts.length < 3) continue;
    const groups = starts.map((start, n) => ({
      title: (items[start] as { text: string }).text,
      blocks: items.slice(start + 1, starts[n + 1] ?? items.length),
    }));
    const compact = groups.every(
      (g) =>
        g.blocks.length <= 4 &&
        wordsIn(g.blocks, ["p", "list", "quote"]) <= 90 &&
        g.blocks.every((b) => ["p", "list", "img"].includes(b.k)),
    );
    if (!compact) continue;
    s.items = [...items.slice(0, starts[0]), { k: "cards", cards: groups }];
  }
  // Runs of tiny sections (process steps, feature blurbs) become one row of cards
  // under the section before them.
  const merged: Section[] = [];
  // A section's lead-in: the blocks before its first sub-heading.
  const leadIn = (s: Section) => {
    const end = s.items.findIndex((b) => b.k === "h");
    return end === -1 ? s.items.length : end;
  };
  const tinyLead = (s: Section) => {
    const n = leadIn(s);
    const lead = s.items.slice(0, n) as Block[];
    return !!s.heading && n > 0 && n <= 3 && lead.every((b) => b.k === "p" || b.k === "img") && wordsIn(lead, ["p"]) <= 40;
  };
  const tiny = (s: Section) => tinyLead(s) && leadIn(s) === s.items.length;
  for (let i = 0; i < sections.length; ) {
    let j = i;
    while (j < sections.length && tiny(sections[j])) j++;
    // The last step may carry more content after its lead-in; that stays a section.
    const tail = j < sections.length && tinyLead(sections[j]) ? sections[j] : null;
    const count = j - i + (tail ? 1 : 0);
    if (count >= 3) {
      const run = sections.slice(i, j).concat(tail ? [tail] : []);
      const cards = run.map((s) => ({ title: s.heading!, blocks: s.items.slice(0, leadIn(s)) as Block[] }));
      const host = merged.at(-1) ?? { items: [] };
      if (!merged.length) merged.push(host);
      host.items.push({ k: "cards", cards });
      if (tail) merged.push({ items: tail.items.slice(leadIn(tail)) });
      i = j + (tail ? 1 : 0);
    } else merged.push(sections[i++]);
  }
  return merged.filter((s) => s.heading || s.items.length);
}

/** Titles are never all caps: rewrite shouted headings, labels and lines. */
function recase(b: Block, dict: CaseDictionary) {
  const line = (c: Inline[]) => {
    if (c.length && fixCase(textOf(c), dict) !== textOf(c)) c.forEach((s) => (s.t = fixCase(s.t, dict)));
  };
  if (b.k === "h") b.text = fixCase(b.text, dict);
  if (b.k === "p" || b.k === "quote") line(b.c);
  if (b.k === "list") b.items.forEach((it) => line(it.c));
  if (b.k === "rows") b.items.forEach((it) => line(it.main));
  if (b.k === "table") b.head = b.head.map((h) => fixCase(h, dict));
  if (b.k === "form") {
    b.submit = fixCase(b.submit, dict);
    b.fields.forEach((f) => (f.label = fixCase(f.label, dict)));
  }
  if (b.k === "details") {
    b.summary = fixCase(b.summary, dict);
    b.blocks.forEach((x) => recase(x, dict));
  }
}

/* ----------------------------------------------------------------------------
 * Entry
 * ------------------------------------------------------------------------- */

export function readPage(html: string, url: URL): Page {
  const doc = parse(html, { comment: false, blockTextElements: { pre: true, script: false, style: false, noscript: false } });
  const meta = (sel: string) => clean(doc.querySelector(sel)?.getAttribute("content") ?? "");
  const baseHref = doc.querySelector("base")?.getAttribute("href");
  const base = baseHref ? new URL(baseHref, url) : url;
  const host = url.hostname.replace(/^www\./, "");
  const title = clean(doc.querySelector("title")?.text ?? "");
  const titleParts = title.split(/\s[|–—·-]\s/).map(clean).filter(Boolean);
  // A bare page title isn't a site name; fall back to the host then.
  const siteName =
    meta('meta[property="og:site_name"]') ||
    (titleParts.length > 1 ? [...titleParts].sort((a, b) => a.length - b.length)[0] : host);

  const body = doc.querySelector("body") ?? doc;
  const casing = learnCasing(`${title} ${body.textContent}`);
  const reader = new Reader(base);
  body.querySelectorAll("label[for]").forEach((l) => reader.labels.set(l.getAttribute("for")!, clean(l.text)));
  for (const opener of body.querySelectorAll("[data-target], [data-bs-target], a[href^='#']")) {
    const target = opener.getAttribute("data-bs-target") ?? opener.getAttribute("data-target") ?? opener.getAttribute("href") ?? "";
    const label = clean(opener.text);
    if (target.startsWith("#") && label.length >= 2 && label.length <= 60 && !reader.openers.has(target.slice(1))) {
      reader.openers.set(target.slice(1), label);
    }
  }

  // Site navigation: the first nav (or header) links, kept as the site's own menu.
  const navRoot = body.querySelector("nav") ?? body.querySelector("header");
  const nav: Page["nav"] = [];
  for (const a of navRoot?.querySelectorAll("a") ?? []) {
    const label = clean(a.text);
    const href = absolute(a.getAttribute("href"), base);
    if (!href || label.length < 2 || label.length > 28 || nav.some((n) => n.href === href || n.label === label)) continue;
    nav.push({ label, href });
    if (nav.length >= 7) break;
  }

  // Content root: the page's main region if it marks one, else the body without chrome.
  const main =
    body.querySelector("main") ??
    body.querySelector('[role="main"]') ??
    (body.querySelectorAll("article").length === 1 ? body.querySelector("article") : null);
  const root = main ?? body;
  root
    .querySelectorAll('nav, [role="navigation"], [role="search"], [role="complementary"], [role="menu"], [role="toolbar"], [role="tablist"]')
    .forEach((el) => el.remove());
  if (!main) root.querySelectorAll("header, footer").forEach((el) => el.remove());

  reader.walk(root);
  let blocks = reader.blocks;

  // Hero: the page's h1 (or <title>) and an immediately following short paragraph.
  // Pages with several h1s use them as section labels, so the title leads instead.
  const h1Count = blocks.filter((b) => b.k === "h" && b.level === 1).length;
  if (h1Count > 1) blocks = blocks.map((b) => (b.k === "h" && b.level === 1 ? { ...b, level: 2 } : b));
  const h1Index = blocks.findIndex((b) => b.k === "h" && b.level === 1);
  const pageTitle =
    h1Index >= 0 ? (blocks[h1Index] as { text: string }).text : meta('meta[property="og:title"]') || title || siteName;
  let lead: Inline[] | null = null;
  if (h1Index >= 0) {
    const next = blocks[h1Index + 1];
    const remove = [h1Index];
    if (next?.k === "p" && wordCount(textOf(next.c)) <= 70 && !rowish(next)) {
      lead = next.c;
      remove.push(h1Index + 1);
    }
    blocks = blocks.filter((_, i) => !remove.includes(i));
  }

  // A lone step number before a heading belongs to it ("1" + "Apply online").
  blocks = blocks.flatMap((b, i) => {
    const next = blocks[i + 1];
    if (b.k === "p" && /^\d{1,2}\.?$/.test(textOf(b.c).trim()) && next?.k === "h") {
      next.text = `${textOf(b.c).trim().replace(/\.$/, "")}. ${next.text}`;
      return [];
    }
    return [b];
  });
  blocks = collapseRows(collapseStats(blocks));
  const prose = wordsIn(blocks, ["p", "quote"]);
  const all = wordsIn(blocks, ["p", "quote", "list"]) + blocks.filter((b) => b.k === "rows").length * 50;
  const rowsShare = blocks.filter((b) => b.k === "rows").reduce((a, b) => a + (b.k === "rows" ? b.items.length : 0), 0);
  // Articles are long runs of real paragraphs, not many short marketing lines.
  const paragraphs = blocks.filter((b) => b.k === "p").length;
  const kind: Page["kind"] =
    rowsShare >= 10 && prose < 400
      ? "feed"
      : prose >= 600 && prose / Math.max(all, 1) >= 0.6 && prose / Math.max(paragraphs, 1) >= 22
        ? "article"
        : "page";

  for (const b of blocks) recase(b, casing);
  reader.dialogs.forEach((b) => recase(b, casing));
  return {
    url: url.toString(),
    host,
    siteName: fixCase(siteName, casing),
    title: fixCase(pageTitle, casing),
    lead,
    nav: nav.map((n) => ({ ...n, label: fixCase(n.label, casing) })),
    kind,
    // Dialog content follows everything visible, as it does for a visitor.
    sections: [...group(blocks, kind === "page"), ...(reader.dialogs.length ? [{ items: reader.dialogs }] : [])],
    words: all,
  };
}
