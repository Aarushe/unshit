# New Internet Society — Redesign (browser extension)

One click rebuilds the site you're on in the New Internet Society design.

The page is read for what it is (who the site is, where you can go, what it
wants you to know, what you came to do, its sections of content and its small
print) and laid out again from one set of building blocks: header with menus,
notices, hero, action tiles, steps, cards, topic grids, link lists and feeds,
forms, tables, contacts, questions, logos and footer, in hairline rails with
tinted frames, white panels, mono file bars, hatched stages and LT Superior
Serif headings. Floating widgets (chat bubbles, cookie bars, promos) are left
out. Titles are never shown in all caps.

The page itself keeps working. Its form fields, captchas and buttons are its
own live elements moved into the new layout, links and buttons act through the
page's own elements, and pop-ups it opens are shown above the redesign.

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

- `compose.js` reads the page with rules every website follows: landmarks
  (`header`, `nav`, `main`, `footer`), headings and drawn boxes mark sections,
  repeated siblings are collections whose shape decides the block (task tiles,
  steps, cards, topics, link lists, logos, contacts), forms are labelled
  controls, and anything floating over the page is a widget. Sections are
  ordered with the page's main task first, then its content, then utilities
  (link lists, contacts), side by side. The blocks render in `compose.css`.
- It only composes when the result carries the page's text (it checks how much
  of the readable text made it in). Web apps (editors, maps, canvases, dense
  control panels), and pages it can't read fully, are restyled in place
  instead by `content.js` and `redesign.css`, as below.
- The original page stays loaded underneath, hidden. When it changes (single
  page apps, content loading in, a form step), it's read again and the layout
  updates; never while you're typing in it. "original ↗" in the footer shows
  the page as the site built it.

Restyling (the fallback):

- `content.js` reads each element once, in the page's own styles, and gives it
  a role: button, field, card, pop-up, backdrop, menu, header bar, section,
  callout, and so on. `redesign.css` gives each role the design.
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

- Composition takes the content and order the page has; it doesn't invent
  content, and section labels it has to add are generic ("Links", "Start here").
- Content inside cross-site iframes (embedded payment widgets, ads, some
  login boxes) is a different site; it's left out of the composed page and
  redesigned only if that site is on too.
- Pictures drawn in HTML that the page doesn't mark as decoration
  (`aria-hidden`) can come through as content.
- Browser-native dialogs (`alert`, `confirm`, file pickers) can't be styled.
- Browsers' own pages (`chrome://…`, `about:…`, the extension stores) and
  PDFs don't allow extensions.

The fonts in `fonts/` are your licensed copies of LT Superior Serif and Inter
Display, bundled for your own use.
