# Verification — 27 October 2026

## Automated Node checks

`npm test`: **9 passed, 0 failed**.

Covers exact-page activation, rejection of spoofed/unsupported/restricted URLs, injection target and file list, error messaging, minimal Manifest V3 permissions, preview wiring, real local POST handling with repeated field names, Host rejection, source-file access restrictions, and a static check for outbound/storage APIs in the form engine and adapter. Popup tests mock Chrome APIs; they do not substitute for the installed-extension check below.

## Real browser compatibility suite

`npm start`, then http://localhost:4173/tests → Run compatibility tests.

Observed in the in-app browser: **16 passed, 0 failed**.

1. Exact live URL accepted; lookalike URLs and changed structure rejected.
2. Original control identity and FormData preserved.
3. Existing input listener still executes.
4. Ten original/redesigned cycles restore exact form markup and preserve values.
5. Invalid email gets associated inline feedback; correction clears it.
6. Native time bounds and quarter-hour step remain enforced.
7. Original radio/checkbox labels remain clickable.
8. Locally added conditional field retains site-owned visibility, delegated events, required validation and entered value.
9. Locally added file input retains the same node, selected synthetic file and FormData file payload through toggles.
10. Native invalid submission is blocked before submit listeners; valid submission reaches them.
11. Original form performs a real POST into a local iframe and receives expected names/values from the local endpoint.
12. Native reset clears input values and inline feedback.
13. Later site-owned attribute changes survive rollback.
14. Bundled Inter font loads through FontFaceSet.
15. A 375px iframe has no horizontal overflow and keeps text controls at least 44px high.
16. Closing Clarity removes toolbar, styles, hints, errors and added page elements, restoring original form markup.

The upload test verifies file selection and FormData preservation, not a multipart upload to httpbin. The chosen live website has neither uploads nor conditional fields.

## Installed extension on the live website

Loaded `extension/` unpacked in Dia (Chromium). Observed the extension listed and enabled, with no load error. Opened https://httpbin.org/forms/post, invoked the actual extension popup and activated redesign. The popup confirmed success, and the actual website displayed the toolbar, Inter design, section headings and original controls.

Using synthetic data only: entered “Prototype Tester”, selected Medium and Extra Cheese, entered an invalid email, and clicked Submit order. Native validation blocked submission and the added associated inline email error appeared. Corrected it to `test@example.com`, toggled Original and Redesigned, and confirmed entered values remained visible.

**Not completed:** the final live POST check was interrupted by a user browser state change before submission could be confirmed. The local real-POST test passed. Do not report live httpbin submission as verified. The extension stays loaded in Dia; the live form remains available for manual testing.

## Visual inspection and limits

Desktop preview visually inspected with Inter; screenshot in `docs/screenshots/redesigned.png`. Native controls, focus outlines and field grouping are retained. Narrow layout is asserted at 375px. No full screen-reader or cross-browser certification has been performed. The extension is intentionally limited to the single supported form; support for SPA form replacement, cross-origin frames and other websites is not claimed.

## Design revision — Tailwind and /1

After the design changes, Node checks passed again: 9/9. The full browser suite passed in both directions: 16/16 at `/tests` and 16/16 at `/tests?theme=editorial`. Each run checks the relevant 375px layout. The editorial run also loads and checks LT Superior Serif and Inter Display. Both desktop designs were visually inspected and captured in `docs/screenshots/tailwind.png` and `docs/screenshots/editorial.png`.

The revised extension package was rebuilt. Its new visual design has been checked in the shared local engine; Dia's already-loaded unpacked extension needs Reload in its extensions manager and a page refresh to pick up these changes. This revision did not repeat the live-site submission check.

## Neutral light revision

Both `/` and `/1` were visually checked after switching to a shared white/light-gray palette. Removed the reference-specific grid, glow, accent colors, decorative logo and raised buttons. Typography remains Inter for the main version and LT Superior Serif + Inter Display for `/1`. Only presentation and introductory copy changed; form behavior was not modified. Extension CSS and ZIP were rebuilt. Screenshots: `sans-light.png` and `editorial-light.png`.

## Original-content revision

Removed all invented page copy and numbered sections. Native labels, legends, options and submit text remain. Inline validation mirrors native browser messages. Spacing now uses 8px label gaps, 24px field gaps and 32px panel padding, with a 720px maximum form width. Node checks passed 9/9. Both layouts visually inspected; screenshots saved as `sans-light.png` and `editorial-light.png`.
