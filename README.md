# Clarity — a calmer web

A Manifest V3 browser extension that redesigns one real page in place: https://httpbin.org/forms/post. Uses locally bundled **Inter**, a responsive form layout, larger option targets, numbered sections, time guidance and accessible inline validation messages.

This is a deterministic, site-specific prototype. It inspects the current URL, form structure, controls and native validity locally. It is not an AI or general-purpose website redesign engine.

## Try it

Clarity was loaded unpacked into Dia during development. Open https://httpbin.org/forms/post, choose **Extensions → Clarity — a calmer web**, then **Redesign this page**. The page’s **Original / Redesigned** controls switch views without clearing entries. **×** fully removes the enhancement. Refreshing starts with the original page again.

For a new Chromium browser installation:

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select this project's `extension` directory (the directory containing `manifest.json`).
3. Open the test website and click Clarity in the extension menu.

No build or dependency installation is required. Chrome/Edge should support the same Manifest V3 APIs; the installed extension was exercised in Dia. Firefox and Safari packaging are not included.

## Local preview and tests

Requires Node 22 or newer. No npm dependencies.

```sh
npm start
npm test
npm run package
```

- http://localhost:4173/forms/post — a saved copy of the actual website's form, enhanced by the same engine and adapter; its POST goes to the local test server.
- http://localhost:4173/tests — click **Run compatibility tests** for real browser assertions, including native submission.
- `dist/clarity-extension.zip` — extract and load unpacked; no server is required for the installed extension.

The preview is an explicitly labeled local fixture, not a proxy for the website. Only the installed extension operates on the original live website.

## Preserving functionality

The extension never clones, reparents or replaces existing controls. Form action, method, field names, values, required status, file inputs and website listeners stay intact. It adds headings, hints, error elements and scoped CSS. Errors use native ValidityState; the browser keeps its original validation and submission behavior. No submit handler is installed by Clarity. A MutationObserver handles inserted and removed controls inside the supported form. Attribute rollback respects subsequent site changes.

The original view removes all page enhancement styles, added content and owned attributes; only the small view toolbar remains. Closing the toolbar removes that too. State is per-document, never persisted.

## Privacy

No AI calls, analytics, remote fonts, cookies, storage APIs or external data-processing service. The extension does not serialize or store entered form values. The popup fetches only its packaged CSS/font resources. Validity and error messages are evaluated in the browser. Native form submission still sends entries to the original site's `/post` endpoint when the user submits; httpbin echoes the test data. Use synthetic data on this public demo.

Permissions are only `activeTab` and `scripting`. There are no all-site host permissions, background service workers or automatic content scripts. The popup additionally restricts activation to the exact HTTPS httpbin form URL. Permission background: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab

If AI is introduced later, it must be opt-in and disclose the exact outgoing payload before a request. Prefer a minimal structural schema (tag/type/label/layout); exclude values, hidden tokens, uploaded files, full HTML, cookies and private text. This version sends nothing to AI.

## Structure and extending support

- `extension/core.js`: reversible enhancement lifecycle, toolbar and local validity feedback.
- `extension/adapters/httpbin.js`: URL/structure validation and site-specific presentation additions.
- `extension/redesign.css`: scoped page design.
- `extension/font.css`: bundled Inter variable font as an embedded data resource; license included.
- `extension/popup.*`: user-triggered activation and unsupported-page feedback.
- `tests/`: captured form, native browser compatibility suite, popup boundary tests and local server tests.
- `docs/AUDIT.md`: inspection, proposed improvements and scope.
- `TESTING.md`: observed verification and limitations.

Add future sites as explicit adapters, with exact URL checks, independent style scopes and fixtures covering that site's semantics. Update the popup routing only after testing the adapter. Do not treat generic DOM preservation as proof of compatibility with frameworks, iframe forms, Shadow DOM or entire form replacement.

## Previous project

The earlier portfolio implementation was removed from the active workspace. A complete recoverable archive is at `../pivot-backups/dead-internet-society-before-extension-20261027.tar.gz`. Nothing was deployed or published.

## Design directions

- `/` and `/forms/post`: Light neutral design, Inter typography, subtle gray borders, and original Tailwind component compositions.
- `/1`: Light neutral editorial design with **LT Superior Serif Regular + Inter Display Regular/Medium**. Both font families are bundled locally; no font CDN requests.

Both previews use the same native form and reversible engine. The installed extension defaults to the Tailwind direction. The editorial direction is currently available through `/1` in the local preview.

`styles/redesign.css` is the editable source, using real Tailwind v4.3.3 `@apply` component compositions. `extension/redesign.css` is the compiled, committed runtime CSS. Preflight is deliberately omitted to avoid resetting the host page. This does not include paid Tailwind Plus components.

To rebuild CSS, obtain the official standalone Tailwind v4.3.3 CLI for your platform from https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.3, place it at `.tools/tailwindcss`, make it executable, then run `npm run build:css`. Running the extension or preview needs no CLI. `npm run build:fonts` regenerates the embedded editorial fonts from `assets/fonts/`. Font licenses are included in the extension package.

References: https://tailwindcss.com/ and https://danielsun.space/. Only typography and broad layout inform these versions. Both use a simple neutral palette with no reference-specific gradients, grids, accent colors, or raised-button styling. No personal content or site artwork was copied.

### Current content rule

The latest revision preserves only the original website's visible form copy. No added page heading, section descriptions, numbered steps, status badges, delivery hints, demo notices or preview footer. The sole added page controls are Original/Redesigned and close. Inline error text comes directly from the browser's native `validationMessage`. Both versions share the same neutral light palette and spacing scale; `/1` uses the serif font for the existing fieldset legends. Earlier audit proposals describe the initial version and are superseded by this rule.
