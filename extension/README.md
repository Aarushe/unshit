# New Internet Society — Redesign (browser extension)

One click restyles the site you're on in the New Internet Society design:
LT Superior Serif headings, Inter Display text, a near-monochrome palette,
pill buttons, framed pop-ups and clean fields. Titles are never shown in all
caps.

The page itself keeps running. Forms submit, menus open, pop-ups pop, logins
and payments work, because nothing is rebuilt; only how it looks changes.

## Install

**Chrome, Edge, Brave, Opera, Vivaldi, Arc** (Chromium 111+)

1. Open `chrome://extensions` (Edge: `edge://extensions`, Opera: `opera://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose this `extension` folder.
4. Pin it: click the puzzle-piece icon in the toolbar and pin **Redesign**.

**Firefox** (128+)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and choose `extension/manifest.json`.
3. The first time you click the icon on a site, Firefox may ask to allow
   access to it; allow it.

Temporary add-ons are removed when Firefox quits; for a permanent install,
sign it with `web-ext sign` (or through addons.mozilla.org).

**Safari** (17+, macOS)

```bash
xcrun safari-web-extension-converter extension --app-name "Redesign" --macos-only
```

Build and run the generated Xcode project once, then turn the extension on in
Safari → Settings → Extensions, and allow it on the sites you use it on.

## Use

- **Click the icon** (or press **Alt+Shift+R**) on any website. The page
  redesigns instantly, without a reload.
- It stays on for that site: every page, form submission and redirect on the
  same site loads already redesigned. The icon shows **on**.
- **Click again** to turn it off for that site; the page reloads as the original.

## How it works

- `content.js` reads each element once, in the page's own styles, and gives it
  a role: button, field, card, pop-up, backdrop, menu, header bar, section,
  callout, and so on. `redesign.css` gives each role the design.
- Elements that are hidden when the page loads (closed menus, pop-ups,
  dropdowns, accordions) are read when they're opened, after any opening
  animation, so they're redesigned in their open state.
- New content (infinite scroll, single-page app navigation, pop-ups built on
  the fly) is redesigned as it appears.
- Dark areas (headers, footers, dark panels) stay dark, in ink, so logos and
  icons drawn for them stay visible. Light and coloured areas become white.
- Maps, photos, videos, illustrations, dark code panels and custom
  checkbox/switch drawings are left as they are.
- Shouted text is rewritten in sentence case, spelling each word the way the
  page spells it elsewhere, so acronyms (FAQ, ETA, NASA) and brand names
  (e-Visa, iPhone) survive. This works in every cased script (Latin, Greek,
  Cyrillic, Armenian…) and follows each language's rules (Turkish İ/ı, Greek
  final sigma, accents dropped in capitals: ΑΘΗΝΑ → Αθήνα, ETE → été).
  Text set in capitals by CSS loses the capitals and keeps a capital first
  letter; Title Case styling is kept.
- Text that has to stay exactly as written is never rewritten: code (including
  monospace code views built from divs and tables), editors and other editable
  areas, dropdown options and named submit buttons (their text is sent with the
  form), abbreviations, and anything marked `translate="no"`.
- Every language and direction: right-to-left pages keep their layout, and
  scripts that join or stack letters (Arabic, Hebrew, Hindi, Thai…) and CJK
  aren't letter-spaced and get room for their marks. Glyphs our fonts don't
  have come from the system's fonts for that script.
- Works whatever the site is built with — server-rendered pages, React, Vue,
  Svelte, Angular, web components (open and closed shadow roots, including ones
  defined late), XHTML. Casing waits until the page has loaded and settled so
  frameworks hydrating server-rendered HTML find the text they sent.

## Known limits

- Layout is kept as the site built it; the redesign changes typography,
  colour, surfaces and controls, not the arrangement of the page.
- Content inside cross-site iframes (embedded payment widgets, ads, some
  login boxes) is a different site; it's redesigned only if it's on too.
- Browser-native dialogs (`alert`, `confirm`, file pickers) can't be styled.
- Browsers' own pages (`chrome://…`, `about:…`, the extension stores) and
  PDFs don't allow extensions.

The fonts in `fonts/` are your licensed copies of LT Superior Serif and Inter
Display, bundled for your own use.
