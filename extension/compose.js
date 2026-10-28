// Rebuilds the page from a small set of building blocks, in the New Internet
// Society design.
//
// Every website is made of the same parts once its visuals are stripped away:
// who it is (identity), where you can go (navigation), what it wants you to
// know now (notices), what you came to do (a primary task: a call to action or
// a form), groups of content (sections holding prose, cards, steps, action
// tiles, link lists, tables, contacts, logos, disclosures) and the small print
// (footer). The reader below finds those parts using conventions every page
// follows (landmarks, headings, drawn boxes, repetition, forms, links), builds
// a page model, and the renderers lay the model out with one set of blocks
// that combine in any order.
//
// The page keeps working: form controls are the page's own live elements,
// moved into our layout (still owned by their form, so validation, captchas
// and submission run as before), and links and buttons pass clicks to the
// originals, so the site's scripts handle them. The original page stays loaded
// underneath, hidden; pop-ups it opens are shown. Pages that can't be read with
// confidence (web apps, editors, maps) are restyled instead (content.js).

(() => {
  if (window.__nisCompose) return;
  const html = document.documentElement;
  if (!(html instanceof HTMLHtmlElement)) return;
  const top = window.top === window;

  // Our layout lives in a shadow root, so no page style reaches it: its stylesheet is
  // read now, while the page loads.
  const SHEET = (() => {
    try {
      return globalThis.chrome.runtime.getURL("compose.css"); // (chrome is shadowed below)
    } catch {
      return "";
    }
  })();
  let sheetText = "";
  if (top && SHEET) fetch(SHEET).then((r) => r.text()).then((t) => (sheetText = t), () => {});

  // Hold the page back until we've decided, so it never flashes half-done.
  if (top) {
    html.classList.add("nis-wait");
    setTimeout(() => html.classList.remove("nis-wait"), 7000);
  }

  // Reads a page can't shadow (a <form> exposes fields named "tagName", "children"…).
  const getter = (proto, name) => Object.getOwnPropertyDescriptor(proto, name).get;
  const tagNameOf = getter(Element.prototype, "tagName");
  const childrenOf = getter(Element.prototype, "children");
  const T = (el) => (el ? tagNameOf.call(el).toUpperCase() : "");
  const kids = (el) => [...childrenOf.call(el)];

  const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "HEAD", "TITLE", "BASE", "IFRAME", "OBJECT", "EMBED", "CANVAS", "AUDIO", "MAP", "DIALOG"]);
  const HEADING = /^H[1-6]$/;
  const CONTROL = "input:not([type=hidden]), select, textarea";
  const BOILERPLATE = /(^|[\s_-])(page-?tools|toolbar|vector-menu|vector-dropdown|mw-portlet|breadcrumbs?|cookie|consent|gdpr|skip-?link|skip-?to|sr-only|visually-hidden|screen-reader|mw-editsection|noprint|print-only|back-?to-?top|scroll-?top|go-?top|chat-?bot|chatbot|livechat|live-?chat|whatsapp|feedback-?tab|floating|sticky-?cta|social-?share|share-?bar|ad-?slot|advert|ads?-?container|newsletter-?popup|feedback-?(form|widget|tab|banner|survey|prompt)|page-?feedback|c-feedback|page-?rating|was-?this-?helpful|onetrust|optanon|fides|cookiebot|usercentrics|didomi|truste|qc-cmp|sp_message|cmplz|osano|iubenda|termly|cc-window|cc-banner)/i;
  const WIDGET_TEXT = /\b(cookies?|consent|chat with|live chat|we use cookies|accept all)\b/i;
  const CTA = /\b(apply|sign ?up|sign ?in|log ?in|login|register|get started|start|open (an )?account|book|buy|order|pay|donate|join|subscribe|download|try|contact us|check|track|renew|request|create|submit|enrol|enroll|shop)\b/i;
  const PHONE = /((?:\(\+?\d{1,4}\)\s*)?\+?\d[\d\s.-]{6,}\d)(?![\d)])/;
  const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const GENERIC = /^(home|home ?page|welcome|index|main|start|official (web)?site|default)$/i;
  // Link words that say "go there", not what is there.
  const MORE = /^(know|read|learn|view|see|show|find out|discover|explore) ?(more|all|details|now)?\s*[›»→>]*$|^(more|details|click here|here|open|go)\s*[›»→>]*$/i;
  // Page numbers and pager words.
  const PAGER = /^(\d{1,3}|next|prev(ious)?|first|last|older|newer|[«»‹›<>…]+|\.\.\.)$/i;

  /* --------------------------------------------------------------------------
   * Reading helpers
   * ------------------------------------------------------------------------ */

  // A read of the page writes nothing, yet asks about the same elements again and
  // again (a collection's items are measured, then read, then counted): within
  // one read, each answer is kept.
  let memo = null;
  function reading(fn) {
    memo = { css: new Map(), rect: new Map(), shown: new Map(), widget: new Map(), text: new Map() };
    try {
      return fn();
    } finally {
      memo = null;
    }
  }
  const remember = (table, el, compute) => {
    if (!memo) return compute(el);
    const m = memo[table];
    let v = m.get(el);
    if (v === undefined && !m.has(el)) m.set(el, (v = compute(el)));
    return v;
  };

  const css = (el) => remember("css", el, getComputedStyle);
  const rect = (el) => remember("rect", el, (e) => e.getBoundingClientRect());
  const squash = (s) => s.replace(/\s+/g, " ");
  const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
  const vw = () => (memo ? (memo.vw ??= html.clientWidth || window.innerWidth || 1) : html.clientWidth || window.innerWidth || 1);

  let slots = new Map(); // comment placeholder → adopted live element
  const real = (n) => (n.nodeType === 8 && slots.has(n) ? slots.get(n) : n);
  // Read-only: without placeholders, the element's own child list, uncopied.
  const nodesOf = (el) => (slots.size ? [...el.childNodes].map(real) : el.childNodes);
  const elsOf = (el) => Array.prototype.filter.call(nodesOf(el), (n) => n.nodeType === 1);
  /** querySelectorAll that also finds controls we moved into our layout (through their placeholders). */
  function qsa(el, sel) {
    if (!slots.size) return [...el.querySelectorAll(sel)];
    const out = [];
    const visit = (n) => {
      for (const c of nodesOf(n)) {
        if (c.nodeType !== 1) continue;
        if (c.matches(sel)) out.push(c);
        visit(c);
      }
    };
    visit(el);
    return out;
  }
  const has = (el, sel) => (slots.size ? qsa(el, sel).length > 0 : !!el.querySelector(sel));
  // Header and footer parts, read on their own and skipped by the main walk.
  let excluded = new Set();

  const shown = (el) => remember("shown", el, shownNow);
  function shownNow(el) {
    if (el.__nisAdopted) return true;
    if (el.getClientRects().length === 0) {
      return css(el).display === "contents";
    }
    if (el.checkVisibility && !el.checkVisibility({ checkVisibilityCSS: true })) return false;
    // Faded out: hidden, unless a carousel or a scroll-reveal animation faded it (they fade
    // their content while they rebuild or until it scrolls in; it is still the page's content).
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true })) {
      let faded = el;
      while (faded && css(faded).opacity !== "0") faded = faded.parentElement;
      if (!faded || !(inCarousel(faded) || REVEAL.test(ident(faded)) || faded.hasAttribute("data-aos"))) return false;
    }
    const r = rect(el);
    if (r.width <= 2 || r.height <= 2) {
      const cs = css(el);
      if (cs.overflow === "hidden" || cs.clip !== "auto" || cs.clipPath !== "none") return false;
    }
    return true;
  }

  const ident = (el) => `${el.getAttribute("class") || ""} ${el.id || ""}`;
  // Scroll-reveal animations (AOS, WOW, Animate.css and the like) fade content until it's in view.
  const REVEAL = /(^|[\s_-])(aos-|wow|animate__|animated|reveal|fade-?in|fade-?up|scroll-?anim)/i;

  /** Things that float over the page (chat bubbles, promos, cookie bars, feedback tabs) are left out. */
  const widget = (el) => remember("widget", el, widgetNow);
  function widgetNow(el) {
    if (BOILERPLATE.test(ident(el))) return true;
    const cs = css(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") return false;
    const r = rect(el);
    // A bar across the top is the site's header, not a widget.
    if (r.top <= 4 && r.width >= vw() * 0.9 && r.height < 200 && !WIDGET_TEXT.test(el.textContent.slice(0, 400))) return false;
    return true;
  }

  /**
   * Carousels: their slides are content, whatever the carousel hides (off-screen slides
   * are often aria-hidden, even visible ones). Their controls (arrows, dots, "slide 2 of 5",
   * pause) are not: the layout shows every slide at once.
   */
  const CAROUSEL = /slide|swiper|carousel|slick|owl-|splide|glide|embla|flickity|slider/i;
  const SLIDES = '[aria-roledescription~="carousel" i], [aria-roledescription~="slide" i], .swiper, .slick-slider, .owl-carousel, .splide, .glide, .embla, .carousel, .flickity-enabled';
  const inCarousel = (el) => CAROUSEL.test(ident(el)) || !!el.closest(SLIDES);
  const CHROME_TEXT = /^([‹›«»<>←→↑↓⟨⟩❮❯]|prev(ious)?|next|pause|stop|auto-?play)( (slide|item|page|image))?$|^(go to |show )?(slide|item|page|image) \d+|^displaying (slide|item)|^\d+\s*(of|\/)\s*\d+$/i;
  const CHROME_CLASS = /(^|[\s_-])(dots?|pagination|indicators?|bullets?|arrows?|swiper-button|slick-(dots|arrow|prev|next)|carousel-(control|indicators)|splide__(arrows?|pagination)|embla__(dots?|buttons?|prev|next)|prev|next|pager)([\s_-]|$)/i;
  function chrome(el) {
    const role = el.getAttribute("role") || "";
    if (!clickable(el) && role !== "status" && role !== "tablist" && !CHROME_CLASS.test(ident(el))) return false;
    const text = textIn(el);
    if (CHROME_TEXT.test(text)) return true;
    // An unlabelled little control (a dot, an arrow drawn in CSS).
    return !text && !el.querySelector("img") && rect(el).width < 80 && rect(el).height < 80 && (role === "status" || inCarousel(el) || CHROME_CLASS.test(ident(el)) || T(el) === "BUTTON");
  }

  /** Decoration or in-page navigation: not read as content, and not counted as missing. */
  const decoration = (el) =>
    (el.getAttribute("aria-hidden") === "true" && !inCarousel(el)) ||
    T(el) === "NAV" ||
    /^(navigation|toolbar|tablist|menubar)$/.test(el.getAttribute("role") || "") ||
    chrome(el);

  /** The text a reader would read in an element. */
  function readableText(el) {
    let t = "";
    const walkText = (n) => {
      for (const c of nodesOf(n)) {
        if (c.nodeType === 3) t += c.nodeValue;
        else if (c.nodeType === 1 && !SKIP.has(T(c)) && !excluded.has(c) && shown(c) && !widget(c) && !decoration(c)) walkText(c);
      }
    };
    walkText(el);
    return squash(t).trim();
  }

  const textIn = (el) => remember("text", el, textNow);
  function textNow(el) {
    let t = "";
    const walk = (n) => {
      for (const c of nodesOf(n)) {
        if (c.nodeType === 3) t += c.nodeValue;
        else if (c.nodeType === 1 && !SKIP.has(T(c)) && shown(c) && !widget(c)) walk(c);
      }
    };
    walk(el);
    return squash(t).trim();
  }

  const isImg = (el) => T(el) === "IMG" || T(el) === "PICTURE" || T(el) === "SVG" || el instanceof SVGElement;
  /** The picture's real address: lazy-loading pages keep it in srcset or data-* until it scrolls into view. */
  const PLACEHOLDER = /^data:|placeholder|blank\.|spacer|grey-|gray-|transparent\.|1x1|loading\./i;
  function imgSrc(el) {
    const img = T(el) === "IMG" ? el : el.querySelector?.("img");
    if (!img) return "";
    const abs = (u) => {
      try {
        return u ? new URL(u.trim(), document.baseURI).href : "";
      } catch {
        return "";
      }
    };
    const largest = (set) => {
      if (!set) return "";
      const best = set
        .split(/,\s+(?=\S)/)
        .map((c) => c.trim().split(/\s+/))
        .map(([u, d]) => ({ u, w: parseFloat(d) || 1 }))
        .sort((a, b) => b.w - a.w)
        .find((c) => c.u && !PLACEHOLDER.test(c.u));
      return best ? abs(best.u) : "";
    };
    const pic = img.closest("picture");
    const candidates = [
      img.currentSrc && !PLACEHOLDER.test(img.currentSrc) && img.naturalWidth > 2 ? img.currentSrc : "",
      largest(img.getAttribute("srcset")),
      largest(img.getAttribute("data-srcset")),
      ...["data-src", "data-lazy-src", "data-original", "data-lazy", "data-url"].map((a) => abs(img.getAttribute(a))),
      pic ? largest(pic.querySelector("source")?.getAttribute("srcset") || pic.querySelector("source")?.getAttribute("data-srcset")) : "",
      img.src && !PLACEHOLDER.test(img.src) ? img.src : "",
    ];
    // Only a placeholder: no picture.
    return candidates.find(Boolean) || "";
  }

  function blockish(el) {
    const d = css(el).display;
    return !d.startsWith("inline") && d !== "contents" && d !== "none";
  }
  /** Holds only text and inline elements: a paragraph. */
  const BLOCKS = "div, p, ul, ol, table, h1, h2, h3, h4, h5, h6, form, section, article, li, figure";
  function leaf(el) {
    for (const c of elsOf(el)) {
      if (SKIP.has(T(c)) || !shown(c)) continue;
      if (T(el) === "P" && !c.querySelector?.(CONTROL) && !(isImg(c) && rect(c).width >= 100)) continue;
      if (blockish(c) || HEADING.test(T(c)) || [...(c.querySelectorAll?.(BLOCKS) || [])].some((b) => shown(b) && blockish(b))) return false;
      if (c.matches?.(CONTROL) || (c.querySelector && has(c, CONTROL))) return false;
      if (isImg(c) && rect(c).width >= 100) return false;
    }
    return true;
  }

  function painted(el) {
    const cs = css(el);
    const bg = cs.backgroundColor;
    const filled = bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg) && !/^rgba?\(255,\s*255,\s*255/.test(bg);
    const border = ["Top", "Right", "Bottom", "Left"].every((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none");
    const shadow = cs.boxShadow && cs.boxShadow !== "none";
    return filled || border || shadow;
  }
  /** A drawn box: the page set this content apart (border, fill, shadow) at a meaningful size. */
  function box(el) {
    const r = rect(el);
    return r.width >= 160 && r.height >= 60 && painted(el);
  }

  /* --------------------------------------------------------------------------
   * Inline text: runs of text with links and emphasis, recased.
   * ------------------------------------------------------------------------ */

  let api = null;
  let lang = undefined;

  function linkOf(el) {
    const t = T(el);
    const href = t === "A" ? el.getAttribute("href") : null;
    let url = "";
    if (href && !/^\s*(#|javascript:)/i.test(href)) {
      try {
        const u = new URL(href, location.href);
        if (/^(https?|mailto|tel):$/.test(u.protocol)) url = u.href;
      } catch {}
    }
    return { href: url, node: el, external: !!url && !url.startsWith(location.origin) && /^https?:/.test(url), target: el.getAttribute?.("target") || "" };
  }

  const clickable = (el) =>
    T(el) === "A" || T(el) === "BUTTON" || el.getAttribute("role") === "button" || el.getAttribute("role") === "link" || el.hasAttribute("onclick") || (T(el) === "INPUT" && /^(button|submit|reset|image)$/i.test(el.type));

  function inlines(el, out = [], fmt = {}) {
    return inlineNodes(nodesOf(el), out, fmt);
  }
  function inlineNodes(nodes, out = [], fmt = {}) {
    for (const n of nodes) {
      if (n.nodeType === 3) {
        if (n.nodeValue) out.push({ t: n.nodeValue, ...fmt });
        continue;
      }
      if (n.nodeType !== 1) continue;
      const t = T(n);
      if (SKIP.has(t) || t === "SELECT" || t === "TEXTAREA" || (t === "INPUT" && !/^(button|submit)$/i.test(n.type))) continue;
      if (t === "BR") {
        out.push({ t: "\n" });
        continue;
      }
      if (!shown(n) || widget(n) || isImg(n)) continue;
      if (t === "INPUT") {
        out.push({ t: n.value, link: linkOf(n), btn: true });
        continue;
      }
      if (clickable(n) && !fmt.link) {
        inlines(n, out, { ...fmt, link: linkOf(n) });
        continue;
      }
      const cs = css(n);
      const f = { ...fmt };
      if (parseFloat(cs.fontWeight) >= 600 || t === "B" || t === "STRONG") f.b = true;
      if (cs.fontStyle === "italic" || t === "EM" || t === "I") f.i = true;
      if (t === "CODE" || t === "KBD" || t === "SAMP") f.code = true;
      if (t === "SUP") f.sup = true;
      inlines(n, out, f);
    }
    return out;
  }

  /** Merges runs, normalises spaces, trims, and sentence-cases shouted lines. */
  function tidy(segs) {
    const out = [];
    for (const s of segs) {
      const t = s.t === "\n" ? "\n" : squash(s.t);
      if (!t) continue;
      const prev = out.at(-1);
      if (prev && prev.t !== "\n" && t !== "\n" && prev.link?.node === s.link?.node && !!prev.b === !!s.b && !!prev.i === !!s.i && !!prev.code === !!s.code && !!prev.sup === !!s.sup) prev.t += t;
      else out.push({ ...s, t });
    }
    while (out.length && !out[0].t.trim()) out.shift();
    while (out.length && !out.at(-1).t.trim()) out.pop();
    if (out[0]) out[0].t = out[0].t.trimStart();
    if (out.at(-1)) out.at(-1).t = out.at(-1).t.trimEnd();
    for (let i = 1; i < out.length; i++) if (out[i - 1].t.endsWith(" ") && out[i].t.startsWith(" ")) out[i].t = out[i].t.slice(1);
    recase(out);
    return out.filter((s) => s.t);
  }

  function recase(segs) {
    if (!api) return;
    const whole = segs.map((s) => s.t).join("");
    if (!api.isShouting(whole)) {
      for (const s of segs) s.t = api.fixCase(s.t, { lang });
      return;
    }
    let before = "";
    for (const s of segs) {
      if (!s.code) s.t = api.fixCase(s.t, { lang, force: true, first: !/\p{L}/u.test(before) });
      before += s.t;
    }
  }
  const plain = (segs) => segs.map((s) => s.t).join("").replace(/\s*\n\s*/g, " ").trim();
  const fix = (s) => (api ? api.fixCase(squash(s).trim(), { lang }) : squash(s).trim());

  /* --------------------------------------------------------------------------
   * Shapes: what an element holds, for spotting repeated items.
   * ------------------------------------------------------------------------ */

  function media(el) {
    let big = null;
    let icon = null;
    let bigArea = 0;
    const candidates = isImg(el) ? [el] : [...el.querySelectorAll("img, svg, picture")];
    for (const m of candidates) {
      if (m.closest("svg") && m.closest("svg") !== m) continue;
      if (!shown(m)) continue;
      if (T(m) !== "SVG" && !(m instanceof SVGElement) && !imgSrc(m)) continue;
      const r = rect(m);
      if (r.width >= 110 && r.height >= 70) {
        if (r.width * r.height > bigArea && T(m) !== "SVG") {
          big = m;
          bigArea = r.width * r.height;
        }
      } else if (!icon && r.width >= 12 && r.width <= 96 && r.height >= 12) icon = m;
    }
    if (icon && (T(icon) === "SVG" || icon instanceof SVGElement) && !icon.__nisSvg) icon.__nisSvg = cloneSvg(icon);
    // Pictures set as backgrounds (heroes, card art).
    if (!big) {
      const bg = css(el).backgroundImage;
      const r = rect(el);
      const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m && r.width >= 110 && r.height >= 70 && !/gradient/.test(bg.split("url(")[0])) big = { bg: m[1] };
    }
    return { big, icon };
  }

  function shape(el) {
    const text = textIn(el);
    const m = media(el);
    const links = el.matches("a[href], button") ? 1 : el.querySelectorAll("a[href], button, [role=button]").length;
    const w = words(text);
    return {
      big: !!m.big,
      icon: !!m.icon,
      head: !!el.querySelector("h1, h2, h3, h4, h5, h6, strong, b, [class*=title], [class*=heading]"),
      links: Math.min(links, 3),
      w: w === 0 ? 0 : w < 7 ? 1 : w < 30 ? 2 : w < 90 ? 3 : 4,
      num: /^\s*(step\s*)?\d{1,2}\b/i.test(text),
      text: w,
    };
  }
  const alike = (a, b) => {
    let d = 0;
    if (a.big !== b.big) d++;
    if (a.icon !== b.icon && !a.big && !b.big) d++;
    if (a.head !== b.head) d++;
    if (Math.abs(a.links - b.links) > 1) d++;
    if (Math.abs(a.w - b.w) > 1) d++;
    return d <= 1;
  };

  /** Siblings that repeat one shape: a collection (cards, tiles, steps, links, logos). */
  function repeated(items) {
    if (items.length < 2) return false;
    // Paragraphs in a row are prose, however they're boxed.
    if (items.every((k) => leaf(k) && !k.matches("a[href], button") && !qsa(k, "a[href], button, img, svg").length && !HEADING.test(T(k)))) return false;
    const tags = new Map();
    for (const k of items) tags.set(T(k), (tags.get(T(k)) || 0) + 1);
    if (Math.max(...tags.values()) < items.length * 0.8) return false;
    // Items hold one thing: a part of the page with several headings, or taller than a
    // screenful, is a section of its own, however alike its neighbours look.
    // Carousel slides are items whatever they hold (a quote, a name and a place are three headings on some sites).
    const slides = items.every(inCarousel);
    if (items.some((k) => (!slides && qsa(k, "h1, h2, h3, h4, [role=heading]").filter(shown).length > 1) || rect(k).height > Math.max(window.innerHeight * 1.5, 1100))) return false;
    const shapes = items.map(shape);
    if (shapes.some((s) => s.text === 0 && !s.big && !s.icon)) return false;
    if (shapes.some((s) => s.text > 260)) return false;
    const fits = shapes.filter((s) => alike(s, shapes[0])).length;
    if (fits < items.length * 0.75) return false;
    // Laid out in a row, real collections share a width.
    const rs = items.map(rect);
    const row = rs.filter((r) => Math.abs(r.top - rs[0].top) < 4);
    // Bare links (chips, tags) size to their words; anything else in a row shares a width.
    if (row.length >= 2 && !items.every((k) => T(k) === "A")) {
      const ws = row.map((r) => r.width);
      if (Math.max(...ws) > Math.min(...ws) * 1.35 + 8) return false;
    }
    if (items.length === 2 && !items.every((k) => box(k) || T(k) === "LI" || shapes[0].big)) return false;
    return true;
  }

  /* --------------------------------------------------------------------------
   * The reader: element → stream of atoms.
   *   h       heading                    p     paragraph (inline runs)
   *   list    plain list                 img   content picture
   *   table   data table                 form  form (live controls)
   *   coll    collection of items        box   a drawn box (own stream)
   *   details disclosure                 cta   a lone button-like link
   * ------------------------------------------------------------------------ */

  let budget = 0;

  function headingLevel(el, cs) {
    const t = T(el);
    if (HEADING.test(t)) return Number(t[1]);
    const aria = Number(el.getAttribute("aria-level"));
    if (aria) return aria;
    const fs = parseFloat(cs.fontSize);
    return fs >= 30 ? 2 : 3;
  }

  function looksHeading(el, cs, text) {
    if (HEADING.test(T(el)) || el.getAttribute("role") === "heading") return text.length > 0 && text.length < 200;
    const fs = parseFloat(cs.fontSize);
    if (text.length < 2 || text.length > 140 || words(text) > 20) return false;
    // Display-size text is a headline, full stop or not; smaller bold text only without one.
    return fs >= 28 || ((fs >= 24 || (fs >= 18 && parseFloat(cs.fontWeight) >= 600)) && !/[.:]$/.test(text) && words(text) <= 16);
  }

  function walk(el, out) {
    if (--budget < 0) return;
    const t = T(el);
    if (SKIP.has(t) || el.id === "nis-root" || excluded.has(el)) return;
    if (!shown(el) || widget(el)) return;
    // Hidden from assistive tech by the page itself (product mock-ups, flourishes), and
    // navigation inside the content (tabs, page tools, language switchers): not content.
    if (decoration(el)) return;
    const cs = css(el);

    if (isImg(el)) {
      const r = rect(el);
      const src = imgSrc(el);
      if (src && r.width >= 140 && r.height >= 90 && !el.closest("a")) out.push({ k: "img", src, alt: el.getAttribute("alt") || "", w: r.width, h: r.height });
      return;
    }
    if (t === "FORM" || (has(el, CONTROL) && controlGroup(el))) {
      const f = readForm(el);
      if (f) {
        out.push(f);
        return;
      }
    }
    if (t === "TABLE") {
      const tbl = readTable(el);
      if (tbl) out.push(tbl);
      else for (const cell of el.querySelectorAll(":scope > * > tr > td, :scope > * > tr > th, :scope > tr > td")) walk(cell, out);
      return;
    }
    if (t === "DETAILS") {
      const summary = el.querySelector("summary");
      const inner = [];
      for (const c of elsOf(el)) if (c !== summary) walk(c, inner);
      if (!el.open) for (const c of elsOf(el)) if (c !== summary) readHidden(c, inner);
      out.push({ k: "details", summary: summary ? tidy(inlines(summary)) : [{ t: "Details" }], atoms: inner });
      return;
    }
    if (t === "HR") return;

    // Figures: one picture with its caption.
    if (t === "FIGURE" || (box(el) && rect(el).width < vw() * 0.6)) {
      const pics = qsa(el, "img").filter((i) => shown(i) && rect(i).width >= 100 && rect(i).height >= 60);
      const words_ = words(textIn(el));
      if (pics.length === 1 && words_ <= 60 && !has(el, CONTROL) && !qsa(el, "h1, h2, h3, h4, a[href] ~ a[href]").length) {
        const cap = el.querySelector("figcaption") || el;
        const r = rect(pics[0]);
        out.push({ k: "img", src: imgSrc(pics[0]), alt: fix(textIn(cap) || pics[0].getAttribute("alt") || ""), w: r.width, h: r.height, caption: true });
        return;
      }
    }

    const text = textIn(el);
    if (!text && !el.querySelector("img, svg, picture") && !media(el).big) return;

    // A clickable element's own text carries its link, and so does text inside a link that wraps it (a card's headline).
    // A wrapping link counts when it's card-sized (broken markup can leave a whole page inside one <a>).
    const outer = el.parentElement?.closest("a[href]");
    const cardSized = (a) => a && qsa(a, "h1, h2, h3, h4, h5, h6").length <= 1 && squash(a.textContent || "").length <= 400;
    const wrapping = clickable(el) ? el : cardSized(outer) ? outer : null;
    const self = wrapping && !(host && host.contains(wrapping)) ? { link: linkOf(wrapping) } : {};
    // Heading tags are headings whatever their inside looks like (lines set as blocks, animated words).
    if (looksHeading(el, cs, text) && (leaf(el) || ((HEADING.test(t) || el.getAttribute("role") === "heading") && !has(el, CONTROL) && !qsa(el, "img").some((i) => rect(i).width >= 100)))) {
      out.push({ k: "h", level: headingLevel(el, cs), c: tidy(inlines(el, [], self)), size: parseFloat(cs.fontSize), el });
      return;
    }

    const children = elsOf(el).filter((c) => !SKIP.has(T(c)) && shown(c) && !widget(c));

    // Lists: links-only lists are link lists; others are read as collections or plain lists.
    if ((t === "UL" || t === "OL" || t === "DL") && children.length) {
      const items = children.filter((c) => T(c) === "LI" || T(c) === "DT" || T(c) === "DD");
      if (items.length && items.every((li) => leaf(li)) && !items.some((li) => li.querySelector("img, svg, picture"))) {
        const runs = items.map((li) => tidy(inlines(li))).filter((c) => c.length);
        const linky = runs.filter((c) => c.some((s) => s.link) && plain(c.filter((s) => s.link)).length >= plain(c).length * 0.6).length;
        if (runs.length && runs.every((c) => PAGER.test(plain(c)))) return;
        if (linky >= runs.length * 0.7 && runs.length >= 2) out.push({ k: "coll", kind: "links", items: runs.map((c) => linkItem(c)) });
        else out.push({ k: "list", ordered: t === "OL", items: runs });
        return;
      }
    }

    // A heading or label over a run of like items (links under their title, "Trending: a b c"): it, then the items.
    const label = (c) => HEADING.test(T(c)) || c.getAttribute("role") === "heading" || (leaf(c) && !clickable(c) && !qsa(c, "a[href], button").length && words(textIn(c)) <= 8);
    if (children.length >= 4 && label(children[0]) && !HEADING.test(T(children[1])) && repeated(children.slice(1))) {
      walk(children[0], out);
      const coll = readCollection(children.slice(1));
      if (coll.k !== "none" && (!coll.items || coll.items.length)) out.push(coll);
      return;
    }
    if (children.length >= 2 && repeated(children)) {
      const coll = readCollection(children);
      if (coll.k !== "none" && (!coll.items || coll.items.length)) out.push(coll);
      return;
    }

    if (leaf(el)) {
      const c = tidy(inlines(el, [], self));
      if (c.length) {
        const lone = c.length === 1 && c[0].link;
        // A control drawn as a symbol (×, ☰, ‹) says nothing on its own.
        if (lone && !/[\p{L}\p{N}]/u.test(c[0].t)) return;
        if (lone && (T(el) === "A" || T(el) === "BUTTON" || painted(el)) && words(c[0].t) <= 8) out.push({ k: "cta", c, primary: buttonTone(el) });
        else out.push({ k: "p", c, size: parseFloat(cs.fontSize), el });
      }
      const m = media(el);
      if (m.big?.bg) out.push({ k: "img", src: m.big.bg, alt: "", w: rect(el).width, h: rect(el).height, art: true });
      return;
    }

    const inner = [];
    const m = !el.querySelector("img") ? media(el) : { big: null };
    if (m.big?.bg) inner.push({ k: "img", src: m.big.bg, alt: "", w: rect(el).width, h: rect(el).height, art: true });
    // Text and inline elements side by side (split by <br>, say) are one paragraph.
    const ownLink = clickable(el) ? { link: linkOf(el) } : {};
    let run = [];
    const flush = () => {
      if (run.length) {
        const c = tidy(inlineNodes(run, [], ownLink));
        if (c.length) inner.push({ k: "p", c });
      }
      run = [];
    };
    for (const n of nodesOf(el)) {
      if (n.nodeType === 3) run.push(n);
      else if (n.nodeType === 1) {
        const inlineEl =
          !SKIP.has(T(n)) && (T(n) === "BR" || (!blockish(n) && leaf(n) && !isImg(n) && !HEADING.test(T(n)) && n.getAttribute("role") !== "heading" && !(clickable(n) && painted(n))));
        if (inlineEl) run.push(n);
        else {
          flush();
          walk(n, inner);
        }
      }
    }
    flush();
    if (el.shadowRoot) for (const c of kids(el.shadowRoot)) walk(c, inner);
    if (box(el) && inner.length && rect(el).width < vw() - 24) out.push({ k: "box", atoms: inner });
    else out.push(...inner);
  }

  /** Content that's hidden until opened (accordions): read from the markup. */
  function readHidden(el, out) {
    const text = squash(el.textContent || "").trim();
    if (text) out.push({ k: "p", c: tidy([{ t: text }]) });
  }

  function buttonTone(el) {
    const bg = css(el).backgroundColor;
    const m = bg.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    const [r, g, b, a = 1] = m.map(Number);
    return a > 0.5 && 0.2126 * r + 0.7152 * g + 0.0722 * b < 200;
  }

  /* --------------------------------------------------------------------------
   * Collections
   * ------------------------------------------------------------------------ */

  function linkItem(c) {
    const link = c.find((s) => s.link)?.link;
    const main = c.filter((s) => (s.link && s.link === link) || s.t === "\n");
    const rest = c.filter((s) => !main.includes(s));
    return { title: plain(main) || plain(c), link, meta: plain(rest) };
  }

  function readItem(el) {
    const atoms = [];
    walk(el, atoms);
    const flat = flatten(atoms);
    const m = media(el);
    let n = null;
    let title = null;
    const body = [];
    const actions = [];
    const imgs = [];
    for (const a of flat) {
      if (a.k === "img") {
        imgs.push(a);
        continue;
      }
      if (a.k === "cta") {
        actions.push(a);
        continue;
      }
      if (a.k !== "h" && a.k !== "p") continue;
      const txt = plain(a.c);
      if (n === null && !title && /^(step\s*)?\d{1,2}[.)]?$/i.test(txt)) {
        n = txt.replace(/\D/g, "");
        continue;
      }
      if (!title && (a.k === "h" || a.c.every((s) => s.b) || (flat.length > 1 && words(txt) <= 10 && body.length === 0))) title = a.c;
      else body.push(a.c);
    }
    // No heading: the line the item links with is its title (dates and labels around it are details).
    const linkedAt = body.findIndex((c) => c.length && c.every((x) => x.link) && words(plain(c)) >= 2);
    if (title && !flat.some((a) => a.k === "h") && !title.some((x) => x.link) && linkedAt >= 0) {
      body.unshift(title);
      title = body.splice(linkedAt + 1, 1)[0];
    }
    // A figure with its label (13,553 / online services): the label is the title.
    if (title && /^[\d\s,.+%×x$€£₹¥kKmMbB-]+$/.test(plain(title)) && body.length) {
      const figure = title;
      title = body.shift();
      body.unshift(figure);
    }
    // A quote with who said it: the short line (a name) is the title, the quote its body.
    // A quote reads as sentences and links nowhere; a name is a few words, unlinked.
    const short = body.findIndex((c) => words(plain(c)) <= 5 && !c.some((x) => x.link));
    const quoted = title && !title.some((x) => x.link) && words(plain(title)) > 8 && /[.!?…"”]$/.test(plain(title));
    if (quoted && short >= 0) {
      const quote = title;
      title = body.splice(short, 1)[0];
      body.unshift(quote);
    }
    // "Know more" names no item: it's the item's action, and the next line is its title.
    if (title && MORE.test(plain(title)) && body.length) {
      actions.push({ k: "cta", c: title, primary: false });
      title = body.shift();
    }
    // An item that is just one link: the link is its title.
    if (!title && actions.length === 1 && !body.length) title = actions.splice(0, 1)[0].c;
    if (!title && body.length) title = body.shift();
    // The item goes where it links: the element itself, its only link, or its title's link.
    const anchors = clickable(el) ? [el] : qsa(el, "a, button, [role=button]").filter(shown);
    const link = anchors.length === 1 ? linkOf(anchors[0]) : title?.find((s) => s.link)?.link || null;
    return {
      n,
      title: title || [],
      body,
      actions,
      img: imgs[0] || (m.big ? (m.big.bg ? { src: m.big.bg, alt: "" } : { src: imgSrc(m.big), alt: m.big.getAttribute?.("alt") || "" }) : null),
      icon: m.icon && !m.big ? m.icon : null,
      // A task tile: the whole thing, icon and label, is one link.
      tile: !!(m.icon && link?.node && (link.node === el || link.node.contains(m.icon)) && plain(title || []).length >= textIn(el).length * 0.8),
      link,
      text: plain(title || []) + " " + body.map(plain).join(" "),
    };
  }

  function readCollection(children) {
    const seen = new Set();
    const items = [];
    for (const c of children) {
      if (/(^|\s)(cloned|swiper-slide-duplicate|slick-cloned)(\s|$)/.test(c.getAttribute("class") || "")) continue;
      const it = readItem(c);
      const key = it.text.trim() + (it.img?.src || "") + (it.icon ? imgSrc(it.icon) : "");
      if (!key.trim() || seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
    const all = (f) => items.length > 0 && items.filter(f).length >= items.length * 0.8;
    // Phone numbers and emails, each with who they belong to (a name or a logo).
    if (all((i) => (PHONE.test(i.text) || EMAIL.test(i.text)) && words(i.text) <= 16)) {
      const out = [];
      for (const i of items) {
        const who = i.icon?.getAttribute?.("alt") || i.img?.alt || "";
        const label = [who, ...[plain(i.title), ...i.body.map(plain)].filter((t) => !PHONE.test(t) && !EMAIL.test(t))].filter(Boolean).join(" · ");
        for (const m of i.text.match(new RegExp(EMAIL, "g")) || []) out.push({ kind: "email", value: m, note: fix(label) });
        for (const m of i.text.match(new RegExp(PHONE, "g")) || []) out.push({ kind: "phone", value: m.trim(), note: fix([label, i.text.replace(m, "").replace(EMAIL, "").trim()].filter(Boolean).join(" · ")) });
      }
      return { k: "contact", items: out };
    }
    let kind = "cards";
    // Numbered items that are only links (most read, top ten) are a ranked list; steps explain.
    const linkOnly = (i) => !i.body.length && i.title.length && i.title.every((s) => s.link);
    if (all((i) => i.n !== null) && all(linkOnly)) return { k: "coll", kind: "links", ranked: true, items: items.map((i) => ({ title: `${i.n}. ${plain(i.title)}`, link: i.link || i.title[0].link, meta: "" })) };
    if (all((i) => i.n !== null)) kind = "steps";
    else {
      // A small figure (71 client governments) read as a step number where the others are larger figures.
      for (const i of items) {
        if (i.n === null) continue;
        i.body.unshift([{ t: i.n }]);
        i.text = `${i.n} ${i.text}`;
        i.n = null;
      }
    }
    if (kind === "steps") {
      // Steps stay as read.
    } else if (all((i) => !i.title.length && !i.body.length && (i.img || i.icon))) {
      // A logo strip names its logos (alt text or a link); unnamed little pictures are decoration.
      const named = items.filter((i) => {
        const pic = i.img || i.icon;
        const alt = pic?.alt ?? pic?.getAttribute?.("alt") ?? "";
        const r = i.icon ? rect(i.icon) : { height: 40 };
        return (alt.trim() || i.link) && r.height >= 20;
      });
      // Pictures carry no text the layout can hold: linked ones are listed by their names.
      const linked = named.filter((i) => i.link?.href || i.link?.node);
      if (linked.length < 2) return { k: "none" };
      return { k: "coll", kind: "links", items: linked.map((i) => { const pic = i.img || i.icon; return { title: fix(pic?.alt ?? pic?.getAttribute?.("alt") ?? ""), link: i.link, meta: "" }; }) };
    }
    else if (all((i) => i.tile && !i.img && words(plain(i.title)) <= 10 && i.body.length === 0)) kind = "actions";
    else if (all((i) => !i.img && !i.icon && i.body.length === 0 && i.actions.length === 0 && (i.link || i.title.some((s) => s.link)) && words(plain(i.title)) <= 14)) kind = "links";
    if (kind === "links") {
      const rows = items.map((i) => ({ title: plain(i.title), link: i.link || i.title.find((s) => s.link)?.link, meta: "" }));
      // A pager (1 2 3 next) isn't content: the layout shows what's on this page.
      if (rows.every((r) => PAGER.test(r.title))) return { k: "none" };
      return { k: "coll", kind, items: rows };
    }
    return { k: "coll", kind, items };
  }

  /* --------------------------------------------------------------------------
   * Forms: fields with labels, help, captchas and actions, as live controls.
   * ------------------------------------------------------------------------ */

  /** A container that is mostly controls (search boxes, selectors without a <form>). */
  function controlGroup(el) {
    const controls = qsa(el, CONTROL).filter(shown);
    if (!controls.length) return false;
    if (el.querySelector("form")) return false;
    const r = rect(el);
    if (r.height > 700) return false;
    return words(textIn(el)) <= 40 + controls.length * 12;
  }

  function labelFor(control) {
    if (control.id) {
      const l = document.querySelector(`label[for="${CSS.escape(control.id)}"]`);
      if (l && textIn(l)) return textIn(l);
    }
    const wrap = control.closest("label");
    if (wrap && textIn(wrap)) return textIn(wrap);
    const aria = control.getAttribute("aria-label");
    if (aria) return aria;
    const by = control.getAttribute("aria-labelledby");
    if (by) {
      const t = by.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ").trim();
      if (t) return t;
    }
    // The text just before it in its row: a table cell, a sibling, or the row's first text.
    const row = control.closest("tr, li, .row, .form-group, .field, p") || control.parentElement;
    if (row) {
      const cell = control.closest("td, th");
      if (cell && cell.previousElementSibling && textIn(cell.previousElementSibling)) return textIn(cell.previousElementSibling);
      let prev = control.previousElementSibling;
      while (prev && !textIn(prev)) prev = prev.previousElementSibling;
      if (prev && words(textIn(prev)) <= 12) return textIn(prev);
      for (let p = control.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) {
        let s = p.previousElementSibling;
        while (s && !textIn(s) && !s.querySelector(CONTROL)) s = s.previousElementSibling;
        if (s && !s.querySelector(CONTROL) && words(textIn(s)) <= 12) return textIn(s);
        if (s) break;
      }
    }
    return control.getAttribute("placeholder") || control.getAttribute("title") || control.getAttribute("name") || "";
  }

  function helpFor(control, label) {
    const cell = control.closest("td");
    if (cell && cell.nextElementSibling) {
      const t = textIn(cell.nextElementSibling);
      if (t && t !== label && !cell.nextElementSibling.querySelector(CONTROL)) return t;
    }
    const d = control.getAttribute("aria-describedby");
    if (d)
      return d
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter((e) => e && shown(e) && !BOILERPLATE.test(ident(e)))
        .map((e) => textIn(e))
        .join(" ")
        .trim();
    return "";
  }

  function readForm(el) {
    const form = T(el) === "FORM" ? el : null;
    const controls = qsa(el, `${CONTROL}, button, [role=button]`).filter((c) => shown(c) && (c.__nisAdopted || !widget(c)));
    const fields = [];
    const actions = [];
    const groups = new Map();
    for (const c of controls) {
      const t = T(c);
      if (t === "BUTTON" || c.getAttribute("role") === "button" || (t === "INPUT" && /^(submit|button|reset|image)$/i.test(c.type))) {
        actions.push({ node: c, primary: c.type === "submit" || buttonTone(c) });
        continue;
      }
      if (t === "INPUT" && /^(checkbox|radio)$/i.test(c.type)) {
        const key = c.type === "radio" && c.name ? `r:${c.name}` : `c:${fields.length}`;
        let g = groups.get(key);
        if (!g) {
          g = { kind: "choice", label: c.type === "radio" ? groupLabel(c) : "", options: [] };
          groups.set(key, g);
          fields.push(g);
        }
        g.options.push({ node: c, label: (c.__nisLabel ??= fix(labelFor(c))) });
        continue;
      }
      // Read once, in the page's own layout; a moved control keeps what was read.
      const label = (c.__nisLabel ??= fix(labelFor(c)));
      const help = (c.__nisHelp ??= fix(helpFor(c, label)));
      fields.push({ kind: "field", node: c, label, help, required: c.required || /\*\s*$/.test(label) });
    }
    if (!fields.length && !actions.length) return null;
    // Captchas and other pictures between fields go with the field after them.
    const placed = fields.filter((f) => f.node).map((f) => rect(f.node));
    const span = placed.length ? { top: Math.min(...placed.map((r) => r.top)) - 120, bottom: Math.max(...placed.map((r) => r.bottom)) + 120 } : null;
    const pics = qsa(el, "img").filter((i) => shown(i) && rect(i).height >= 24 && rect(i).width >= 60 && !i.closest("a[href]") && (!span || (rect(i).top >= span.top && rect(i).bottom <= span.bottom)));
    for (const pic of pics) {
      if (pic.__nisMedia) {
        const owner = fields.find((f) => f.node === pic.__nisMedia.owner);
        if (owner) owner.media = pic.__nisMedia.nodes;
        continue;
      }
      const after = fields.find((f) => f.node && pic.compareDocumentPosition(f.node) & Node.DOCUMENT_POSITION_FOLLOWING);
      const target = after || fields.at(-1);
      if (target && !target.media) {
        target.media = [pic];
        // The small refresh control beside a captcha.
        const near = pic.parentElement?.closest("td, div, span")?.parentElement?.querySelector("a img, img[onclick], a[onclick], [class*=refresh], [id*=refresh]");
        if (near && near !== pic) target.media.push(near.closest("a") || near);
        pic.__nisMedia = { owner: target.node, nodes: target.media };
      }
    }
    const tabs = formTabs(el, fields);
    const heading = [...el.querySelectorAll("legend, h1, h2, h3, h4")].find(shown);
    const title = tabs.find((t) => t.active)?.label || heading?.textContent || "";
    const note = [];
    for (const p of el.querySelectorAll("p, small, .note, .help")) if (!p.querySelector(CONTROL) && shown(p) && textIn(p)) note.push(fix(textIn(p)));
    return { k: "form", form, el, fields, actions, tabs, title: fix(title), note: note.slice(0, 4) };
  }

  /**
   * Tabs that switch what a form is for (Visas / Passports / Attestation): a row of
   * short labels the pointer can click, above the first field. Clicking ours clicks theirs.
   */
  function formTabs(el, fields) {
    const first = fields.find((f) => f.node)?.node || fields[0]?.options?.[0]?.node;
    if (!first) return [];
    const top = rect(first).top;
    const candidates = qsa(el, '[role=tab], li, button, a, div, span').filter(
      (c) => shown(c) && !c.querySelector(CONTROL) && leaf(c) && rect(c).bottom <= top && css(c).cursor === "pointer" && words(textIn(c)) >= 1 && words(textIn(c)) <= 5,
    );
    // Only the outermost clickable label of each tab.
    const own = candidates.filter((c) => !candidates.some((o) => o !== c && o.contains(c) && css(o).cursor === "pointer"));
    const row = own.filter((c) => Math.abs(rect(c).top - rect(own[0]).top) < 8);
    if (row.length < 2 || row.length > 8) return [];
    return row.map((c) => ({
      node: c,
      label: fix(textIn(c)),
      active: c.getAttribute("aria-selected") === "true" || /(^|\s)(active|selected|current)(\s|$)/.test(c.getAttribute("class") || ""),
    }));
  }

  function groupLabel(radio) {
    const fs = radio.closest("fieldset");
    const lg = fs?.querySelector("legend");
    if (lg) return fix(lg.textContent);
    return "";
  }

  /* --------------------------------------------------------------------------
   * Tables: only data tables; layout tables are read through.
   * ------------------------------------------------------------------------ */

  function readTable(el) {
    const rows = [...el.rows].filter((r) => r.closest("table") === el && shown(r));
    if (rows.length < 2) return null;
    if (el.getAttribute("role") === "presentation") return null;
    // Header cells make it a data table, whatever its cells hold; without them, only plain grids are.
    const hasTh = rows.some((r) => [...r.cells].some((c) => T(c) === "TH"));
    const cols = Math.max(...rows.map((r) => r.cells.length));
    if (!hasTh && (cols < 2 || el.querySelector("table, form, div div, p + p, ul, h1, h2, h3, " + CONTROL))) return null;
    if (!hasTh) {
      // A grid of data: rows alike, cells mostly text rather than links.
      const same = rows.filter((r) => r.cells.length === cols && [...r.cells].every((c) => c.colSpan === 1)).length;
      const linkText = [...el.querySelectorAll("a")].reduce((n, a) => n + textIn(a).length, 0);
      if (same < rows.length * 0.8 || linkText > textIn(el).length * 0.5) return null;
    }
    const cells = rows.map((r) =>
      [...r.cells].filter(shown).map((c) => {
        const text = tidy(inlines(c));
        const pic = qsa(c, "img").find((i) => shown(i) && rect(i).width >= 100);
        return { c: text, th: T(c) === "TH", span: c.colSpan, img: pic && words(plain(text)) <= 30 ? { src: imgSrc(pic), alt: pic.getAttribute("alt") || "" } : null };
      }),
    );
    let head = [];
    if (cells[0].every((c) => c.th) && cells[0].length > 1) head = cells.shift().map((c) => plain(c.c));
    return { k: "table", head, rows: cells, caption: fix(el.caption?.textContent || "") };
  }

  /* --------------------------------------------------------------------------
   * Page regions: identity, navigation, notices, main, footer.
   * ------------------------------------------------------------------------ */

  function flatten(atoms) {
    const out = [];
    for (const a of atoms) {
      if (a.k === "box") out.push(...flatten(a.atoms));
      else out.push(a);
    }
    return out;
  }

  const topLevel = () => kids(document.body).filter((c) => !SKIP.has(T(c)) && c.id !== "nis-root" && !c.hasAttribute("data-nis-portal") && shown(c) && !widget(c));

  /** Descends single wrappers to the page's real top-level parts. */
  function parts() {
    let list = topLevel();
    for (let i = 0; i < 6 && list.length === 1; i++) {
      const next = kids(list[0]).filter((c) => !SKIP.has(T(c)) && shown(c) && !widget(c));
      if (!next.length) break;
      list = next;
    }
    // One more level for wrappers that hold the whole page with a sibling or two.
    if (list.length <= 3) {
      const big = list.find((c) => rect(c).height > window.innerHeight * 1.2 && !c.matches("header, footer, nav, main, [role=main]"));
      if (big && !big.querySelector(":scope > main")) {
        const i = list.indexOf(big);
        const inner = kids(big).filter((c) => !SKIP.has(T(c)) && shown(c) && !widget(c));
        if (inner.length > 1) list = [...list.slice(0, i), ...inner, ...list.slice(i + 1)];
      }
    }
    return list;
  }

  function findHeader(list) {
    // The site's header landmark: outside the content, before the main content.
    const mainEl = document.querySelector("main, [role=main]");
    const landmark = [...document.querySelectorAll("header, [role=banner]")].find(
      (h) => shown(h) && !widget(h) && !h.closest("main, article, [role=main], section, aside") && (!mainEl || h.compareDocumentPosition(mainEl) & Node.DOCUMENT_POSITION_FOLLOWING) && textIn(h),
    );
    if (landmark) return [landmark];
    // Otherwise the parts at the very top that are mostly links and logos.
    const out = [];
    const start = list.length ? rect(list[0]).top : 0;
    for (const p of list) {
      const r = rect(p);
      if (r.top - start > 320 || r.height > 320) break;
      if (p.matches("main, [role=main], form") || p.querySelector("h1")) break;
      const text = textIn(p);
      const linkText = [...p.querySelectorAll("a")].map((a) => textIn(a)).join(" ");
      if (p.matches("nav") || p.querySelector("nav, img, svg") || linkText.length >= text.length * 0.5 || words(text) < 12) out.push(p);
      else break;
    }
    return out;
  }

  function findFooter(list) {
    const landmark = [...document.querySelectorAll("footer, [role=contentinfo]")].filter((f) => shown(f) && !f.closest("article, main [role=article]")).at(-1);
    if (landmark && !landmark.closest("main") ) return [landmark.parentElement && list.includes(landmark.parentElement) ? landmark.parentElement : landmark];
    const out = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      const text = textIn(p);
      if (!text) continue;
      const small = parseFloat(css(p).fontSize) <= 14 || words(text) < 40;
      if (small && !p.querySelector("h1, h2, form") && rect(p).height < 400) out.unshift(p);
      else break;
      if (out.length >= 3) break;
    }
    return out;
  }

  function readIdentity(header) {
    const meta = (n) => document.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.content?.trim();
    let name = meta("og:site_name") || meta("application-name") || "";
    let named = !!name;
    let logo = null;
    const imgs = header
      .flatMap((h) => [...h.querySelectorAll("img, svg")])
      .filter((i) => shown(i) && !(i.parentElement?.closest("svg")) && !i.closest("button, [role=button], label") && !/menu|search|hamburger|close|burger/i.test(`${ident(i)} ${i.closest("a")?.getAttribute("aria-label") || ""}`));
    const home = (() => {
      try {
        return new URL(document.baseURI).origin;
      } catch {
        return location.origin;
      }
    })();
    const r = (el) => rect(el);
    const scored = imgs
      .map((i) => {
        const r = rect(i);
        const s = `${ident(i)} ${i.getAttribute("alt") || ""} ${i.getAttribute("src") || ""} ${ident(i.parentElement || i)}`;
        let score = /logo|brand/i.test(s) ? 3 : 0;
        const a = i.closest("a");
        if (a) {
          try {
            const u = new URL(a.href);
            if ((u.origin === home || u.origin === location.origin) && (u.pathname === "/" || u.pathname.split("/").length <= 2)) score += 2;
          } catch {}
        }
        if (r.height >= 18 && r.height <= 120 && r.width >= 24) score += 1;
        else score -= 3;
        score -= r.left / vw();
        return { i, score };
      })
      .sort((a, b) => b.score - a.score);
    if (scored[0] && scored[0].score > 0) {
      const i = scored[0].i;
      logo = T(i) === "SVG" || i instanceof SVGElement ? { svg: cloneSvg(i) } : { src: imgSrc(i), alt: i.getAttribute("alt") || "" };
      const a = i.closest("a");
      logo.link = a ? linkOf(a) : null;
      // The logo's own name: its alt text, its drawing's title, or its link's label.
      const spoken = [logo.alt, i.getAttribute?.("aria-label"), i.querySelector?.("title")?.textContent, a?.getAttribute("aria-label"), a?.getAttribute("title"), a && textIn(a)]
        .map((t) => squash(t || "").trim())
        .find((t) => t && words(t) <= 5 && !/^logo$|\blogo\b|homepage|home page|^home$/i.test(t));
      if (!name && spoken) {
        name = spoken;
        named = true;
      }
      // A wordmark already says the name; text beside it would repeat it.
      logo.wordmark = !!(T(i) === "SVG" || i instanceof SVGElement || (r(i).width > r(i).height * 2.2));
    }
    if (!name) {
      // "Name - tagline" or "Page | Name": the name is the shortest part.
      const parts = document.title.split(/\s[|–—·:-]\s/).map((p) => p.trim()).filter(Boolean);
      const named_ = parts.filter((p) => !GENERIC.test(p));
      const pool = named_.length ? named_ : parts;
      name = pool.length > 1 ? [...pool].sort((a, b) => words(a) - words(b) || a.length - b.length)[0] : pool[0];
    }
    return { name: fix(name || location.hostname.replace(/^www\./, "")), logo, showName: !logo || (named && !logo.wordmark) };
  }

  /** Navigation: top items, each with the links of its menu (read from the markup, even while closed). */
  function readNav(header) {
    const navs = header.flatMap((h) => (h.matches("nav, [role=navigation]") ? [h] : [...h.querySelectorAll("nav, [role=navigation], ul")]));
    const roots = navs.filter((n) => !navs.some((o) => o !== n && o.contains(n)));
    const items = [];
    const actions = [];
    const seen = new Set();
    const consider = (el) => {
      const lis = el.matches("ul, ol") ? kids(el).filter((c) => T(c) === "LI") : [...el.querySelectorAll(":scope > ul > li, :scope > div > ul > li, :scope > ol > li")];
      if (lis.length) {
        for (const li of lis) {
          if (!shown(li)) continue;
          const trigger = [...li.querySelectorAll("a, button, [role=button]")].find(shown);
          if (!trigger) continue;
          const label = fix(textIn(trigger));
          if (!label || label.length <= 2 || seen.has(label)) continue;
          seen.add(label);
          const sub = [...li.querySelectorAll("a[href]")].filter((a) => a !== trigger && squash(a.textContent).trim());
          const groups = sub.length ? readMenu(li, trigger, sub) : controlled(trigger);
          items.push({ label, link: linkOf(trigger), groups });
        }
      } else {
        for (const a of el.querySelectorAll("a, button")) addLink(a);
      }
    };
    const addLink = (a) => {
      if (!shown(a) || a.closest("ul li ul")) return;
      const label = fix(textIn(a));
      if (!label || label.length <= 2 || seen.has(label)) return;
      seen.add(label);
      const groups = controlled(a);
      (CTA.test(label) && words(label) <= 7 && !groups.length ? actions : items).push({ label, link: linkOf(a), groups });
    };
    for (const r of roots) consider(r);
    // Links in the header outside any menu (utility links, login, language).
    for (const h of header) for (const a of h.querySelectorAll("a, button")) if (!roots.some((r) => r.contains(a))) addLink(a);
    // A call to action in the nav belongs at the end, as the header's button.
    for (let i = items.length - 1; i >= 0; i--) if (CTA.test(items[i].label) && !items[i].groups.length && words(items[i].label) <= 7) actions.unshift(...items.splice(i, 1));
    const searches = header.flatMap((h) => [...h.querySelectorAll('input[type=search], input[name*=search i], input[placeholder*=search i], input[name=q]')]).filter(shown);
    // The site's own name and text-size switches aren't destinations.
    const name = readIdentity(header).name.toLowerCase();
    const keep = items.filter((i) => !/^(a\+|a-|a|aa|a−)$/i.test(i.label) && !/^skip (to|navigation)|^jump to/i.test(i.label) && i.label.toLowerCase() !== name);
    return { items: keep.slice(0, 9), actions: actions.slice(0, 2), search: searches[0] || null };
  }

  /** A button that opens a panel elsewhere (aria-controls, data-target): that panel's links are its menu. */
  function controlled(trigger) {
    const ref = trigger.getAttribute("aria-controls") || (trigger.getAttribute("data-target") || trigger.getAttribute("data-bs-target") || "").replace(/^#/, "");
    if (!ref) return [];
    let panel = null;
    try {
      panel = document.getElementById(ref);
    } catch {}
    if (!panel || panel.contains(trigger)) return [];
    const links = [...panel.querySelectorAll("a[href]")].filter((a) => squash(a.textContent).trim());
    return links.length ? readMenu(panel, trigger, links) : [];
  }

  function readMenu(li, trigger, links) {
    if (!links.length) return [];
    const groups = [];
    const headed = [...li.querySelectorAll("h2, h3, h4, h5, h6, strong, .title, [class*=heading]")].filter((h) => h !== trigger && !h.closest("a"));
    if (headed.length >= 2) {
      for (const h of headed) {
        const list = h.nextElementSibling?.matches("ul, ol, div") ? h.nextElementSibling : h.parentElement;
        const ls = [...list.querySelectorAll("a[href]")].filter((a) => links.includes(a));
        if (ls.length) groups.push({ title: fix(h.textContent), links: ls.map((a) => ({ label: fix(a.textContent), link: linkOf(a) })) });
      }
    }
    if (!groups.length) groups.push({ title: "", links: links.slice(0, 40).map((a) => ({ label: fix(a.textContent), link: linkOf(a) })) });
    return groups;
  }

  function readFooter(footer) {
    const atoms = [];
    for (const f of footer) {
      excluded.delete(f);
      walk(f, atoms);
      excluded.add(f);
    }
    const flat = flatten(atoms);
    const groups = [];
    const text = [];
    const logos = [];
    let current = null;
    for (const a of flat) {
      if (a.k === "h") {
        current = { title: plain(a.c), links: [] };
        groups.push(current);
      } else if (a.k === "coll" && (a.kind === "links" || a.kind === "logos")) {
        if (a.kind === "logos") logos.push(...a.items.map((i) => i.img || (i.icon ? { src: imgSrc(i.icon), alt: i.icon.getAttribute?.("alt") || "" } : null)).filter(Boolean));
        else {
          if (!current) groups.push((current = { title: "", links: [] }));
          current.links.push(...a.items.filter((i) => i.link));
        }
      } else if (a.k === "p" || a.k === "cta") {
        const links = a.c.filter((s) => s.link);
        if (links.length && plain(links).length >= plain(a.c).length * 0.6) {
          if (!current) groups.push((current = { title: "", links: [] }));
          for (const s of links) current.links.push({ title: s.t.trim(), link: s.link });
        } else text.push(a.c);
      } else if (a.k === "img") logos.push(a);
    }
    for (const f of footer)
      for (const i of f.querySelectorAll("img"))
        if (shown(i) && rect(i).height <= 120 && !logos.some((l) => l.src === imgSrc(i))) logos.push({ src: imgSrc(i), alt: i.getAttribute("alt") || "" });
    return { groups: groups.filter((g) => g.links.length), text, logos: logos.slice(0, 8) };
  }

  /* --------------------------------------------------------------------------
   * Sections: the stream grouped by headings and boxes, then ranked.
   * ------------------------------------------------------------------------ */

  function sectionsOf(atoms, level = 0) {
    const sections = [];
    let cur = null;
    const open = (title, lvl, size = 0) => {
      cur = { title, level: lvl, size, blocks: [] };
      sections.push(cur);
    };
    const add = (b) => {
      if (!cur) open(null, 9);
      const last = cur.blocks.at(-1);
      if ((b.k === "p" || b.k === "list" || b.k === "img" || b.k === "sub") && last?.k === "prose") last.atoms.push(b);
      else if (b.k === "p" || b.k === "list" || b.k === "img" || b.k === "sub") cur.blocks.push({ k: "prose", atoms: [b] });
      else cur.blocks.push(b);
    };
    for (const a of atoms) {
      if (a.k === "break") {
        // A heading standing alone in its part of the page titles the part after it.
        if (cur && cur.title?.length && !cur.blocks.length) continue;
        cur = null;
        continue;
      }
      if (a.k === "h") {
        // A heading straight under a higher one is its subtitle.
        if (cur && cur.title && !cur.blocks.length && a.level > cur.level) {
          add({ k: "p", c: a.c, lead: true });
          continue;
        }
        if (a.level <= 3 || !cur || cur.blocks.length) {
          if (a.level <= 3 || !cur) open(a.c, a.level, a.size);
          else add({ k: "sub", c: a.c });
        } else add({ k: "sub", c: a.c });
      } else if (a.k === "box") {
        const inner = sectionsOf(a.atoms, level + 1);
        // What a box holds before any heading of its own continues the section it sits in.
        let rest = inner;
        if (inner.length && !inner[0].title) {
          if (!cur) open(null, 9);
          for (const b of inner[0].blocks) {
            if (b.k === "prose") b.atoms.forEach((x) => add(x));
            else add(b);
          }
          rest = inner.slice(1);
        }
        // Sections the box opens stand on their own; what follows the box continues untitled.
        if (rest.length) {
          sections.push(...rest);
          cur = null;
        }
      } else add(a);
    }
    return sections.filter((s) => s.blocks.length || s.title);
  }

  /** Three or more links standing on their own lines, one after another, are a link list. */
  const lone = (a) => (a.k === "cta" || a.k === "p") && a.c.length && a.c.every((s) => s.link && s.link === a.c[0].link) && words(plain(a.c)) <= 16;
  function linkRuns(blocks) {
    const atoms = blocks.flatMap((b) => (b.k === "prose" ? b.atoms : [b]));
    const out = [];
    for (let i = 0; i < atoms.length; i++) {
      let j = i;
      while (j < atoms.length && lone(atoms[j])) j++;
      // Lines sharing one link are one item: its title, then its details.
      const items = [];
      for (const a of atoms.slice(i, j)) {
        const last = items.at(-1);
        if (last && last.link.node === a.c[0].link.node) last.meta = [last.meta, plain(a.c)].filter(Boolean).join(" · ");
        else items.push({ title: plain(a.c), link: a.c[0].link, meta: "" });
      }
      if (items.length >= 3) {
        out.push({ k: "coll", kind: "links", items });
        i = j - 1;
        continue;
      }
      const a = atoms[i];
      const chips = a.k === "p" ? linkLine(a.c) : null;
      if (chips) {
        if (chips.lead.length) pushProse(out, [{ k: "p", c: chips.lead }]);
        out.push({ k: "coll", kind: "links", items: chips.items });
        continue;
      }
      if (a.k === "p" || a.k === "list" || a.k === "img" || a.k === "sub") pushProse(out, [a]);
      else out.push(a);
    }
    return out;
  }
  /** A line that is mostly three or more separate links, with maybe a label before them. */
  function linkLine(c) {
    const links = [...new Set(c.filter((s) => s.link).map((s) => s.link.node))];
    if (links.length < 3) return null;
    const linked = plain(c.filter((s) => s.link));
    if (linked.length < plain(c).length * 0.6) return null;
    const first = c.findIndex((s) => s.link);
    const lead = c.slice(0, first);
    if (c.slice(first).some((s) => !s.link && words(s.t.replace(/[|·•,;:/–—-]/g, " ")) > 2)) return null;
    const items = links.map((node) => {
      const segs = c.filter((s) => s.link?.node === node);
      return { title: plain(segs), link: segs[0].link, meta: "" };
    }).filter((i) => i.title);
    return { lead: lead.length && plain(lead).replace(/[:\s]+$/, "") ? [{ t: plain(lead).replace(/\s*:\s*$/, "") }] : [], items };
  }

  /** Feeds and indexes: a run of short lines led by a link, with meta lines → a link list. */
  function feedify(block) {
    if (block.k !== "prose") return [block];
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length >= 5) out.push({ k: "coll", kind: "links", items: run, feed: true });
      else for (const r of run) pushProse(out, r.atoms);
      run = [];
    };
    for (let i = 0; i < block.atoms.length; i++) {
      const a = block.atoms[i];
      if (a.k === "p" && /^\d{1,4}[.)]?$/.test(plain(a.c))) continue;
      const led = a.k === "p" && a.c[0]?.link && words(plain(a.c)) <= 30;
      if (led) {
        const metaParts = [];
        let j = i + 1;
        while (j < block.atoms.length && block.atoms[j].k === "p" && !block.atoms[j].c[0]?.link && words(plain(block.atoms[j].c)) <= 24 && metaParts.length < 2) {
          metaParts.push(block.atoms[j].c);
          j++;
        }
        const main = a.c.filter((s) => s.link === a.c[0].link);
        const tail = a.c.filter((s) => !main.includes(s));
        // The meta line keeps its own links (comments, author, source).
        const metaC = [];
        for (const part of [tail, ...metaParts].filter((x) => x.length)) {
          if (metaC.length) metaC.push({ t: " · " });
          metaC.push(...part);
        }
        run.push({ title: plain(main), link: a.c[0].link, meta: plain(metaC), metaC, atoms: block.atoms.slice(i, j) });
        i = j - 1;
      } else {
        flush();
        pushProse(out, [a]);
      }
    }
    flush();
    return out;
  }
  function pushProse(out, atoms) {
    const last = out.at(-1);
    if (last?.k === "prose") last.atoms.push(...atoms);
    else out.push({ k: "prose", atoms: [...atoms] });
  }

  /** Contact details (phones, emails) written as text become a contact block. */
  function contactify(block) {
    if (block.k !== "prose") return [block];
    const lines = block.atoms.filter((a) => a.k === "p").map((a) => plain(a.c));
    const hits = lines.filter((l) => (PHONE.test(l) || EMAIL.test(l)) && words(l) <= 14);
    if (hits.length && hits.length >= lines.length * 0.6) {
      const items = [];
      for (const l of lines) {
        for (const m of l.match(new RegExp(EMAIL, "g")) || []) items.push({ kind: "email", value: m });
        for (const m of l.match(new RegExp(PHONE, "g")) || []) items.push({ kind: "phone", value: m.trim(), note: l.replace(m, "").replace(/[()]/g, "").trim() });
      }
      if (items.length) return [{ k: "contact", items }];
    }
    return [block];
  }

  /**
   * Teasers: a section that is only a linked headline with a line or two (and maybe a picture)
   * is a card pointing elsewhere. Runs of them become a card grid.
   */
  function teasers(sections) {
    const isTeaser = (s, i) => {
      if (i === 0 || !s.title?.length) return false;
      const linked = plain(s.title.filter((x) => x.link)).length >= plain(s.title).length * 0.8;
      if (!linked || s.blocks.length > 1) return false;
      const b = s.blocks[0];
      if (!b) return true;
      return b.k === "prose" && b.atoms.length <= 4 && b.atoms.every((a) => a.k === "p" || a.k === "img") && words(b.atoms.filter((a) => a.k === "p").map((a) => plain(a.c)).join(" ")) <= 70;
    };
    const out = [];
    sections.forEach((s, i) => {
      if (!isTeaser(s, i)) return out.push(s);
      const atoms = s.blocks[0]?.atoms || [];
      const item = {
        n: null,
        title: s.title,
        body: atoms.filter((a) => a.k === "p").map((a) => a.c),
        actions: [],
        img: atoms.find((a) => a.k === "img") || null,
        icon: null,
        link: s.title.find((x) => x.link)?.link,
        text: [plain(s.title), ...atoms.filter((a) => a.k === "p").map((a) => plain(a.c))].join(" "),
      };
      const prev = out.at(-1);
      const last = prev?.blocks.at(-1);
      if (last?.k === "coll" && last.kind === "cards" && last.teasers) last.items.push(item);
      else if (prev) prev.blocks.push({ k: "coll", kind: "cards", teasers: true, items: [item] });
      else out.push({ title: null, level: 9, blocks: [{ k: "coll", kind: "cards", teasers: true, items: [item] }] });
    });
    return out;
  }

  const UTILITY = new Set(["links", "contact", "logos"]);
  function role(section) {
    const kinds = section.blocks.map((b) => (b.k === "coll" ? b.kind : b.k));
    if (kinds[0] === "form" || kinds[0] === "actions") return "task";
    if (kinds.length && kinds.every((k) => UTILITY.has(k) || k === "contact")) return "utility";
    return "content";
  }

  /* --------------------------------------------------------------------------
   * The page model
   * ------------------------------------------------------------------------ */

  function readPage() {
    budget = 300000;
    lang = html.getAttribute("lang") || undefined;
    const list = parts();
    const header = findHeader(list);
    const footer = findFooter(list.filter((p) => !header.includes(p)));
    excluded = new Set([...header, ...footer]);
    const main = list.filter((p) => !header.some((h) => h === p || h.contains(p)) && !footer.some((f) => f === p || f.contains(p)));
    const identity = readIdentity(header.length ? header : list.slice(0, 1));
    const nav = header.length ? readNav(header) : { items: [], actions: [], search: null };

    // A <header> landmark that also holds the page's hero: its headings and paragraphs are content.
    const heroInHeader = header.filter((h) => h.querySelector("h1"));

    let atoms = [];
    for (const h of heroInHeader) for (const c of elsOf(h)) if (!c.matches("nav, [role=navigation]") && c.querySelector("h1")) walk(c, atoms);
    // Each top-level part of the page is a section boundary.
    for (const p of main) {
      walk(p, atoms);
      if (atoms.length && atoms.at(-1).k !== "break") atoms.push({ k: "break" });
    }

    // Notices: short paragraphs before any heading, box or collection, and alerts anywhere.
    // Notices: a short run (up to four) of short paragraphs before anything else; a longer run is content.
    const notices = [];
    let lead = 0;
    const leading = [];
    while (lead < atoms.length && (atoms[lead].k === "break" || (atoms[lead].k === "p" && words(plain(atoms[lead].c)) <= 70))) {
      if (atoms[lead].k === "p") leading.push(atoms[lead]);
      lead++;
    }
    if (leading.length > 0 && leading.length <= 4 && lead < atoms.length) {
      notices.push(...leading.map((a) => a.c));
      atoms.splice(0, lead);
    }
    for (const el of document.querySelectorAll("[role=alert], [role=status], marquee, [class*=announcement], [class*=notice-bar], [class*=alert-banner]")) {
      if (!shown(el) || header.some((h) => h.contains(el)) || widget(el) || chrome(el) || inCarousel(el)) continue;
      const c = tidy(inlines(el));
      if (c.length && words(plain(c)) <= 70 && !notices.some((n) => plain(n) === plain(c))) notices.push(c);
    }

    let sections = sectionsOf(atoms);
    for (const s of sections) s.blocks = linkRuns(s.blocks).flatMap(feedify).flatMap(contactify);
    sections = sections.filter((s) => s.blocks.length || s.title?.length);
    sections = teasers(sections).filter((s) => s.blocks.length);
    // Decorative pictures are left out now, so nothing is laid out around a gap.
    for (const s of sections) {
      for (const b of s.blocks) if (b.k === "prose") b.atoms = b.atoms.filter((a) => a.k !== "img" || keepPicture(a));
      s.blocks = s.blocks.filter((b) => b.k !== "prose" || b.atoms.length);
    }
    // Nothing is laid out empty: items without words, link lists without names, forms that are
    // only pager or arrow buttons.
    const named = (t) => /[\p{L}\p{N}]/u.test(t || "") && !PAGER.test((t || "").trim());
    for (const s of sections) {
      for (const b of s.blocks) {
        if (b.k === "coll" && b.items && b.kind === "links") b.items = b.items.filter((i) => named(i.title));
        else if (b.k === "coll" && b.items && b.kind !== "logos") b.items = b.items.filter((i) => named(plain(i.title || [])) || (i.body || []).some((c) => named(plain(c))));
        if (b.k === "form") b.actions = b.actions.filter((a) => named(a.node.value || textIn(a.node) || a.node.getAttribute("aria-label") || a.node.getAttribute("title") || "") || b.fields.length);
      }
      s.blocks = s.blocks.filter((b) => !(b.k === "coll" && b.items && !b.items.length) && !(b.k === "form" && !b.fields.length && !b.actions.length) && !(b.k === "contact" && !b.items.length));
    }
    sections = sections.filter((s) => s.blocks.length || s.title?.length);

    // The hero: the page's main heading with its lead, actions and picture.
    const hero = { title: null, lead: [], actions: [], img: null };
    // The headline opens the page: an <h1> further down is a section's title.
    let h1i = sections.findIndex((s) => s.level === 1);
    if (h1i < 0 || h1i > 1) {
      h1i = -1;
      let best = -1;
      // A display-size heading opening the page (not one further down).
      if (sections[0]?.title?.length && sections[0].size >= 28) best = 0;
      if (best >= 0) h1i = best;
    }
    if (h1i >= 0 && h1i <= 1) {
      const s = sections[h1i];
      hero.title = s.title;
      const prose = s.blocks[0]?.k === "prose" ? s.blocks[0] : null;
      if (prose) {
        while (prose.atoms.length && hero.lead.length < 2 && prose.atoms[0].k === "p" && words(plain(prose.atoms[0].c)) <= 80) hero.lead.push(prose.atoms.shift().c);
        if (!prose.atoms.length) s.blocks.shift();
      }
      while (s.blocks[0]?.k === "cta") hero.actions.push(s.blocks.shift());
      s.title = null;
      if (!s.blocks.length) sections.splice(h1i, 1);
    }
    // A page that opens with a picture alone (a banner): the hero's picture.
    const pictureOnly = (sec) => sec && !sec.title?.length && sec.blocks.length === 1 && sec.blocks[0].k === "prose" && sec.blocks[0].atoms.every((a) => a.k === "img");
    if (!hero.title && pictureOnly(sections[0])) {
      hero.img = sections[0].blocks[0].atoms[0];
      sections.shift();
    }
    // No <h1>: the first section's heading is the page's headline.
    if (!hero.title && sections[0]?.title?.length && sections[0].level <= 3) {
      hero.title = sections[0].title;
      hero.eyebrow = identity.name !== plain(sections[0].title) ? identity.name : "";
      sections[0].title = null;
    }
    // A headline kept for screen readers only still names the page.
    const quietH1 = !hero.title && [...document.querySelectorAll("h1")].find((e) => !header.some((h) => h.contains(e)) && !footer.some((f) => f.contains(e)) && words(e.textContent || "") >= 1 && words(e.textContent || "") <= 14);
    if (quietH1) hero.title = [{ t: fix(quietH1.textContent) }];
    if (!hero.title) {
      const parts = document.title.split(/\s[|–—·:-]\s/);
      hero.title = [{ t: fix(parts[0] || identity.name) }];
      hero.eyebrow = parts.length > 1 ? identity.name : "";
    }
    // Calls to action: the page's own, else its main task links.
    // Without its own, the hero offers the page's main tasks: action tiles in its first sections.
    if (!hero.actions.length) {
      const tiles = sections.filter((s) => role(s) === "task").flatMap((s) => s.blocks.slice(0, 1)).filter((b) => b.k === "coll" && b.kind === "actions").flatMap((b) => b.items);
      const ranked = tiles.filter((i) => CTA.test(plain(i.title))).concat(tiles).filter((v, i, a) => a.indexOf(v) === i);
      hero.actions = ranked.slice(0, 2).map((i, n) => ({ k: "cta", c: [{ t: plain(i.title), link: i.link || i.actions[0]?.c[0]?.link }], primary: n === 0 }));
    }

    // Order: the primary task first, then content as the page had it, then utilities.
    // A form page is one the form is for (sign in, apply); a portal with a search box is not.
    const formPage = sections.length <= 2 && sections.some((s) => s.blocks.some((b) => b.k === "form" && b.fields.length >= 3));
    const rank = (s) => (role(s) === "task" ? 0 : role(s) === "utility" ? 2 : 1);
    if (formPage) sections = sections.map((s, i) => ({ s, i })).sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i).map((x) => x.s);

    // A lone search (or subscribe) bar opening the page belongs in the hero.
    const firstBlock = sections[0]?.blocks[0];
    if (sections[0] && !sections[0].title?.length && firstBlock && inlineForm(firstBlock)) {
      hero.form = sections[0].blocks.shift();
      if (!sections[0].blocks.length) sections.shift();
    }

    const foot = readFooter(footer);
    // Partner logos anywhere in the page go to the footer.
    sections = sections.filter((s) => {
      if (s.blocks.every((b) => b.k === "coll" && b.kind === "logos")) {
        for (const b of s.blocks) foot.logos.push(...b.items.map((i) => i.img || (i.icon ? { src: imgSrc(i.icon), alt: "" } : null)).filter(Boolean));
        return false;
      }
      return true;
    });

    return { identity, nav, notices, hero, sections, footer: foot, header, mainParts: main, footerParts: footer };
  }

  /* --------------------------------------------------------------------------
   * Confidence: compose only when the model carries the page's content.
   * ------------------------------------------------------------------------ */

  function modelText(m) {
    let n = 0;
    const add = (s) => (n += (s || "").replace(/\s+/g, "").length);
    const atomText = (a) => {
      if (a.c) add(plain(a.c));
      if (a.k === "list") a.items.forEach((c) => add(plain(c)));
      if (a.k === "table") a.rows.forEach((r) => r.forEach((c) => add(plain(c.c))));
      if (a.k === "details") a.atoms.forEach(atomText);
    };
    const blockText = (b) => {
      if (b.k === "prose") b.atoms.forEach(atomText);
      else if (b.k === "coll") b.items.forEach((i) => add(i.text || i.title + " " + (i.meta || "")));
      else if (b.k === "form") b.fields.forEach((f) => add((f.label || "") + (f.help || "") + (f.options || []).map((o) => o.label).join("")));
      else if (b.k === "contact") b.items.forEach((i) => add(i.value + (i.note || "")));
      else atomText(b);
    };
    m.notices.forEach((c) => add(plain(c)));
    add(plain(m.hero.title || []));
    m.hero.lead.forEach((c) => add(plain(c)));
    m.sections.forEach((s) => {
      add(plain(s.title || []));
      s.blocks.forEach(blockText);
    });
    return n;
  }

  /** Web apps (editors, maps, canvases, dense control panels) are tools, not pages: restyled, not rebuilt. */
  function appLike() {
    // A tool is the page when it takes most of it, or when the page has little else to read.
    const screen = vw() * window.innerHeight;
    const pageArea = vw() * Math.max(html.scrollHeight, window.innerHeight);
    // Laying out the page's text to count it is slow: only done for a tool big enough to ask.
    let pageWords = null;
    const dominant = (el) => {
      if (!shown(el)) return false;
      const a = rect(el).width * rect(el).height;
      if (a > pageArea * 0.5) return true;
      if (a <= screen * 0.35) return false;
      pageWords ??= words(document.body.innerText || "");
      return pageWords < 250;
    };
    const tools = document.querySelectorAll('[role=application], [contenteditable=""]:not(body), [contenteditable=true]:not(body), .monaco-editor, .CodeMirror, .cm-editor, .leaflet-container, .mapboxgl-map, .gm-style, canvas');
    if ([...tools].some(dominant)) return true;
    if (document.body.isContentEditable) return true;
    return [...document.querySelectorAll(CONTROL)].filter(shown).length > 40;
  }

  /* --------------------------------------------------------------------------
   * Building blocks: rendering
   * ------------------------------------------------------------------------ */

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false || c === "") continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  const svg = (markup) => {
    const t = document.createElement("template");
    t.innerHTML = markup.trim();
    return t.content.firstChild;
  };
  const arrow = () => svg('<svg class="nis-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  const ext = () => svg('<svg class="nis-arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4h6v6M12 4l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  const slug = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 32) || "untitled";
  const pad = (i) => String(i + 1).padStart(2, "0");

  /** A link or button that acts through the page's own element. */
  function act(link, className, ...children) {
    const href = link?.href || "";
    const el = h(href ? "a" : "button", { class: className, href: href || null, type: href ? null : "button", target: link?.target === "_blank" ? "_blank" : null, rel: link?.target === "_blank" ? "noopener" : null }, ...children);
    el.addEventListener("click", (e) => {
      const node = link?.node;
      if (href && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
      if (node && node.isConnected) {
        e.preventDefault();
        node.click();
      }
    });
    return el;
  }

  function Inline(segs, { quiet = false } = {}) {
    const out = [];
    for (const s of segs) {
      if (s.t === "\n") {
        out.push(h("br"));
        continue;
      }
      let node = s.code ? h("code", { class: "nis-code" }, s.t) : document.createTextNode(s.t);
      if (s.b) node = h("strong", {}, node);
      if (s.i) node = h("em", {}, node);
      if (s.sup) node = h("sup", {}, node);
      if (s.link) node = act(s.link, quiet ? "nis-a nis-a-quiet" : "nis-a", node);
      out.push(node);
    }
    return out;
  }

  const Rail = (cls, ...children) => h("div", { class: "nis-row" }, h("div", { class: `nis-rail ${cls || ""}` }, ...children));
  const Gap = () => h("div", { class: "nis-gap" });
  const Frame = (cls, ...children) => h("div", { class: `nis-frame ${cls || ""}` }, ...children);
  const Panel = (cls, ...children) => h("div", { class: `nis-panel ${cls || ""}` }, ...children);
  const FileBar = (file, note) =>
    h("div", { class: "nis-filebar" }, h("p", {}, h("span", { class: "nis-file" }, file), note ? h("span", { class: "nis-note" }, ` · ${note}`) : null), h("div", { class: "nis-dots" }, h("span"), h("span"), h("span")));
  const Button = (link, label, primary) => act(link, primary ? "nis-btn" : "nis-btn nis-btn-2", label);

  /**
   * Pictures are kept only where they are content the reader needs (a captioned figure, a
   * described photo at reading size), never as decoration: no hero art, card art, backdrops,
   * banners or promo slides. Every page then has the same calm, text-first rhythm.
   */
  const keepPicture = (a) => !!a?.src && !a.art && (a.caption ? a.w >= 200 && a.h >= 120 : !!(a.alt || "").trim() && words(a.alt) >= 2 && a.w >= 320 && a.h >= 180);

  function Picture(img, cls = "") {
    if (!img?.src) return null;
    return h("img", { class: `nis-img ${cls}`, src: img.src, alt: img.alt || "", loading: "lazy", referrerpolicy: "no-referrer-when-downgrade" });
  }
  /** A copy of a drawing that keeps the colours the page's styles gave it. */
  function cloneSvg(svgEl) {
    const copy = svgEl.cloneNode(true);
    const from = [svgEl, ...svgEl.querySelectorAll("*")];
    const to = [copy, ...copy.querySelectorAll("*")];
    from.forEach((el, i) => {
      const cs = css(el);
      const t = to[i];
      if (!t) return;
      t.removeAttribute("class");
      t.style.cssText = `fill:${cs.fill};stroke:${cs.stroke};stroke-width:${cs.strokeWidth};opacity:${cs.opacity};color:${cs.color}`;
    });
    if (!copy.getAttribute("viewBox")) {
      const r = svgEl.getBoundingClientRect();
      if (r.width && r.height) copy.setAttribute("viewBox", `0 0 ${Math.round(r.width)} ${Math.round(r.height)}`);
    }
    return copy;
  }

  function Icon(node) {
    if (!node) return null;
    if (T(node) === "SVG" || node instanceof SVGElement) {
      const c = node.__nisSvg ? node.__nisSvg.cloneNode(true) : cloneSvg(node);
      c.setAttribute("class", "nis-icon");
      return c;
    }
    const src = imgSrc(node);
    return src ? h("img", { class: "nis-icon", src, alt: "" }) : null;
  }

  /* Header: identity, navigation with menus, search, the header's call to action. */
  function Header(m) {
    const { identity: id, nav } = m;
    const brand = act(id.logo?.link || { href: location.origin + "/" }, "nis-brand", id.logo?.svg ? Icon(id.logo.svg) : id.logo?.src ? h("img", { class: "nis-logo", src: id.logo.src, alt: id.showName ? "" : id.name }) : null, id.showName ? h("span", { class: "nis-name" }, id.name) : null);
    const navEl = h("nav", { class: "nis-nav", "aria-label": "Main" });
    let openMenu = null;
    const close = () => {
      if (openMenu) openMenu.removeAttribute("data-open");
      openMenu = null;
    };
    for (const item of nav.items) {
      if (!item.groups.length) {
        navEl.append(act(item.link, "nis-navlink", item.label));
        continue;
      }
      const wrap = h("div", { class: "nis-menu" });
      const trigger = h("button", { class: "nis-navlink", type: "button", "aria-expanded": "false" }, item.label, svg('<svg class="nis-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.5 6.5l3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'));
      const panel = h(
        "div",
        { class: "nis-menupanel" },
        h("div", { class: "nis-menugrid" }, item.groups.map((g) => h("div", { class: "nis-menugroup" }, g.title ? h("p", { class: "nis-menutitle" }, g.title) : null, g.links.map((l) => act(l.link, "nis-menulink", l.label))))),
        item.link?.href ? h("div", { class: "nis-menufoot" }, act(item.link, "nis-a", `All of ${item.label}`, arrow())) : null,
      );
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const was = openMenu === wrap;
        close();
        if (!was) {
          wrap.setAttribute("data-open", "");
          openMenu = wrap;
        }
        trigger.setAttribute("aria-expanded", String(!was));
      });
      wrap.append(trigger, panel);
      navEl.append(wrap);
    }
    document.addEventListener("click", (e) => {
      if (openMenu && !e.composedPath().includes(openMenu)) close();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());

    const tools = h("div", { class: "nis-tools" });
    if (nav.search) tools.append(Field({ node: nav.search, label: "" }, "nis-search", "nis-control-search"));
    nav.actions.forEach((a, i) => tools.append(Button(a.link, a.label, i === nav.actions.length - 1)));
    const burger = h("button", { class: "nis-burger", type: "button", "aria-label": "Menu", onclick: () => root.classList.toggle("nis-navopen") }, svg('<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 5h11M2.5 11h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'));
    return h("header", { class: "nis-header" }, h("div", { class: "nis-headin" }, brand, navEl, tools, nav.items.length ? burger : null));
  }

  /* Notices: what the page wants you to know now. */
  function Notices(list) {
    if (!list.length) return null;
    return Rail(
      "nis-pad",
      Frame(
        "",
        Panel(
          "nis-notices",
          list.map((c) => h("div", { class: "nis-notice" }, h("span", { class: "nis-chip" }, "Notice"), h("p", {}, Inline(c)))),
        ),
      ),
    );
  }

  /* Hero: the page's headline, lead, calls to action and picture. */
  function Hero(m) {
    const { hero } = m;
    const out = [h("div", { class: "nis-top" })];
    if (hero.eyebrow) out.push(Rail("nis-pad nis-annot", h("p", {}, hero.eyebrow)));
    out.push(Rail("nis-pad nis-hero-h", h("h1", { class: "nis-h1" }, Inline(hero.title, { quiet: true }))));
    if (hero.lead.length) out.push(Rail("nis-pad", hero.lead.map((c) => h("p", { class: "nis-lead" }, Inline(c)))));
    if (hero.actions.length) out.push(Rail("nis-pad nis-actions-row", hero.actions.map((a, i) => Button(a.c.find((s) => s.link)?.link, plain(a.c), i === 0 || a.primary))));
    if (hero.form) out.push(Rail("nis-pad nis-actions-row", InlineForm(hero.form)));
    return out;
  }

  function SectionHead(s, eyebrow) {
    const out = [Gap()];
    if (eyebrow) out.push(Rail("nis-pad nis-eyebrow-row", h("p", { class: "nis-eyebrow" }, eyebrow)));
    if (s.title?.length) out.push(Rail("nis-pad", h("h2", { class: "nis-h2" }, Inline(s.title, { quiet: true }))));
    return out;
  }

  const KIND_LABEL = { actions: "Start here", steps: "How it works", cards: "", links: "Links", contact: "Contact", form: "Form", table: "", details: "Questions" };

  /* Prose: paragraphs, sub-headings, lists, pictures, in a reading column. */
  function Prose(block) {
    const body = h("div", { class: "nis-prose" });
    for (const a of block.atoms) {
      if (a.k === "p") body.append(h("p", {}, Inline(a.c)));
      else if (a.k === "sub") body.append(h("h3", { class: "nis-h3" }, Inline(a.c, { quiet: true })));
      else if (a.k === "list") body.append(h(a.ordered ? "ol" : "ul", {}, a.items.map((c) => h("li", {}, Inline(c)))));
      else if (a.k === "img" && keepPicture(a)) body.append(h("figure", { class: `nis-figure ${a.w < 360 && a.caption ? "nis-figure-sm" : ""}` }, Picture(a), a.caption && a.alt ? h("figcaption", {}, a.alt) : null));
    }
    return body;
  }

  /* Cards: titled items with a picture and actions. */
  /** Text-only cards (topics, categories): a dense grid of linked panels. */
  function Topics(block) {
    return Frame(
      "",
      h(
        "div",
        { class: "nis-topics" },
        block.items.map((it) =>
          act(
            it.link || it.title.find((s) => s.link)?.link,
            "nis-panel nis-topic",
            h("span", { class: "nis-topictitle" }, plain(it.title), arrow()),
            it.body.length ? h("span", { class: "nis-small" }, it.body.map(plain).join(" ")) : null,
          ),
        ),
      ),
    );
  }

  function Cards(block) {
    if (block.items.every((i) => !i.actions.length && words(i.body.map(plain).join(" ")) <= 40) && block.items.length >= 2) return Topics(block);
    const grid = h("div", { class: `nis-cards ${block.items.length === 1 ? "nis-one" : ""}` });
    block.items.forEach((it, i) => {
      const title = plain(it.title);
      const go = it.link || it.actions[0]?.c[0]?.link;
      grid.append(
        Frame(
          "nis-card",
          Panel(
            "nis-clip",
            FileBar(`${slug(title)}.txt`, it.actions.length ? `${it.actions.length} action${it.actions.length > 1 ? "s" : ""}` : null),
            h("div", { class: "nis-cardbody" }, title ? h("h3", { class: "nis-h3" }, Inline(it.title, { quiet: true })) : null, it.body.map((c) => h("p", { class: "nis-small" }, Inline(c)))),
          ),
          go || it.actions.length
            ? Panel(
                "nis-cardfoot",
                h("p", { class: "nis-cmd" }, h("span", { class: "nis-faint" }, "$ "), "open ", h("span", { class: "nis-kbd" }, slug(title))),
                h("div", { class: "nis-cardacts" }, it.actions.length ? it.actions.map((a, n) => Button(a.c[0].link, plain(a.c), n === 0)) : act(go, "nis-more", "Open", arrow())),
              )
            : null,
        ),
      );
    });
    return grid;
  }

  /* Action tiles: the things you came to do. */
  function Actions(block) {
    return Frame(
      "",
      h(
        "div",
        { class: "nis-tiles" },
        block.items.map((it) => act(it.link || it.actions[0]?.c[0]?.link, "nis-panel nis-tile", h("span", { class: "nis-tileicon" }, Icon(it.icon)), h("span", { class: "nis-tiletext" }, plain(it.title)), arrow())),
      ),
    );
  }

  /* Steps: a numbered sequence. */
  const placements = ["nis-p1", "nis-p2", "nis-p3", "nis-p4", "nis-p5", "nis-p6"];
  function Steps(block) {
    return h(
      "div",
      { class: "nis-steps" },
      block.items.map((it, i) =>
        h(
          "div",
          { class: "nis-step" },
          h("div", { class: `nis-hatch nis-stepbox ${placements[i % placements.length]}` }, h("div", { class: "nis-num" }, pad(Number(it.n || i + 1) - 1))),
          h("h3", { class: "nis-h3" }, Inline(it.title, { quiet: true })),
          it.body.map((c) => h("p", { class: "nis-small" }, Inline(c))),
        ),
      ),
    );
  }

  /* Link lists: rows of links (feeds, indexes, resources). */
  function Links(block, title) {
    const rows = block.items.filter((i) => i.title);
    return Frame(
      "",
      Panel(
        "nis-clip",
        FileBar(`${slug(title || "links")}.${block.feed ? "feed" : "txt"}`, `${rows.length} link${rows.length === 1 ? "" : "s"}`),
        h(
          "div",
          { class: `nis-rows ${rows.length > 10 && !block.feed ? "nis-cols" : ""}` },
          rows.map((it) =>
            block.feed
              ? h("div", { class: "nis-feedrow" }, act(it.link, "nis-feedtitle", it.title, it.link?.external ? ext() : null), it.metaC?.length ? h("p", { class: "nis-feedmeta" }, Inline(it.metaC, { quiet: true })) : null)
              : act(it.link, "nis-linkrow", h("span", { class: "nis-linktitle" }, it.title), it.meta ? h("span", { class: "nis-meta" }, it.meta) : null, it.link?.external ? ext() : arrow()),
          ),
        ),
      ),
    );
  }

  /* Contact: phones and emails, ready to use. */
  function Contact(block) {
    return Frame(
      "",
      Panel(
        "nis-clip",
        FileBar("contact.vcf", `${block.items.length} way${block.items.length === 1 ? "" : "s"} to reach`),
        h(
          "div",
          { class: "nis-rows" },
          block.items.map((it) =>
            h(
              "a",
              { class: "nis-linkrow", href: it.kind === "email" ? `mailto:${it.value}` : `tel:${it.value.replace(/[^\d+]/g, "")}` },
              h("span", { class: "nis-chip" }, it.kind === "email" ? "email" : "phone"),
              h("span", { class: "nis-linktitle" }, it.value),
              it.note ? h("span", { class: "nis-meta" }, it.note) : null,
            ),
          ),
        ),
      ),
    );
  }

  /* Tables: data in a panel. */
  function Table(block) {
    return Frame(
      "",
      Panel(
        "nis-clip",
        block.caption ? FileBar(`${slug(block.caption)}.csv`, `${block.rows.length} rows`) : null,
        h(
          "div",
          { class: "nis-tablewrap" },
          h(
            "table",
            { class: "nis-table" },
            block.head.length ? h("thead", {}, h("tr", {}, block.head.map((c) => h("th", {}, c)))) : null,
            h("tbody", {}, block.rows.map((r) => h("tr", {}, r.map((c) => h(c.th ? "th" : "td", { colspan: c.span > 1 ? c.span : null }, Inline(c.c)))))),
          ),
        ),
      ),
    );
  }

  /* Disclosures: questions and other content that opens. */
  function Details(blocks) {
    return h(
      "div",
      { class: "nis-faq" },
      blocks.map((b) =>
        h(
          "details",
          { class: "nis-q" },
          h("summary", {}, h("span", {}, Inline(b.summary, { quiet: true })), h("span", { class: "nis-plus" })),
          h("div", { class: "nis-answer" }, Prose({ atoms: b.atoms.filter((a) => a.k === "p" || a.k === "list" || a.k === "img" || a.k === "sub") })),
        ),
      ),
    );
  }

  /* Forms: the page's own controls, laid out as labelled rows. */
  function adopt(node) {
    if (!node || node.__nisAdopted) return node;
    const slot = document.createComment("nis-slot");
    node.parentNode?.insertBefore(slot, node);
    slots.set(slot, node);
    node.__nisSlot = slot;
    node.__nisAdopted = true;
    return node;
  }
  /**
   * A live element of the page shown in our layout: it stays in the document (a child of
   * our host, so its form, labels and scripts still find it) and is drawn at a <slot>.
   */
  let slotCount = 0;
  let lightNodes = [];
  function place(node, ...classes) {
    adopt(node);
    node.__nisSlotName ??= `nis-s${++slotCount}`;
    node.setAttribute("slot", node.__nisSlotName);
    node.classList.add(...classes);
    lightNodes.push(node);
    return h("slot", { name: node.__nisSlotName });
  }
  function own(node, form) {
    // Keep a moved control owned by its form, so it submits and validates as before.
    if (form && node.form === form && !node.hasAttribute("form")) {
      if (!form.id) form.id = `nis-form-${Math.random().toString(36).slice(2, 8)}`;
      node.setAttribute("form", form.id);
      node.__nisFormAttr = true;
    }
    return node;
  }

  function Field(f, cls = "", ...extra) {
    return h("span", { class: `nis-fieldwrap ${cls}` }, place(f.node, "nis-control", ...extra));
  }

  /** One text field and its button (search, subscribe, track): a single bar. */
  // One text field (and maybe a scope selector beside it) with its button: a single bar.
  const inlineForm = (b) =>
    b.k === "form" &&
    b.actions.length <= 2 &&
    b.fields[0]?.kind === "field" &&
    T(b.fields[0].node) === "INPUT" &&
    !/^(file|date|checkbox|radio)$/i.test(b.fields[0].node.type) &&
    (b.fields.length === 1 || (b.fields.length === 2 && b.fields[1].kind === "field" && T(b.fields[1].node) === "SELECT"));
  function InlineForm(block) {
    const f = block.fields[0];
    own(f.node, block.form);
    const scope = block.fields[1] ? Field(own(block.fields[1].node, block.form) && block.fields[1], "nis-scope") : null;
    const actions = block.actions.map((a) => {
      own(a.node, block.form);
      return place(a.node, "nis-control-btn");
    });
    if (!f.node.getAttribute("placeholder") && f.label) f.node.setAttribute("placeholder", f.label);
    return h("div", { class: "nis-inlineform", role: "group", "aria-label": f.label || null }, Field(f), scope, actions);
  }

  function Form(block) {
    if (inlineForm(block)) return InlineForm(block);
    const rows = [];
    for (const f of block.fields) {
      if (f.kind === "choice") {
        rows.push(
          h(
            "div",
            { class: "nis-formrow" },
            h("p", { class: "nis-label" }, f.label),
            h(
              "div",
              { class: "nis-choices" },
              f.options.map((o) => {
                own(o.node, block.form);
                // A label in our layout can't reach the page's control: its clicks are passed on.
                return h("label", { class: "nis-choice", onclick: (e) => e.composedPath()[0] !== o.node && (e.preventDefault(), o.node.click()) }, place(o.node, "nis-control-choice"), h("span", {}, o.label));
              }),
            ),
          ),
        );
        continue;
      }
      own(f.node, block.form);
      const label = f.label.replace(/\s*\*\s*$/, "");
      rows.push(
        h(
          "div",
          { class: "nis-formrow" },
          h("label", { class: "nis-label", onclick: () => f.node.focus() }, label, f.required ? h("span", { class: "nis-req" }, " *") : null),
          h("div", { class: "nis-fieldcol" }, f.media ? h("div", { class: "nis-formmedia" }, f.media.map((n) => place(n, "nis-media"))) : null, Field(f), f.help ? h("p", { class: "nis-help" }, f.help) : null),
        ),
      );
    }
    const actions = block.actions.map((a) => {
      own(a.node, block.form);
      return place(a.node, a.primary || block.actions.length === 1 ? "nis-control-btn" : "nis-control-btn2");
    });
    return Frame(
      "nis-formframe",
      Panel(
        "nis-clip",
        FileBar(`${slug(block.title || "form")}.form`, `${block.fields.length} field${block.fields.length === 1 ? "" : "s"}`),
        block.tabs?.length
          ? h(
              "div",
              { class: "nis-formtabs", role: "tablist" },
              block.tabs.map((t) => h("button", { class: "nis-formtab", type: "button", role: "tab", "aria-selected": t.active ? "true" : "false", onclick: () => t.node.isConnected && t.node.click() }, t.label)),
            )
          : null,
        h("div", { class: "nis-form" }, rows, actions.length ? h("div", { class: "nis-formacts" }, actions) : null),
        block.note.length ? h("div", { class: "nis-formnote" }, block.note.map((n) => h("p", {}, n))) : null,
      ),
    );
  }

  function Block(b, s) {
    if (b.k === "prose") return Rail("nis-pad", Prose(b));
    if (b.k === "coll" && b.kind === "cards") return Rail("nis-pad2", Cards(b));
    if (b.k === "coll" && b.kind === "actions") return Rail("nis-pad2", Actions(b));
    if (b.k === "coll" && b.kind === "steps") return Rail("nis-flush", Steps(b));
    if (b.k === "coll" && b.kind === "links") return Rail("nis-pad2", Links(b, plain(s.title || [])));
    if (b.k === "contact") return Rail("nis-pad2", Contact(b));
    if (b.k === "table") return Rail("nis-pad2", Table(b));
    // A full form leaves the rail beside it empty: hatch it, like the design's stages.
    if (b.k === "form") return Rail(inlineForm(b) ? "nis-pad2" : "nis-pad2 nis-hatch", Form(b));
    if (b.k === "cta") return Rail("nis-pad nis-actions-row", Button(b.c.find((x) => x.link)?.link, plain(b.c), b.primary));
    if (b.k === "details") return Rail("nis-pad", Details([b]));
    return null;
  }

  /** Small utility sections (link lists, contacts) sit side by side as panels. */
  function UtilityGrid(list) {
    return [
      Gap(),
      Rail(
        "nis-pad2",
        h(
          "div",
          { class: "nis-utilgrid" },
          list.map((s) =>
            h(
              "div",
              { class: "nis-util" },
              s.title?.length ? h("h3", { class: "nis-h3 nis-utiltitle" }, Inline(s.title, { quiet: true })) : null,
              s.blocks.map((b) => (b.k === "contact" ? Contact(b) : b.k === "coll" && b.kind === "links" ? Links(b, plain(s.title || [])) : Prose(b))),
            ),
          ),
        ),
      ),
    ];
  }

  function Sections(m) {
    const out = [];
    let utils = [];
    const flushUtils = () => {
      if (utils.length) out.push(...UtilityGrid(utils));
      utils = [];
    };
    for (const s of m.sections) {
      if (role(s) === "utility" && s.blocks.every((b) => b.k === "contact" || (b.k === "coll" && b.kind === "links" && b.items.length <= 14))) {
        utils.push(s);
        continue;
      }
      flushUtils();
      const first = s.blocks[0];
      const kind = first?.k === "coll" ? first.kind : first?.k;
      out.push(...SectionHead(s, s.title?.length ? null : KIND_LABEL[kind] || null));
      // Consecutive disclosures read as one list.
      for (let i = 0; i < s.blocks.length; i++) {
        const b = s.blocks[i];
        if (b.k === "details") {
          const run = [];
          while (s.blocks[i]?.k === "details") run.push(s.blocks[i++]);
          i--;
          out.push(Rail("nis-pad", Details(run)));
        } else {
          const el = Block(b, s);
          if (el) out.push(el);
        }
      }
    }
    flushUtils();
    return out;
  }

  /** The footer's small print: short lines (labels, dates, links) run together as one line each. */
  function smallPrint(text) {
    const lines = text.filter((c) => /[\p{L}\p{N}]{2}/u.test(plain(c)));
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length) out.push(run.flatMap((c, i) => (i ? [{ t: " · " }, ...c] : c)));
      run = [];
    };
    for (const c of lines) {
      if (words(plain(c)) <= 6) run.push(c);
      else {
        flush();
        out.push(c);
      }
    }
    flush();
    return out;
  }

  function Footer(m, onOriginal) {
    const f = m.footer;
    const print = smallPrint(f.text);
    const long = words(print.map(plain).join(" ")) > 40;
    return h(
      "footer",
      { class: "nis-footer" },
      f.groups.length ? Rail("nis-pad nis-footcols", f.groups.map((g) => h("div", { class: "nis-footcol" }, g.title ? h("p", { class: "nis-foottitle" }, g.title) : null, g.links.map((l) => act(l.link, "nis-footlink", l.title))))) : null,
      long ? Rail("nis-pad nis-footprint", h("div", { class: "nis-footmeta" }, print.map((c) => h("p", {}, Inline(c, { quiet: true }))))) : null,
      Rail(
        "nis-pad nis-footbar",
        h("div", { class: "nis-brand nis-brand-sm" }, m.identity.logo?.src ? h("img", { class: "nis-logo", src: m.identity.logo.src, alt: "" }) : null, h("span", { class: "nis-name" }, m.identity.name)),
        long ? null : h("div", { class: "nis-footmeta" }, print.map((c) => h("p", {}, Inline(c, { quiet: true })))),
        h("div", { class: "nis-footlinks" }, h("button", { type: "button", class: "nis-footlink", onclick: onOriginal }, "original ↗"), h("a", { class: "nis-footlink", href: "#nis-root" }, "top ↑")),
      ),
      h("div", { class: "nis-row" }, h("div", { class: "nis-rail nis-end" })),
    );
  }

  /* --------------------------------------------------------------------------
   * Running
   * ------------------------------------------------------------------------ */

  let host = null; // #nis-root in the page: holds the shadow root and the page's live controls
  let root = null; // our layout, inside the shadow root
  let model = null;
  let lastRead = null;
  let signature = "";

  function signatureOf(m) {
    const parts = [m.identity.name, m.nav.items.map((i) => i.label).join(","), m.notices.map(plain).join("|"), plain(m.hero.title || [])];
    for (const s of m.sections) parts.push(plain(s.title || []), s.blocks.map((b) => b.k + (b.kind || "") + (b.items?.length || "") + (b.atoms?.length || "") + (b.fields?.length || "")).join(","));
    return parts.join("¦");
  }

  function render(m) {
    lightNodes = [];
    const next = h(
      "div",
      { id: "nis-root", lang: lang || null, dir: html.getAttribute("dir") || null },
      Header(m),
      h("main", { class: "nis-main" }, Notices(m.notices), Hero(m), Sections(m)),
      Footer(m, showOriginal),
    );
    if (!host) {
      host = h("div", { id: "nis-root" });
      const shadow = host.attachShadow({ mode: "open" });
      shadow.append(sheetText ? h("style", {}, sheetText) : h("link", { rel: "stylesheet", href: SHEET }));
    }
    if (!host.isConnected || host.parentNode !== document.body) document.body.prepend(host);
    for (const n of lightNodes) if (n.parentNode !== host) host.append(n);
    if (root) root.replaceWith(next);
    else host.shadowRoot.append(next);
    root = next;
  }

  /** Puts adopted controls back where they came from and shows the original page. */
  const OUR_CLASSES = ["nis-control", "nis-control-btn", "nis-control-btn2", "nis-control-search", "nis-control-choice", "nis-media"];
  function showOriginal() {
    for (const [slot, node] of slots) {
      if (slot.isConnected) {
        slot.replaceWith(node);
        node.removeAttribute("slot");
        node.classList.remove(...OUR_CLASSES);
        if (node.__nisFormAttr) node.removeAttribute("form");
        node.__nisAdopted = false;
      }
    }
    slots = new Map();
    host?.remove();
    host = root = null;
    html.classList.remove("nis-composed");
    observer?.disconnect();
    const back = h("button", { type: "button", class: "nis-backbtn", onclick: () => location.reload() }, "Back to redesign");
    back.setAttribute("data-nis-portal", "");
    document.body.append(back);
  }

  /* Pop-ups the page opens: shown above our layout, restyled. */
  const DIALOGISH = '[role=dialog], [role=alertdialog], [aria-modal=true], dialog[open], .modal, .popup, .lightbox, [class*="modal" i], [class*="popup" i], [class*="lightbox" i]';
  const MODAL = "[role=dialog], [role=alertdialog], [aria-modal=true], dialog";
  /**
   * Pop-ups open right now: a box of real size floating (fixed) over the middle of the screen.
   * Bars, dropdowns, side tabs, cookie and newsletter prompts aren't pop-ups. Called while the
   * original page is shown as itself (see update).
   */
  function openDialogs() {
    const out = [];
    const w = vw();
    const hgt = window.innerHeight;
    for (const el of document.querySelectorAll(DIALOGISH)) {
      if (host?.contains(el) || el.closest("[data-nis-portal]")) continue;
      if (BOILERPLATE.test(ident(el)) || PROMO_TEXT.test(el.textContent.slice(0, 600))) continue;
      if (!shown(el)) continue;
      const r = rect(el);
      if (r.width < 200 || r.height < 80) continue;
      // Over the middle of the screen, not a bar along an edge.
      if (r.left > w / 2 || r.right < w / 2 || r.bottom < hgt * 0.25 || r.top > hgt * 0.75) continue;
      if (r.height < 160 && r.width >= w * 0.9) continue;
      let fixed = false;
      for (let p = el; p && p !== document.body; p = p.parentElement) if (css(p).position === "fixed" || (T(p) === "DIALOG" && p.open)) fixed = true;
      if (!fixed) continue;
      out.push(el);
    }
    // Pop-ups the reader didn't open (promos and notices on arrival or on a timer) are left out:
    // only one that opens just after a click, key or submit is shown.
    const opened = out.filter((el) => !arrived.has(el) && !out.some((o) => o !== el && o.contains(el)));
    if (performance.now() - lastAct > 4000) {
      for (const el of opened) arrived.add(el);
      return [];
    }
    return opened;
  }
  let arrived = new Set();
  let lastAct = -Infinity;
  for (const type of ["click", "keydown", "submit", "pointerdown", "change"]) addEventListener(type, () => (lastAct = performance.now()), { capture: true, passive: true });
  function portals(open) {
    for (const el of open) {
      if (el.closest("[data-nis-portal]")) continue;
      // Lift the outermost layer of the pop-up (its overlay) out of the hidden page.
      let layer = el;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (["fixed", "absolute"].includes(css(p).position)) layer = p;
      if (layer.parentElement === document.body) layer.setAttribute("data-nis-portal", "");
      else {
        const holder = h("div", { "data-nis-portal": "" });
        document.body.append(holder);
        holder.append(layer);
      }
      try {
        api?.tag(layer);
      } catch {}
    }
  }
  const PROMO_TEXT = /\b(cookies?|consent|privacy (settings|preferences)|subscribe to our newsletter|sign up for our newsletter)\b/i;

  let observer = null;
  let timer = 0;
  // Pages that set <html class> wholesale drop ours: put them back.
  const classKeeper = new MutationObserver(() => {
    if (!host) return;
    if (!html.classList.contains("nis-composed")) html.classList.add("nis-composed");
    if (!html.classList.contains("nis-on")) html.classList.add("nis-on");
  });

  // Smooth-scroll libraries take over the wheel; on our layout, scrolling is the browser's own.
  for (const type of ["wheel", "touchmove"]) {
    window.addEventListener(
      type,
      (e) => {
        if (host && host.contains(e.target)) e.stopImmediatePropagation();
      },
      { capture: true, passive: true },
    );
  }

  function watch() {
    classKeeper.observe(html, { attributes: true, attributeFilter: ["class"] });
    observer = new MutationObserver((records) => {
      // Frameworks that take over <body> (hydration, client routing) drop nodes they didn't render: ours goes back.
      if (host && host.parentNode !== document.body && document.body) {
        document.body.prepend(host);
        html.classList.add("nis-on", "nis-composed");
      }
      if (records.every((r) => host?.contains(r.target) || r.target.closest?.("[data-nis-portal], head") || T(r.target) === "HEAD" || (r.target === html && r.type === "attributes"))) return;
      clearTimeout(timer);
      timer = setTimeout(update, 400);
    });
    observer.observe(html, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ["class", "style", "hidden", "open", "aria-hidden", "aria-expanded"] });
  }

  function update() {
    observer.disconnect();
    try {
      // Read the original as laid out on its own: our layout out of the way, the page shown.
      // Focus inside the shadow root shows as the host; inside a moved control, as the control.
      const busy = !!host && host.contains(document.activeElement) && (document.activeElement !== host || !!host.shadowRoot.activeElement?.matches("input, textarea, select, [contenteditable]"));
      if (host) host.style.display = "none";
      html.classList.remove("nis-composed");
      html.classList.remove("nis-on");
      const y = scrollY;
      let m;
      let open = [];
      try {
        reading(() => {
          open = openDialogs();
          // Never rebuild under someone's fingers.
          if (!busy) m = readPage();
        });
      } finally {
        html.classList.add("nis-on", "nis-composed");
        if (host) host.style.display = "";
        if (scrollY !== y) scrollTo(0, y);
      }
      portals(open);
      if (!m) return;
      const sig = signatureOf(m);
      if (sig !== signature) {
        signature = sig;
        model = m;
        render(m);
      }
    } catch (err) {
      console.debug("Redesign couldn't update the layout:", err);
      html.classList.add("nis-composed");
    } finally {
      observer.observe(html, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ["class", "style", "hidden", "open", "aria-hidden", "aria-expanded"] });
    }
  }

  /**
   * Called by content.js once the page and its stylesheets are in.
   * Returns true when the page was composed; false to have it restyled instead.
   */
  function run(a) {
    api = a;
    if (!top) return false;
    const decline = (why) => {
      html.setAttribute("data-nis-declined", why);
      return false;
    };
    try {
      // Read the page in its own styles.
      html.classList.remove("nis-on");
      let m, covered, total, open;
      const app = reading(() => {
        if (appLike()) return true;
        api.learnPage();
        m = readPage();
        covered = modelText(m);
        total = m.mainParts.reduce((n, p) => n + (excluded.has(p) ? 0 : readableText(p).replace(/\s+/g, "").length), 0);
        arrived = new Set(openDialogs());
        open = [];
        return false;
      });
      html.classList.add("nis-on");
      if (app) return decline("app");
      lastRead = m;
      html.setAttribute("data-nis-coverage", total ? (covered / total).toFixed(2) : "0");
      // Every page is rebuilt from the same blocks, whatever it sends: restyling keeps a
      // site's own layout, so it's only for tools (above). A page still rendering (single
      // page apps) is read again as its content arrives.
      model = m;
      signature = signatureOf(m);
      render(m);
      html.classList.add("nis-composed");
      portals(open);
      watch();
      // Read again once everything has loaded (late stylesheets, lazy content).
      if (document.readyState !== "complete") window.addEventListener("load", () => setTimeout(update, 60), { once: true });
      return true;
    } catch (err) {
      console.debug("Redesign couldn't compose this page; restyling it instead:", err);
      html.setAttribute("data-nis-declined", `error: ${err?.message || err}`.slice(0, 200));
      html.classList.add("nis-on");
      if (host) {
        showOriginalQuiet();
      }
      return false;
    }
  }
  function showOriginalQuiet() {
    for (const [slot, node] of slots) if (slot.isConnected) slot.replaceWith(node), node.removeAttribute("slot"), node.classList.remove(...OUR_CLASSES);
    slots = new Map();
    host?.remove();
    host = root = null;
    html.classList.remove("nis-composed");
  }

  // For inspection: a summary of the page model.
  const summary = (m = model || lastRead) =>
    m && {
      identity: m.identity.name,
      nav: m.nav.items.map((i) => `${i.label}${i.groups.length ? ` [${i.groups.reduce((n, g) => n + g.links.length, 0)}]` : ""}`),
      actions: m.nav.actions.map((a) => a.label),
      notices: m.notices.map(plain),
      hero: { title: plain(m.hero.title || []), lead: m.hero.lead.map(plain), actions: m.hero.actions.map((a) => plain(a.c)), img: !!m.hero.img },
      sections: m.sections.map((s) => ({
        title: plain(s.title || []),
        role: role(s),
        blocks: s.blocks.map((b) => `${b.k}${b.kind ? ":" + b.kind : ""}(${b.items?.length ?? b.atoms?.length ?? b.fields?.length ?? ""}) ${(b.items || []).slice(0, 3).map((i) => (typeof i.title === "string" ? i.title : plain(i.title || [])) + (i.icon ? "+icon" : "") + (i.img ? "+img" : "") + (i.link ? "+link" : "")).join(" | ")}`),
      })),
      footer: { groups: m.footer.groups.map((g) => `${g.title}(${g.links.length})`), text: m.footer.text.map(plain), logos: m.footer.logos.length },
    };
  window.__nisCompose = { run, summary };
  // Inspection from the page or a test runner: dispatch "nis-summary" and read data-nis-summary.
  window.addEventListener("nis-summary", () => html.setAttribute("data-nis-summary", JSON.stringify(summary() || null)));
})();
