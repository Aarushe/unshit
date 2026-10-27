// Restyles the live page in the New Internet Society design.
//
// The page's own HTML and scripts keep running untouched — forms submit,
// menus open, pop-ups pop — only their presentation changes. Each element is
// read once (in its original styles), given a role in data-nis, and
// redesign.css styles roles. New and newly shown elements are handled as they
// appear, so dynamic UI is redesigned too.

(() => {
  if (window.__nisRedesign) return;
  // Only HTML pages (also XHTML); SVG images, XML feeds and plain-text files are left alone.
  if (!(document.documentElement instanceof HTMLHtmlElement)) return;
  window.__nisRedesign = true;

  const html = document.documentElement;
  html.classList.add("nis-on");

  // Reads that a page can't shadow: a <form> exposes its fields as properties,
  // so <input name="tagName"> or name="children" would otherwise break the walk.
  // Tag names are upper-cased because XHTML pages report them in lowercase.
  const getter = (proto, name) => Object.getOwnPropertyDescriptor(proto, name).get;
  const tagNameOf = getter(Element.prototype, "tagName");
  const childrenOf = getter(Element.prototype, "children");
  const tagOf = (el) => (el ? tagNameOf.call(el).toUpperCase() : "");
  const kidsOf = (el) => childrenOf.call(el);

  // Fonts come from the extension itself. Its URL scheme differs per browser
  // (chrome-extension://, moz-extension://, safari-web-extension://), so they're
  // added here rather than in redesign.css.
  try {
    const face = (family, file, weight) => {
      const f = new FontFace(family, `url("${chrome.runtime.getURL(`fonts/${file}`)}") format("opentype")`, { weight, display: "swap" });
      document.fonts.add(f);
      f.load().catch(() => {});
    };
    if (!document.documentElement.hasAttribute("data-nis-fonts")) {
      document.documentElement.setAttribute("data-nis-fonts", "");
      face("NIS Serif", "LTSuperiorSerif-Regular.otf", "400");
      face("NIS Serif", "LTSuperiorSerif-Medium.otf", "500 700");
      face("NIS Sans", "InterDisplay-Regular.otf", "100 400");
      face("NIS Sans", "InterDisplay-Medium.otf", "500");
      face("NIS Sans", "InterDisplay-SemiBold.otf", "600 900");
    }
  } catch {
    // Fonts blocked: the system fallbacks in redesign.css take over.
  }

  /* --------------------------------------------------------------------------
   * Colour helpers. Computed colours may be rgb(), color(srgb …), oklch(),
   * lab() …; they're converted to RGBA here. Canvas readback is only a last
   * resort, since privacy modes (Firefox resistFingerprinting, Brave) randomise it.
   * ------------------------------------------------------------------------ */

  let ctx2d = null;
  const colorCache = new Map();

  const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  function oklabToRgb(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      clamp255(fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
      clamp255(fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
      clamp255(fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
    ];
  }
  function labToRgb(L, a, b) {
    // CIE Lab (D50) → XYZ → linear sRGB (D65, Bradford-adapted).
    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;
    const f = (t) => (t ** 3 > 0.008856 ? t ** 3 : (116 * t - 16) / 903.3);
    const X = 0.96422 * f(fx);
    const Y = L > 8 ? fy ** 3 : L / 903.3;
    const Z = 0.82521 * f(fz);
    return [
      clamp255(fromLinear(3.1341359569958707 * X - 1.6173863321612538 * Y - 0.4906619460083532 * Z)),
      clamp255(fromLinear(-0.978795502912089 * X + 1.916254567259524 * Y + 0.03344273116131949 * Z)),
      clamp255(fromLinear(0.07195537988411677 * X - 0.2289768264158322 * Y + 1.405386058324125 * Z)),
    ];
  }
  const num = (v, scale = 1) => (v === "none" ? 0 : v.endsWith("%") ? (parseFloat(v) / 100) * scale : parseFloat(v));

  function parseColor(value) {
    const m = value.match(/^(rgba?|color|oklch|oklab|lch|lab)\((.*)\)$/i);
    if (!m) return null;
    const fn = m[1].toLowerCase();
    let [main, alpha] = m[2].split("/");
    let parts = main.split(/[\s,]+/).filter(Boolean);
    if (fn.startsWith("rgb") && alpha === undefined && parts.length === 4) alpha = parts.pop();
    const A = alpha === undefined ? 1 : num(alpha.trim(), 1);
    if (fn.startsWith("rgb")) return [num(parts[0], 255), num(parts[1], 255), num(parts[2], 255), A];
    if (fn === "color") {
      // srgb, display-p3, rec2020…: close enough read as sRGB for light/dark decisions.
      const space = parts.shift();
      if (/xyz/.test(space)) return null;
      const lin = /linear/.test(space);
      return [...parts.slice(0, 3).map((v) => clamp255(lin ? fromLinear(num(v, 1)) : num(v, 1))), A];
    }
    if (fn === "oklab") return [...oklabToRgb(num(parts[0], 1), num(parts[1], 0.4), num(parts[2], 0.4)), A];
    if (fn === "oklch") {
      const C = num(parts[1], 0.4);
      const h = (num(parts[2]) * Math.PI) / 180;
      return [...oklabToRgb(num(parts[0], 1), C * Math.cos(h), C * Math.sin(h)), A];
    }
    if (fn === "lab") return [...labToRgb(num(parts[0], 100), num(parts[1], 125), num(parts[2], 125)), A];
    if (fn === "lch") {
      const C = num(parts[1], 150);
      const h = (num(parts[2]) * Math.PI) / 180;
      return [...labToRgb(num(parts[0], 100), C * Math.cos(h), C * Math.sin(h)), A];
    }
    return null;
  }

  function rgba(value) {
    if (!value || value === "transparent") return [0, 0, 0, 0];
    let hit = colorCache.get(value);
    if (hit) return hit;
    hit = parseColor(value.trim());
    if (!hit || hit.some((v) => Number.isNaN(v))) {
      try {
        if (!ctx2d) {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          ctx2d = canvas.getContext("2d", { willReadFrequently: true });
        }
        ctx2d.clearRect(0, 0, 1, 1);
        ctx2d.fillStyle = "#000";
        ctx2d.fillStyle = value;
        ctx2d.fillRect(0, 0, 1, 1);
        const d = ctx2d.getImageData(0, 0, 1, 1).data;
        hit = [d[0], d[1], d[2], d[3] / 255];
      } catch {
        hit = [0, 0, 0, 0];
      }
    }
    colorCache.set(value, hit);
    return hit;
  }

  const WHITE = [255, 255, 255, 1];
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  const luminance = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  // Chroma: how far a colour is from grey (0–1). Unlike HSL saturation it
  // doesn't call near-white tints like #f6f8fa "saturated".
  const chroma = ([r, g, b]) => (Math.max(r, g, b) - Math.min(r, g, b)) / 255;

  /* --------------------------------------------------------------------------
   * Casing: titles are never all caps. Mirrors lib/casing.ts — every cased
   * script (Latin, Greek, Cyrillic, Armenian…), each in its own locale; scripts
   * without case (CJK, Arabic, Hebrew, Indic…) never shout.
   * ------------------------------------------------------------------------ */

  const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’]*(?:[-‐][\p{L}\p{M}][\p{L}\p{M}'’]*)*/gu;
  const isUpper = (w) => /\p{Lu}/u.test(w) && !/\p{Ll}/u.test(w);

  const locales = new Map();
  function locale(lang) {
    if (!lang) return "und";
    let hit = locales.get(lang);
    if (!hit) {
      try {
        "i".toLocaleUpperCase(lang);
        hit = lang;
      } catch {
        hit = "und";
      }
      locales.set(lang, hit);
    }
    return hit;
  }
  const fold = (w) => w.toLocaleLowerCase("und").normalize("NFD").replace(/\p{M}/gu, "");

  const COMMON = new Set(
    (
      "a an the and or but nor so yet of to in on at by for from with as into onto upon off out up down over " +
      "is am are was were be been do does did has have had can may will must not no yes all any each few " +
      "how why who what when where here there this that these those it its we us our you your my me he she " +
      "him her his they them their if then than too very just only also more most less much many some " +
      "new now old get got go see use used one two six ten own via per log sign home help about " +
      "join read view find shop sale menu next back page last open free gift news blog team work " +
      "fees fee pay paid form step user name date time year day days week site book call mail info " +
      "like make take give keep show list main data file done edit save send stop start end plan care " +
      "set run buy try ask add let put war art law tax job act age air big car far fun hot low man men way win " +
      "le la les un une des du de et ou en au aux sur par pour dans avec sans est son sa ses nos vos ce cet qui que ne pas plus " +
      "el los las y o e u con por para del al una uno su sus mas mi tu " +
      "os um uma do da dos das no na em ao com sem " +
      "il lo gli di da per non che " +
      "der die das und oder mit von zu im am ist ein eine den dem auf fur bei aus wie was wir sie ihr uns ich es " +
      "het een van voor op met niet"
    ).split(" "),
  );

  // Folded key → spelling → how often the page uses it. Grows as content appears.
  const spellings = new Map();

  function isShouting(text) {
    return !/\p{Ll}/u.test(text) && (text.match(/\p{Lu}/gu) || []).length >= 4;
  }

  /** Learns from one piece of text: in shouted pieces capitals mean nothing; in ordinary ones they mark acronyms. */
  function learn(text) {
    // Only pieces with small letters show which words the page really writes in capitals.
    const shouted = !/\p{Ll}/u.test(text);
    for (const w of text.match(WORD) || []) {
      if (shouted && isUpper(w)) continue;
      if (!/\p{L}/u.test(w)) continue;
      const key = fold(w);
      let forms = spellings.get(key);
      if (!forms) spellings.set(key, (forms = new Map()));
      forms.set(w, (forms.get(w) || 0) + 1);
    }
  }

  function spell(w, loc) {
    const forms = spellings.get(fold(w));
    if (!forms) return undefined;
    const all = [...forms];
    const exact = all.filter(([f]) => f.toLocaleUpperCase(loc) === w);
    const pool = exact.length ? exact : all;
    return pool.sort(
      (a, b) => b[1] - a[1] || Number(a[0] !== a[0].toLocaleLowerCase(loc)) - Number(b[0] !== b[0].toLocaleLowerCase(loc)),
    )[0][0];
  }

  const acronymish = (w) => /^[A-Z]+$/.test(w) && (w.length <= 3 || (w.length === 4 && !/[AEIOUY]/.test(w)));
  const capitalise = (w, loc) => {
    const [first, ...rest] = w;
    return first.toLocaleUpperCase(loc) + rest.join("");
  };
  const SENTENCE_END = /[.!?…。！？]["'”’»)\]]*\s*$/u;
  const CODEISH = /[\p{N}_]/u;

  /** Sentence-cases shouted text. `force`: part of a shouted line; `first`: starts that line. */
  function fixCase(text, { lang, force = false, first = true } = {}) {
    if (!(force ? /\p{Lu}/u.test(text) && !/\p{Ll}/u.test(text) : isShouting(text))) return text;
    const loc = locale(lang);
    let lastEnd = 0;
    return text.replace(WORD, (w, offset) => {
      const start = first || (lastEnd > 0 && SENTENCE_END.test(text.slice(lastEnd, offset)));
      first = false;
      lastEnd = offset + w.length;
      if (!/\p{Lu}/u.test(w)) return w;
      if (CODEISH.test(text[offset - 1] || "") || CODEISH.test(text.slice(lastEnd, lastEnd + 2).replace(/^[-‐]/, "")[0] || "")) return w;
      let form = spell(w, loc) ?? (acronymish(w) && !COMMON.has(fold(w)) ? w : w.toLocaleLowerCase(loc));
      if (start && form === form.toLocaleLowerCase(loc)) form = capitalise(form, loc);
      return form;
    });
  }

  // Text that must keep its exact characters: code, form values (an <option>'s
  // text is its value), editors, and anything marked as not to be translated.
  const KEEP_TEXT = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "KBD", "SAMP", "VAR", "TT", "TITLE", "ABBR", "ACRONYM", "OPTION", "OPTGROUP", "SELECT", "DATALIST"]);
  const KEEP_CLOSEST = '[contenteditable]:not([contenteditable="false"]), [translate="no"], .notranslate, [data-nis-mono], [data-nis="code"], [data-nis="media-bg"]';

  function keepText(el) {
    if (!el || KEEP_TEXT.has(tagOf(el))) return true;
    if (el.isContentEditable) return true;
    return !!el.closest(KEEP_CLOSEST);
  }

  const langOf = (el) => (el && el.closest("[lang]")?.getAttribute("lang")) || html.getAttribute("lang") || undefined;

  /** The block a piece of text sits in: a line can run through inline elements ("WELCOME TO <b>NASA</b>"). */
  function lineOf(node) {
    let el = node.parentElement;
    while (el && el.parentElement && el.parentElement !== document.body) {
      const d = getComputedStyle(el).display;
      if (d !== "inline" && d !== "contents") break;
      el = el.parentElement;
    }
    return el;
  }

  /** `lines`: each line's text before any rewriting, so a line half-rewritten still counts as shouted. */
  function recaseText(node, lines) {
    const t = node.nodeValue;
    if (!t || t.length > 240 || !/\p{Lu}/u.test(t) || /\p{Ll}/u.test(t)) return;
    const parent = node.parentElement;
    if (keepText(parent)) return;
    const lang = langOf(parent);
    let fixed = fixCase(t, { lang });
    if (fixed === t) {
      // Too short to judge alone ("UP" in "<b>SIGN</b> <b>UP</b>"): judge the whole line.
      const line = lineOf(node);
      const whole = line ? (lines && lines.get(line)) ?? line.textContent : "";
      if (!whole || whole.length > 240 || !isShouting(whole)) return;
      let before = "";
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n && n !== node; n = walker.nextNode()) before += n.nodeValue;
      fixed = fixCase(t, { lang, force: true, first: !/\p{L}/u.test(before) });
    }
    if (fixed !== t) node.nodeValue = fixed;
  }

  /** Learns the page's spellings from its own text, one text node at a time. */
  function learnWithin(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let budget = 400000;
    for (let n = walker.nextNode(); n && budget > 0; n = walker.nextNode()) {
      const t = n.nodeValue;
      if (!t.trim() || KEEP_TEXT.has(tagOf(n.parentElement))) continue;
      budget -= t.length;
      learn(t);
    }
  }

  // Casing waits until the page has loaded and settled, so frameworks that
  // hydrate server-rendered HTML (React, Vue, Svelte…) find the text they sent.
  let casingReady = false;

  function recaseWithin(el) {
    if (!casingReady) return;
    const nodes = [];
    const lines = new Map();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.nodeValue;
      if (t.length > 240 || !/\p{Lu}/u.test(t) || /\p{Ll}/u.test(t)) continue;
      nodes.push(n);
      const line = lineOf(n);
      if (line && !lines.has(line)) lines.set(line, line.textContent);
    }
    for (const n of nodes) recaseText(n, lines);
    // Shouted button labels and placeholders too. A named submit button's value
    // is sent with the form, so it's left exactly as it is.
    for (const input of el.querySelectorAll?.("input[type=submit], input[type=button], input[placeholder], textarea[placeholder]") || []) {
      if (keepText(input.parentElement)) continue;
      const lang = langOf(input);
      if ((input.type === "submit" || input.type === "button") && input.value && !input.name) {
        const v = fixCase(input.value, { lang });
        if (v !== input.value) input.value = v;
      }
      if (input.placeholder) {
        const v = fixCase(input.placeholder, { lang });
        if (v !== input.placeholder) input.placeholder = v;
      }
    }
  }

  /**
   * Text the page set in capitals with CSS but wrote in lowercase ("sign in")
   * starts each line with a capital once the capitals are gone ("Sign in").
   */
  function sentenceStart(el) {
    if (!casingReady || keepText(el)) return;
    const lines = new Set();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.nodeValue;
      const i = t.search(/\p{L}/u);
      if (i < 0) continue;
      const line = lineOf(n);
      const key = line && el.contains(line) ? line : el;
      if (lines.has(key)) continue;
      lines.add(key);
      if (keepText(n.parentElement)) continue;
      if (/\p{Ll}/u.test(t[i])) n.nodeValue = t.slice(0, i) + capitalise(t.slice(i), locale(langOf(n.parentElement)));
    }
  }

  /* --------------------------------------------------------------------------
   * Classification
   * ------------------------------------------------------------------------ */

  const IGNORE = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "HEAD", "TITLE", "BR", "WBR", "BASE", "PARAM", "SOURCE", "TRACK"]);
  const MEDIA = new Set(["IMG", "PICTURE", "VIDEO", "CANVAS", "SVG", "IFRAME", "OBJECT", "EMBED", "AUDIO", "MAP", "MATH"]);
  const HEADINGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

  const vw = () => window.innerWidth || html.clientWidth || 1;
  const vh = () => window.innerHeight || html.clientHeight || 1;

  function hasDirectText(el) {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }
  function directText(el) {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return t.slice(0, 200);
  }

  const MONO = /(^|[\s,"'])(monospace|ui-monospace|[^,]*\bmono\b[^,]*|[^,]*\bcode\b[^,]*|courier[^,]*|consolas|menlo|monaco|sfmono-regular|lucida console|source code pro|fira code|jetbrains mono|ibm plex mono|roboto mono|cascadia[^,]*)\s*["']?\s*(,|$)/i;
  // Arabic, Hebrew, Syriac, Thaana, N'Ko and the Indic/Southeast Asian scripts stack marks above and below.
  const TALL_SCRIPT = /[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Lao}\p{Script=Tibetan}\p{Script=Myanmar}\p{Script=Khmer}]/u;
  const NO_TRACKING_SCRIPT = /[\p{Script=Hebrew}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Mongolian}]/u;

  function interactive(el, cs) {
    const t = tagOf(el);
    return (
      t === "A" ||
      t === "BUTTON" ||
      t === "SUMMARY" ||
      t === "LABEL" ||
      el.getAttribute("role") === "button" ||
      el.getAttribute("role") === "tab" ||
      el.getAttribute("role") === "menuitem" ||
      el.hasAttribute("onclick") ||
      (cs.cursor === "pointer" && (!el.parentElement || getComputedStyle(el.parentElement).cursor !== "pointer"))
    );
  }

  /** An input with no border or fill of its own: its container draws the field. */
  const embedded = (cs) =>
    (parseFloat(cs.borderTopWidth) === 0 || rgba(cs.borderTopColor)[3] < 0.1 || cs.borderTopStyle === "none") &&
    (parseFloat(cs.borderBottomWidth) === 0 || rgba(cs.borderBottomColor)[3] < 0.1) &&
    rgba(cs.backgroundColor)[3] < 0.1;

  const isDialog = (el) =>
    tagOf(el) === "DIALOG" ||
    el.getAttribute("role") === "dialog" ||
    el.getAttribute("role") === "alertdialog" ||
    el.getAttribute("aria-modal") === "true" ||
    /(^|\s)(modal-content|modal-box|modal__content|popup-content|dialog-content|swal2-popup|ui-dialog)(\s|$)/i.test(el.getAttribute("class") || "");

  /**
   * Decides an element's role. `parent` is the context inherited from above:
   * { media, ink, bar, dialog, box } flags.
   */
  function classify(el, parent) {
    const tag = tagOf(el);
    const cs = getComputedStyle(el);
    const ctx = { ...parent };
    const set = {};

    if (MEDIA.has(tag) || el instanceof SVGElement) {
      if (tag === "IMG" && (el.naturalWidth >= 160 || el.width >= 160) && !parent.bar) set.img = "content";
      return { kind: "media", ctx, set, walk: false };
    }

    // Custom checkboxes, radios and switches: a hidden native input followed by
    // a drawn element. The drawing carries the state, so leave it be.
    const prev = el.previousElementSibling;
    if (
      el.getAttribute("role") === "switch" ||
      (prev && tagOf(prev) === "INPUT" && /^(checkbox|radio)$/.test(prev.type) && kidsOf(el).length <= 2 && el.textContent.trim().length < 3)
    ) {
      return { kind: "media", ctx: { ...ctx, media: true }, set, walk: true };
    }

    const rect = el.getBoundingClientRect();
    const bg = rgba(cs.backgroundColor);
    const bgImage = cs.backgroundImage;
    const hasUrlBg = bgImage && bgImage !== "none" && bgImage.includes("url(");
    const bgVisible = bg[3] > 0.05;
    const bgLum = luminance(bg);
    const bgChroma = chroma(bg);
    // Painted = differs from the surface it sits on (a link repeating its bar's
    // colour isn't painted; a white box on a dark bar is).
    const under = parent.paint || WHITE;
    const painted = bgVisible && bg[3] > 0.5 && distance(bg, under) > 14;
    const underDark = luminance(under) < 0.45;
    const tinted = painted && (bgLum < 0.94 || bgChroma > 0.06 || underDark);
    // Dark surfaces stay dark (as our ink) so logos and icons drawn for them stay
    // visible; only a page-sized dark background turns light.
    const darkSurface =
      painted && bgLum < 0.2 && !(rect.width >= vw() * 0.9 && rect.height >= vh() * 0.8 && tag !== "HEADER" && tag !== "FOOTER" && tag !== "NAV");
    if (painted) {
      ctx.paint = bg;
      ctx.dark = darkSurface;
      set.paint = `${Math.round(bg[0])},${Math.round(bg[1])},${Math.round(bg[2])}`;
    }
    if (darkSurface) set.tone = "dark";
    const borderVisible =
      parseFloat(cs.borderTopWidth) > 0 && rgba(cs.borderTopColor)[3] > 0.1 && cs.borderTopStyle !== "none";
    const strongBg = painted && (bgLum < 0.35 || (bgChroma > 0.25 && bgLum < 0.6));
    const cls = el.getAttribute("class") || "";
    const area = rect.width * rect.height;
    const fs = parseFloat(cs.fontSize) || 16;
    const text = hasDirectText(el);

    // Read before redesign.css resets it: capitals set by CSS, and Title Case /
    // lowercase styling (which isn't shouting and is kept).
    if (cs.textTransform === "uppercase" || cs.textTransform === "full-width" || /small-caps|all-petite-caps|petite-caps|unicase|titling-caps/.test(cs.fontVariantCaps)) set.caps = "";
    else if (cs.textTransform === "capitalize" || cs.textTransform === "lowercase") set.tt = cs.textTransform;

    // Code views built from divs and tables (diffs, editors, terminals) keep a monospace face.
    if (MONO.test(cs.fontFamily) && !parent.mono) {
      set.mono = "";
      ctx.mono = true;
    }

    // Scripts without letter-spacing (cursive or syllabic) and those with tall stacked marks.
    if (text) {
      const own = directText(el);
      if (TALL_SCRIPT.test(own)) set.script = "tall";
      else if (NO_TRACKING_SCRIPT.test(own)) set.script = "";
    }

    // Text colour: grey, mid-tone text stays secondary.
    if (text && !parent.media && !parent.ink) {
      const c = rgba(cs.color);
      const lum = luminance(c);
      if (chroma(c) < 0.12 && lum > 0.12 && lum < 0.75) set.muted = "";
      if (fs < 12.5) set.small = "";
    }

    // Form controls.
    if (tag === "INPUT") {
      const type = (el.getAttribute("type") || "").toLowerCase();
      if (type === "hidden") return { kind: "plain", ctx, set, walk: false };
      if (type === "checkbox" || type === "radio" || type === "range" || type === "color") return { kind: "check", ctx, set, walk: false };
      if (type === "submit" || type === "button" || type === "reset" || type === "image") {
        // Browser-default submit buttons are the form's main action; sites that paint
        // their own light buttons (e.g. Google's) keep them secondary.
        const native = cs.borderTopStyle === "outset" || (!tinted && !borderVisible);
        set.tone = strongBg || (type === "submit" && native) ? "primary" : "secondary";
        if (parseFloat(cs.paddingLeft) < 10) set.pad = "";
        return { kind: "btn", ctx, set, walk: false };
      }
      if (type === "file") return { kind: "file", ctx, set, walk: false };
      return { kind: embedded(cs) ? "field-bare" : "field", ctx, set, walk: false };
    }
    if (tag === "SELECT" || tag === "TEXTAREA") {
      return { kind: tag === "TEXTAREA" && embedded(cs) ? "field-bare" : "field", ctx, set, walk: tag === "SELECT" };
    }
    if (tag === "OPTION" || tag === "OPTGROUP") return { kind: "plain", ctx, set, walk: false };

    // Full-screen scrims behind pop-ups.
    const fixedish = cs.position === "fixed" || cs.position === "absolute";
    const coversViewport = rect.width >= vw() * 0.9 && rect.height >= vh() * 0.85;
    if (fixedish && coversViewport && bgVisible && bg[3] < 0.98 && !hasUrlBg && !isDialog(el)) {
      return { kind: "overlay", ctx: { ...ctx, dialog: true }, set, walk: true };
    }
    if (/(^|[\s_-])(backdrop|overlay|scrim)([\s_-]|$)/i.test(el.getAttribute("class") || "") && fixedish && coversViewport) {
      return { kind: "overlay", ctx: { ...ctx, dialog: true }, set, walk: true };
    }

    // Pop-ups: the dialog box itself, or the full-screen wrapper around it.
    if (isDialog(el) && !parent.box) {
      if (coversViewport && !(bgVisible && bg[3] >= 0.98)) {
        // A wrapper (e.g. Bootstrap's .modal): its first painted child is the box.
        return { kind: "dialog-wrap", ctx: { ...ctx, dialog: true }, set, walk: true };
      }
      return { kind: "modal", ctx: { ...ctx, dialog: true, box: true, media: false, ink: false }, set, walk: true };
    }
    if (parent.dialog && !parent.box && bgVisible && !coversViewport && rect.width >= 160 && rect.height >= 60) {
      return { kind: "modal", ctx: { ...ctx, box: true, media: false, ink: false }, set, walk: true };
    }

    // Maps and similar widgets paint their own world: leave them be.
    if (/(^|\s)(leaflet-container|mapboxgl-map|maplibregl-map|gm-style|ol-viewport|esri-view|cesium-viewer)(\s|$)/.test(cls) || (el.id === "map" && area > 40000)) {
      return { kind: "media-bg", ctx: { ...ctx, media: true }, set, walk: false };
    }

    // Photographic / illustrative backgrounds: leave the area's colours alone.
    if (hasUrlBg) {
      const icon = rect.width <= 64 && rect.height <= 64;
      return { kind: icon ? "media" : "media-bg", ctx: { ...ctx, media: true }, set, walk: !icon };
    }

    // Dark code panels and editors keep their own (light-on-dark) colours.
    if (painted && bgLum < 0.12 && (tag === "PRE" || el.querySelector("pre, code"))) {
      return { kind: "media-bg", ctx: { ...ctx, media: true }, set, walk: false };
    }

    if (tag === "TABLE") return { kind: "table", ctx, set, walk: true };
    if (tag === "HR") return { kind: "rule", ctx, set, walk: false };
    if (tag === "CODE" || tag === "PRE" || tag === "KBD" || tag === "SAMP") return { kind: "code", ctx, set, walk: tag !== "PRE" };
    if (tag === "MARQUEE") return { kind: "marquee", ctx, set, walk: true };

    // Buttons and button-like links.
    const roleBtn = tag === "BUTTON" || el.getAttribute("role") === "button";
    const classBtn = /(^|[\s_-])(btn|button)([\s_-]|$)/i.test(cls);
    const label = el.textContent.trim();
    // A link that is just a logo (an image/SVG filling most of it) stays a link.
    const logoMark = tag === "A" ? el.querySelector("svg, img") : null;
    const logoLink = !!logoMark && label.length <= 14 && logoMark.getBoundingClientRect().width >= rect.width * 0.5;
    const looksBtn =
      classBtn ||
      (interactive(el, cs) && (tinted || borderVisible) && rect.height <= 72 && rect.width <= 480 && rect.height >= 18);
    if ((roleBtn || looksBtn) && !logoLink && !parent.ink && rect.height <= 120 && (label || el.querySelector("svg,img,i"))) {
      // Icon buttons, map pins, dots: keep their own painting, just round them off.
      if (label.length < 2 || (rect.width <= 32 && rect.height <= 32)) {
        return { kind: "icon-btn", ctx: { ...ctx, media: true }, set, walk: true };
      }
      // <button> inside a form defaults to type=submit: it's the form's main action.
      const submits = tag === "BUTTON" && el.type === "submit" && el.form && (cs.borderTopStyle === "outset" || !tinted);
      const tone = strongBg || submits ? "primary" : tinted || borderVisible ? "secondary" : "ghost";
      set.tone = tone;
      // On a dark surface a primary button inverts to a white pill with dark text.
      const inverted = tone === "primary" && parent.dark;
      if (parseFloat(cs.paddingLeft) < 10 && el.textContent.trim()) set.pad = "";
      return {
        kind: "btn",
        // Secondary/ghost buttons on a dark surface are drawn transparent, so their
        // content stays on dark; an inverted primary is a white pill.
        ctx: { ...ctx, ink: tone === "primary" && !inverted, dark: inverted ? false : tone === "primary" ? false : !!parent.dark },
        set,
        walk: true,
      };
    }

    // Headings, and big display text built from divs.
    if (HEADINGS.has(tag) || el.getAttribute("role") === "heading") {
      if (fs < 17) set.hsize = "small";
      return { kind: "heading", ctx, set, walk: true };
    }
    if (text && fs >= 26 && el.textContent.trim().length < 160 && cs.display !== "inline") {
      return { kind: "display", ctx, set, walk: true };
    }

    // Bars: site header, navigation, footer.
    const top = rect.top + window.scrollY;
    const wide = rect.width >= vw() * 0.6;
    // Bars nested in bars (a <nav> inside the <header>) are regions, not new surfaces.
    if (parent.bar && (tag === "FOOTER" || tag === "HEADER" || tag === "NAV" || /^(contentinfo|banner|navigation)$/.test(el.getAttribute("role") || ""))) {
      return { kind: set.tone === "dark" ? "plain" : "nav", ctx: { ...ctx, bar: true }, set, walk: true };
    }
    if (tag === "FOOTER" || el.getAttribute("role") === "contentinfo") {
      return { kind: "footer", ctx: { ...ctx, bar: true }, set, walk: true };
    }
    if (
      tag === "HEADER" ||
      tag === "NAV" ||
      el.getAttribute("role") === "banner" ||
      el.getAttribute("role") === "navigation" ||
      ((cs.position === "fixed" || cs.position === "sticky") && wide && rect.top <= 2 && rect.height < 160)
    ) {
      const isTopBar = wide && top < 260;
      return { kind: isTopBar ? "bar" : "nav", ctx: { ...ctx, bar: true }, set, walk: true };
    }

    if (tag === "A") return { kind: "link", ctx, set, walk: true };

    // Painted surfaces, by size.
    const bordered =
      borderVisible &&
      parseFloat(cs.borderBottomWidth) > 0 &&
      parseFloat(cs.borderLeftWidth) > 0 &&
      parseFloat(cs.borderRightWidth) > 0;
    const shadowed = cs.boxShadow && cs.boxShadow !== "none";
    const block = cs.display !== "inline" && cs.display !== "contents";

    // Popovers: painted panels floating over the page (menus, flyouts, tooltips
    // with content). Drawn as white floating panels wherever they appear.
    if (
      bgVisible &&
      bg[3] > 0.5 &&
      (cs.position === "absolute" || cs.position === "fixed") &&
      rect.width >= 120 &&
      rect.height >= 40 &&
      !coversViewport &&
      kidsOf(el).length > 0
    ) {
      // Keep the panel's light/dark tone so it reads as part of what opened it.
      const dark = bgLum < 0.2;
      set.menu = "";
      if (dark) set.tone = "dark";
      else delete set.tone;
      return { kind: "card", ctx: { ...ctx, dark, paint: bg }, set, walk: true };
    }

    // A box that draws a text field around a borderless input (search bars).
    if ((bordered || shadowed || tinted) && block && rect.height <= 72 && rect.width >= 120) {
      const inputs = el.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea");
      if (inputs.length === 1 && embedded(getComputedStyle(inputs[0]))) {
        set.round = parseFloat(cs.borderTopLeftRadius) >= rect.height / 3 ? "" : undefined;
        if (set.round === undefined) delete set.round;
        return { kind: "fieldbox", ctx, set, walk: true };
      }
    }

    if ((tinted || bordered || shadowed) && block && !parent.ink) {
      // Light tinted callouts (notes, warnings, success) keep a pale echo of their hue.
      if (tinted && bgChroma > 0.04 && bgLum > 0.55 && rect.width >= 120 && rect.height >= 32 && !wide) {
        el.style.setProperty("--nis-note", `rgb(${bg[0]} ${bg[1]} ${bg[2]})`);
        set.tone = "note";
      }
      if (wide || rect.height >= vh() * 0.6) {
        if (!darkSurface) set.tone = tinted && bgLum < 0.8 ? "alt" : "plain";
        return { kind: "section", ctx, set, walk: true };
      }
      if (rect.width >= 120 && rect.height >= 56 && kidsOf(el).length > 0) {
        return { kind: "card", ctx, set, walk: true };
      }
      if (tinted && rect.height < 48 && text) {
        return { kind: "chip", ctx: { ...ctx, ink: false }, set, walk: true };
      }
    }
    if (tinted && !block && text && area > 0) return { kind: "chip", ctx, set, walk: true };

    if (tag === "LI" || tag === "P" || tag === "DD" || tag === "BLOCKQUOTE") return { kind: "text", ctx, set, walk: true };
    return { kind: "plain", ctx, set, walk: true };
  }

  /* --------------------------------------------------------------------------
   * Walking and tagging
   * ------------------------------------------------------------------------ */

  // Roles redesign.css paints: dark-toned ones as ink, the rest as light paper.
  const DARK_PAINTED = new Set(["bar", "section", "footer", "card", "chip", "plain", "nav", "fieldbox"]);
  const LIGHT_PAINTED = new Set(["bar", "section", "footer", "card", "chip", "fieldbox", "modal", "field"]);
  const FLAT_IN_BAR = new Set(["section", "card", "chip"]);

  // Menus and dropdowns: redesign.css paints these as white panels.
  const MENU = '[role="menu"], [role="listbox"], [class*="dropdown-menu"], [class*="dropdown-content"], [class*="submenu"]';

  const ROOT_CTX = { media: false, ink: false, bar: false, dialog: false, box: false, mono: false, paint: WHITE };

  function ctxString(c) {
    return ["media", "ink", "bar", "dialog", "dark", "mono"].filter((k) => c[k]).join(" ");
  }

  function parseCtx(el) {
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p.hasAttribute("data-nis")) {
        const s = (p.getAttribute("data-nis-ctx") || "").split(" ");
        const k = p.getAttribute("data-nis");
        let paint = WHITE;
        for (let q = p; q; q = q.parentElement) {
          const v = q.getAttribute("data-nis-paint");
          if (v) {
            paint = [...v.split(",").map(Number), 1];
            break;
          }
        }
        return {
          paint,
          media: s.includes("media"),
          ink: s.includes("ink"),
          dark: s.includes("dark"),
          bar: s.includes("bar"),
          dialog: s.includes("dialog"),
          mono: s.includes("mono"),
          box: s.includes("box") || k === "modal",
        };
      }
      if (p.hasAttribute("data-nis-pending")) return null;
    }
    return { ...ROOT_CTX };
  }

  // Shown right now: laid out, and not hidden by visibility or opacity. Things
  // that are hidden (closed menus, pop-ups) are read when they're opened, in
  // their open-state styles.
  const rendered = (el) => {
    if (getComputedStyle(el).display === "contents") return true;
    if (el.getClientRects().length === 0) return false;
    return el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
  };

  function tag(el, parentCtx) {
    runStack([[el, parentCtx]], el, Infinity);
  }

  /** Tags elements from the stack until done or past the deadline; true when done. */
  function runStack(stack, el, deadline) {
    let n = 0;
    while (stack.length) {
      if ((++n & 63) === 0 && performance.now() > deadline) return false;
      const [node, pc] = stack.pop();
      if (node.nodeType !== 1 || IGNORE.has(tagOf(node))) continue;
      try {
        visit(node, pc, el, stack);
      } catch (err) {
        // One odd element never stops the rest of the page.
        console.debug("Redesign skipped an element:", err);
      }
    }
    return true;
  }

  function visit(node, pc, el, stack) {
    if (node.hasAttribute("data-nis") && node !== el) return;

    // Web components often watch their own attributes; never write to the host
    // element itself, just walk into its content (and open shadow root).
    if (tagOf(node).includes("-")) {
      const kids = kidsOf(node);
      for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i], pc]);
      const root = shadowOf(node);
      if (root) tagShadow(root, pc);
      return;
    }

    // Hidden now (closed menus, pop-ups): decide when it's shown.
    if (!rendered(node) && node !== document.body) {
      node.setAttribute("data-nis-pending", "");
      return;
    }
    node.removeAttribute("data-nis-pending");

    let target = node;
    let result = classify(node, pc);
    if (result.kind === "marquee") {
      // Scrolling text becomes still text.
      const div = document.createElement("div");
      for (const a of node.attributes) if (a.name !== "behavior" && a.name !== "direction" && a.name !== "scrollamount") div.setAttribute(a.name, a.value);
      while (node.firstChild) div.appendChild(node.firstChild);
      node.replaceWith(div);
      target = div;
      result = { kind: "plain", ctx: result.ctx, set: result.set, walk: true };
    }

    const c = result.ctx;
    if (result.kind === "modal") c.box = true;
    // Children inherit how *we* paint this element, not how the page did.
    const menu = "menu" in result.set || target.matches(MENU);
    if (menu) target.setAttribute("data-nis-menu", "");
    if (result.kind !== "btn") {
      // Inside bars, cards and sections are drawn flat (transparent).
      const flat = pc.bar && FLAT_IN_BAR.has(result.kind);
      if (result.set.tone === "dark" && (DARK_PAINTED.has(result.kind) || menu)) c.dark = true;
      else if (menu || (LIGHT_PAINTED.has(result.kind) && !flat)) c.dark = false;
      else c.dark = pc.dark;
    }
    for (const [k, v] of Object.entries(result.set)) target.setAttribute(`data-nis-${k}`, v);
    const cs = ctxString(pc);
    if (cs) target.setAttribute("data-nis-in", cs);
    const childCtx = ctxString(c) + (c.box ? " box" : "");
    if (childCtx) target.setAttribute("data-nis-ctx", childCtx.trim());
    target.setAttribute("data-nis", result.kind);

    if ("caps" in result.set) sentenceStart(target);

    if (result.walk) {
      const kids = kidsOf(target);
      for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i], c]);
      const root = shadowOf(target);
      if (root) tagShadow(root, c);
    }
  }

  // Shadow roots (web components) get the stylesheet adopted and their content
  // tagged. Closed roots are reachable from extensions too (Chrome: chrome.dom;
  // Firefox: openOrClosedShadowRoot).
  const shadowOf = (el) => {
    try {
      return el.shadowRoot || chrome.dom?.openOrClosedShadowRoot?.(el) || el.openOrClosedShadowRoot || null;
    } catch {
      return null;
    }
  };
  let shadowSheet = null;
  let shadowCss = "";
  const shadowSheetReady = fetch(chrome.runtime.getURL("redesign.css"))
    .then((r) => r.text())
    .then((text) => {
      const scoped = text
        .replace(/html\.nis-on:not\(#nis-a\):not\(#nis-b\)/g, "html.nis-on")
        .replace(/@font-face\s*{[^}]*}/g, "") // fonts are already defined on the document
        .replace(/html\.nis-on\s*{/g, ":host {")
        .replace(/html\.nis-on\.nis-bare[^{]*{[^}]*}/g, "")
        .replace(/html\.nis-on body\s+/g, "")
        .replace(/html\.nis-on\s+/g, "");
      shadowCss = scoped;
      try {
        shadowSheet = new CSSStyleSheet();
        shadowSheet.replaceSync(scoped);
      } catch {
        shadowSheet = null;
      }
      for (const root of shadowRoots) adopt(root);
    })
    .catch(() => {});

  const adopted = new WeakSet();
  function adopt(root) {
    if (!shadowCss || adopted.has(root)) return;
    adopted.add(root);
    try {
      // Constructed sheets need Chrome 73 / Firefox 101 / Safari 16.4, and some
      // browsers refuse sheets made in an extension's world: fall back to <style>.
      if (!shadowSheet) throw new Error("no constructed sheet");
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, shadowSheet];
    } catch {
      const style = document.createElement("style");
      style.setAttribute("data-nis-style", "");
      style.textContent = shadowCss;
      root.appendChild(style);
    }
  }

  function tagShadow(root, c) {
    if (shadowRoots.has(root)) return;
    shadowRoots.add(root);
    adopt(root);
    for (const child of root.children) tag(child, c);
    if (casingReady) {
      learnWithin(root);
      recaseWithin(root);
    }
  }

  /** Components that attach their shadow root after the first pass (late upgrades). */
  function findShadows(scope) {
    for (const el of scope.querySelectorAll("*")) {
      if (!tagOf(el).includes("-")) continue;
      const root = shadowOf(el);
      if (!root || shadowRoots.has(root)) continue;
      const c = parseCtx(el.firstElementChild || el) ?? (el.hasAttribute("data-nis-pending") ? null : { ...ROOT_CTX });
      if (c) tagShadow(root, c);
      findShadows(root);
    }
  }

  /* --------------------------------------------------------------------------
   * Running: initial pass, then follow the page as it changes.
   * ------------------------------------------------------------------------ */

  const added = new Set();
  const changed = new Set();
  const texts = new Set();
  let scheduled = false;
  let started = false;

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  let initialDone = false;

  // Waiting for an opening animation, but never on one that loops (spinners)
  // and never for long.
  const settled = (anims) =>
    Promise.race([
      Promise.allSettled(anims.map((a) => a.finished)),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  const finite = (a) => {
    try {
      return a.playState === "running" && a.effect && a.effect.getComputedTiming().endTime !== Infinity;
    } catch {
      return false;
    }
  };

  function flush() {
    scheduled = false;
    if (!initialDone) return;
    pause();
    try {
      for (const el of added) {
        if (!el.isConnected || el.hasAttribute("data-nis")) continue;
        const c = parseCtx(el);
        if (c === null) {
          el.setAttribute("data-nis-pending", "");
          continue;
        }
        tag(el, c);
        if (casingReady) {
          learnWithin(el);
          recaseWithin(el);
        }
      }
      for (const el of changed) {
        if (!el.isConnected) continue;
        const candidates = el.hasAttribute("data-nis-pending") ? [el] : [];
        candidates.push(...el.querySelectorAll("[data-nis-pending]"));
        for (const p of candidates) {
          if (!p.isConnected || !p.hasAttribute("data-nis-pending") || !rendered(p)) continue;
          // Opening animations (fades, colour transitions): read the settled state.
          const moving = p.getAnimations ? p.getAnimations({ subtree: true }).filter(finite) : [];
          if (moving.length) {
            settled(moving).then(() => {
              changed.add(p);
              schedule();
            });
            continue;
          }
          const c = parseCtx(p);
          if (c === null) continue;
          p.removeAttribute("data-nis-pending");
          tag(p, c);
          recaseWithin(p);
        }
      }
      if (casingReady) for (const t of texts) if (t.isConnected && t.parentElement) recaseText(t);
    } finally {
      added.clear();
      changed.clear();
      texts.clear();
      reconnect();
    }
  }

  const OBSERVE = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden", "open", "aria-hidden", "aria-expanded", "aria-modal"],
  };
  function ingest(records) {
    for (const r of records) {
      if (r.type === "childList") {
        for (const n of r.addedNodes) {
          if (n.nodeType === 1) added.add(n);
          else if (n.nodeType === 3) texts.add(n);
        }
      } else if (r.type === "characterData") texts.add(r.target);
      else if (r.target.nodeType === 1) changed.add(r.target);
    }
  }
  const observer = new MutationObserver((records) => {
    ingest(records);
    schedule();
  });
  /** Stops watching while we write, keeping any page changes not yet delivered. */
  function pause() {
    ingest(observer.takeRecords());
    observer.disconnect();
  }
  const shadowRoots = new Set();
  function reconnect() {
    observer.observe(html, OBSERVE);
    for (const root of shadowRoots) if (root.host?.isConnected) observer.observe(root, OBSERVE);
  }

  /** Pages with no styling of their own get a readable column. */
  function bare() {
    const authored = [...document.styleSheets].filter((s) => {
      const owner = s.ownerNode;
      return owner && !(owner.textContent || "").includes("data-nis");
    });
    const styled = document.querySelectorAll("[style]").length;
    return authored.length === 0 && styled < 5;
  }

  function start() {
    if (started || !document.body) return;
    started = true;
    if (bare()) html.classList.add("nis-bare");
    const t0 = performance.now();
    // Watch for changes from the start; they're handled once the first pass ends.
    reconnect();
    // First pass in slices of ~12ms so large pages stay responsive; between
    // slices yield to the event loop (not a whole frame, which can be throttled).
    const channel = new MessageChannel();
    let next = null;
    channel.port1.onmessage = () => next && next();
    const yieldThen = (fn) => {
      next = fn;
      channel.port2.postMessage(0);
    };
    const stack = [[document.body, { ...ROOT_CTX }]];
    const slice = () => {
      pause();
      const done = runStack(stack, document.body, performance.now() + 12);
      reconnect();
      if (!done) return yieldThen(slice);
      html.setAttribute("data-nis-ms", String(Math.round(performance.now() - t0)));
      html.classList.add("nis-ready");
      initialDone = true;
      schedule();
      afterSettled(startCasing);
    };
    slice();
    void shadowSheetReady;
    // Menus that open on CSS :hover/:focus change nothing observable; look for
    // newly shown elements after the interactions that open them.
    let poke = 0;
    const onInteract = () => {
      if (poke) return;
      poke = setTimeout(() => {
        poke = 0;
        if (document.querySelector("[data-nis-pending]")) {
          changed.add(document.body);
          schedule();
        }
      }, 120);
    };
    for (const type of ["mouseover", "focusin", "click", "keyup", "transitionend", "animationend", "scroll"]) {
      document.addEventListener(type, onInteract, { capture: true, passive: true });
    }
    // Late layout (fonts, lazy content) can reveal elements that were hidden at
    // first, and components can attach their shadow roots late.
    for (const delay of [1200, 4000]) {
      setTimeout(() => {
        pause();
        try {
          findShadows(document);
        } finally {
          reconnect();
        }
        changed.add(document.body);
        schedule();
      }, delay);
    }
  }

  /** Runs once the page has loaded and gone quiet (after any hydration). */
  function afterSettled(fn) {
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
    if (document.readyState === "complete") setTimeout(idle, 300);
    else window.addEventListener("load", () => setTimeout(idle, 300), { once: true });
  }

  function startCasing() {
    pause();
    try {
      casingReady = true;
      learn(document.title);
      learnWithin(document.body);
      for (const root of shadowRoots) learnWithin(root);
      recaseWithin(document.body);
      for (const root of shadowRoots) recaseWithin(root);
      for (const el of document.querySelectorAll("[data-nis-caps]")) sentenceStart(el);
      for (const root of shadowRoots) for (const el of root.querySelectorAll("[data-nis-caps]")) sentenceStart(el);
      const title = fixCase(document.title, { lang: html.getAttribute("lang") || undefined });
      if (title !== document.title) document.title = title;
    } finally {
      reconnect();
    }
  }

  // Start once the page's stylesheets have loaded, so elements are read in their real styles.
  function stylesheetsReady() {
    for (const link of document.querySelectorAll('link[rel~="stylesheet"]')) {
      if (!link.sheet && !link.disabled && link.media !== "print") return false;
    }
    return true;
  }
  function whenReady() {
    const began = Date.now();
    const poll = () => {
      if (started) return;
      const parsed = document.readyState !== "loading";
      // Start as soon as the document is parsed and its stylesheets are in;
      // never wait more than 1.5s on a slow stylesheet.
      const late = Date.now() - began > 1500 && document.body;
      if (document.readyState === "complete" || (parsed && stylesheetsReady()) || late) start();
      else setTimeout(poll, 100);
    };
    poll();
    window.addEventListener("load", start, { once: true });
  }
  whenReady();
})();
