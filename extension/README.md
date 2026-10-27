# New Internet Society — Redesign (browser extension)

One click restyles the site you're on in the New Internet Society design:
LT Superior Serif headings, Inter Display text, a near-monochrome palette,
pill buttons, framed pop-ups and clean fields. Titles are never shown in all
caps.

The page itself keeps running. Forms submit, menus open, pop-ups pop, logins
and payments work, because nothing is rebuilt; only how it looks changes.

## Install (Chrome, Edge, Brave, Arc — developer mode)

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose this `extension` folder.
4. Pin it: click the puzzle-piece icon in the toolbar and pin **Redesign**.

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
  (e-Visa, iPhone) survive.

## Known limits

- Layout is kept as the site built it; the redesign changes typography,
  colour, surfaces and controls, not the arrangement of the page.
- Content inside cross-site iframes (embedded payment widgets, ads, some
  login boxes) and closed shadow DOM can't be reached.
- Browser-native dialogs (`alert`, `confirm`, file pickers) can't be styled.
- Chrome's own pages (`chrome://…`, the Web Store) don't allow extensions.

The fonts in `fonts/` are your licensed copies of LT Superior Serif and Inter
Display, bundled for your own use.
