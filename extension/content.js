// Restyles the live page in the New Internet Society design.
//
// The page's own HTML and scripts keep running untouched — forms submit,
// menus open, pop-ups pop — only their presentation changes. Each element is
// read once (in its original styles), given a role in data-nis, and
// redesign.css styles roles. New and newly shown elements are handled as they
// appear, so dynamic UI is redesigned too.

(() => {
  if (window.__nisRedesign) return;
  window.__nisRedesign = true;

  const html = document.documentElement;
  html.classList.add("nis-on");

  /* --------------------------------------------------------------------------
   * Colour helpers. Computed colours may be rgb(), color(srgb …), oklch() …;
   * a 1×1 canvas normalises any of them to RGBA.
   * ------------------------------------------------------------------------ */

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx2d = canvas.getContext("2d", { willReadFrequently: true });
  const colorCache = new Map();

  function rgba(value) {
    if (!value || value === "transparent") return [0, 0, 0, 0];
    let hit = colorCache.get(value);
    if (hit) return hit;
    const m = value.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      hit = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    } else {
      ctx2d.clearRect(0, 0, 1, 1);
      ctx2d.fillStyle = "#000";
      ctx2d.fillStyle = value;
      ctx2d.fillRect(0, 0, 1, 1);
      const d = ctx2d.getImageData(0, 0, 1, 1).data;
      hit = [d[0], d[1], d[2], d[3] / 255];
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
   * Casing: titles are never all caps. Mirrors lib/casing.ts.
   * ------------------------------------------------------------------------ */

  const WORD = /[A-Za-z][A-Za-z'’]*(?:-[A-Za-z][A-Za-z'’]*)*/g;
  const isUpper = (w) => w === w.toUpperCase() && w !== w.toLowerCase();
  const COMMON = new Set(
    (
      "a an the and or but nor so yet of to in on at by for from with as into onto upon off out up down over " +
      "is am are was were be been do does did has have had can may will must not no yes all any each few " +
      "how why who what when where here there this that these those it its we us our you your my me he she " +
      "him her his they them their i if then than too very just only also more most less much many some " +
      "new now old get got go see use used one two six ten own via per log sign home help about " +
      "join read view find shop sale menu next back page last open free gift news blog team work " +
      "fees fee pay paid form step user name date time year day days week site book call mail info " +
      "like make take give keep show list main data file done edit save send stop start end plan care"
    ).split(" "),
  );
  let dictionary = null;

  function learnCasing() {
    const counts = new Map();
    const text = `${document.title} ${document.body ? document.body.textContent : ""}`.slice(0, 400000);
    for (const w of text.match(WORD) || []) {
      if (isUpper(w) && w.length > 1) continue;
      const key = w.toLowerCase();
      const forms = counts.get(key) || new Map();
      forms.set(w, (forms.get(w) || 0) + 1);
      counts.set(key, forms);
    }
    dictionary = new Map();
    for (const [key, forms] of counts) {
      const best = [...forms].sort((a, b) => b[1] - a[1] || Number(a[0] !== key) - Number(b[0] !== key))[0][0];
      dictionary.set(key, best);
    }
  }

  function isShouting(text) {
    const letters = text.replace(/[^A-Za-z]/g, "");
    return letters.length >= 4 && isUpper(letters);
  }

  function fixCase(text) {
    if (!isShouting(text)) return text;
    let first = true;
    return text.replace(WORD, (w) => {
      const key = w.toLowerCase();
      let form =
        (dictionary && dictionary.get(key)) ||
        (COMMON.has(key) || w.replace(/[^A-Za-z]/g, "").length > 4 ? key : w);
      if (first) {
        first = false;
        if (form === form.toLowerCase()) form = form[0].toUpperCase() + form.slice(1);
      }
      return form;
    });
  }

  function recaseText(node) {
    const t = node.nodeValue;
    if (t && t.length <= 240 && /[A-Z]{2}/.test(t)) {
      const fixed = fixCase(t);
      if (fixed !== t) node.nodeValue = fixed;
    }
  }

  function recaseWithin(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentElement;
      if (p && !SKIP_TEXT.has(p.tagName)) recaseText(n);
    }
    // Shouted button labels and placeholders too.
    for (const input of el.querySelectorAll?.("input[type=submit], input[type=button], input[placeholder], textarea[placeholder]") || []) {
      if ((input.type === "submit" || input.type === "button") && input.value) input.value = fixCase(input.value);
      if (input.placeholder) input.placeholder = fixCase(input.placeholder);
    }
  }

  /* --------------------------------------------------------------------------
   * Classification
   * ------------------------------------------------------------------------ */

  const IGNORE = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "HEAD", "TITLE", "BR", "WBR", "BASE", "PARAM", "SOURCE", "TRACK"]);
  const SKIP_TEXT = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "KBD", "SAMP", "TITLE"]);
  const MEDIA = new Set(["IMG", "PICTURE", "VIDEO", "CANVAS", "SVG", "IFRAME", "OBJECT", "EMBED", "AUDIO", "MAP", "MATH"]);
  const HEADINGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

  const vw = () => window.innerWidth || html.clientWidth || 1;
  const vh = () => window.innerHeight || html.clientHeight || 1;

  function hasDirectText(el) {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }

  function interactive(el, cs) {
    const t = el.tagName;
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
    el.tagName === "DIALOG" ||
    el.getAttribute("role") === "dialog" ||
    el.getAttribute("role") === "alertdialog" ||
    el.getAttribute("aria-modal") === "true" ||
    /(^|\s)(modal-content|modal-box|modal__content|popup-content|dialog-content|swal2-popup|ui-dialog)(\s|$)/i.test(el.className?.baseVal ?? el.className ?? "");

  /**
   * Decides an element's role. `parent` is the context inherited from above:
   * { media, ink, bar, dialog, box } flags.
   */
  function classify(el, parent) {
    const tag = el.tagName;
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
      (prev && prev.tagName === "INPUT" && /^(checkbox|radio)$/.test(prev.type) && el.children.length <= 2 && el.textContent.trim().length < 3)
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
    const cls = el.className?.baseVal ?? el.className ?? "";
    const area = rect.width * rect.height;
    const fs = parseFloat(cs.fontSize) || 16;
    const text = hasDirectText(el);

    if (cs.textTransform === "uppercase" || cs.fontVariantCaps === "small-caps" || cs.fontVariantCaps === "all-small-caps") set.caps = "";

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
    if (/(^|[\s_-])(backdrop|overlay|scrim)([\s_-]|$)/i.test(el.className?.baseVal ?? el.className ?? "") && fixedish && coversViewport) {
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
      el.children.length > 0
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
      if (rect.width >= 120 && rect.height >= 56 && el.children.length > 0) {
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

  const ROOT_CTX = { media: false, ink: false, bar: false, dialog: false, box: false, paint: WHITE };

  function ctxString(c) {
    return ["media", "ink", "bar", "dialog", "dark"].filter((k) => c[k]).join(" ");
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
      if (node.nodeType !== 1 || IGNORE.has(node.tagName)) continue;
      if (node.hasAttribute("data-nis") && node !== el) continue;
      if (node.id === "nis-root-marker") continue;

      // Web components often watch their own attributes; never write to the host
      // element itself, just walk into its content (and open shadow root).
      if (node.tagName.includes("-")) {
        const kids = node.children;
        for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i], pc]);
        if (node.shadowRoot) tagShadow(node.shadowRoot, pc);
        continue;
      }

      // Hidden now (closed menus, pop-ups): decide when it's shown.
      if (!rendered(node) && node !== document.body) {
        node.setAttribute("data-nis-pending", "");
        continue;
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

      if (result.walk) {
        const kids = target.children;
        for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i], c]);
        if (target.shadowRoot) tagShadow(target.shadowRoot, c);
      }
    }
    return true;
  }

  // Open shadow roots (web components) get the stylesheet adopted and their content tagged.
  let shadowSheet = null;
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
      shadowSheet = new CSSStyleSheet();
      shadowSheet.replaceSync(scoped);
      for (const root of shadowRoots) adopt(root);
    })
    .catch(() => {});

  function adopt(root) {
    if (shadowSheet && !root.adoptedStyleSheets.includes(shadowSheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, shadowSheet];
    }
  }

  function tagShadow(root, c) {
    if (root.__nis) return;
    root.__nis = true;
    shadowRoots.add(root);
    adopt(root);
    for (const child of root.children) tag(child, c);
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

  function flush() {
    scheduled = false;
    if (!initialDone) return;
    observer.disconnect();
    try {
      for (const el of added) {
        if (!el.isConnected || el.hasAttribute("data-nis")) continue;
        const c = parseCtx(el);
        if (c === null) {
          el.setAttribute("data-nis-pending", "");
          continue;
        }
        tag(el, c);
        recaseWithin(el);
      }
      for (const el of changed) {
        if (!el.isConnected) continue;
        const candidates = el.hasAttribute("data-nis-pending") ? [el] : [];
        candidates.push(...el.querySelectorAll("[data-nis-pending]"));
        for (const p of candidates) {
          if (!p.isConnected || !p.hasAttribute("data-nis-pending") || !rendered(p)) continue;
          // Opening animations (fades, colour transitions): read the settled state.
          const moving = p.getAnimations ? p.getAnimations({ subtree: true }).filter((a) => a.playState === "running") : [];
          if (moving.length) {
            Promise.allSettled(moving.map((a) => a.finished)).then(() => {
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
      for (const t of texts) if (t.isConnected && t.parentElement && !SKIP_TEXT.has(t.parentElement.tagName)) recaseText(t);
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
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "childList") {
        for (const n of r.addedNodes) {
          if (n.nodeType === 1) added.add(n);
          else if (n.nodeType === 3) texts.add(n);
        }
      } else if (r.type === "characterData") texts.add(r.target);
      else if (r.target.nodeType === 1) changed.add(r.target);
    }
    schedule();
  });
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
    learnCasing();
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
      observer.disconnect();
      const done = runStack(stack, document.body, performance.now() + 12);
      reconnect();
      if (!done) return yieldThen(slice);
      observer.disconnect();
      recaseWithin(document.body);
      if (document.title && isShouting(document.title)) document.title = fixCase(document.title);
      reconnect();
      html.setAttribute("data-nis-ms", String(Math.round(performance.now() - t0)));
      html.classList.add("nis-ready");
      initialDone = true;
      schedule();
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
    // Late layout (fonts, lazy content) can reveal elements that were hidden at first.
    setTimeout(() => {
      changed.add(document.body);
      schedule();
    }, 1200);
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
