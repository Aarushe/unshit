# New Internet Society / Clarity

A local, reversible browser extension prototype for improving ordinary HTML pages. Version 0.2 replaces the installed extension's httpbin allowlist with a general structural engine. It can activate on HTTP/HTTPS pages without a site adapter.

It applies light neutral surfaces, bundled Inter, clearer heading scales, consistent native controls and spacing around existing form groups. It adds no website copy. Original / Redesigned and close are the only added page controls.

## Install

1. Open `chrome://extensions` in a Chromium browser and enable Developer mode.
2. Load this repository's `extension` directory unpacked. If already installed, reload the extension after pulling changes.
3. Visit an ordinary webpage and activate Clarity from its popup.

The engine works on original DOM nodes. It does not clone, reparent, or replace inputs, buttons, forms or website handlers. Original view removes enhancement styles and markers; close also removes the toolbar. Refreshing starts with the original page.

## Scope and limits

This is a general enhancement prototype, not a guarantee that every website can be redesigned safely. Browser-protected pages, PDF viewers and non-HTML documents are excluded. Cross-origin frames and closed shadow roots stay original. Open shadow roots and accessible same-origin frames are scanned. Editors, canvas, media, complex ARIA widgets and image-backed regions are deliberately left alone. Site JavaScript continues to own validation, conditional fields, navigation and submissions.

Structural and visibility changes trigger a debounced rescan. Large or unusual applications still need performance and compatibility testing. CSS changes can affect layout even when DOM identity is preserved. Use Original if a site's layout regresses. The e-Visa site is no longer rejected by URL, but its live application flow has **not** yet been validated with this new engine.

## Privacy

No AI, analytics, external fonts, storage or outbound requests from the enhancement engine. Form values and file contents are neither serialized nor transmitted by it. It inspects DOM structure and computed styles locally. The popup reads only packaged CSS/font resources. Original website scripts and submissions continue to communicate with their original services as before.

Permissions remain `activeTab` and `scripting`, granted temporarily when activated. No persistent all-site host permissions or automatic content scripts.

## Develop and verify

Requires Node 22+. No npm dependencies.

```sh
npm start
npm test
npm run package
```

- `/universal-tests`: click Run general engine tests for the new engine's browser checks.
- `/` and `/forms/post`: retained, site-specific httpbin design study using Inter.
- `/1`: retained editorial design study using bundled LT Superior Serif + Inter Display.
- `/tests`: browser checks for the older httpbin study.
- `dist/clarity-extension.zip`: packaged extension, ready to extract and load unpacked.

The two design studies still use the original adapter; they are not previews of universal coverage. Their Tailwind component CSS source is `styles/redesign.css`; generated output is committed. The general engine uses separately scoped CSS to avoid a global Tailwind reset of arbitrary host pages.

## Implementation

- `extension/universal.js`: local classification, document/shadow/frame traversal, mutation observation and rollback.
- `extension/universal.css`: scoped neutral presentation rules.
- `extension/popup.*`: user-activated general engine entry point.
- `extension/core.js`, `extension/adapters/httpbin.js`: retained original design study.
- `tests/universal-browser.js`: native browser preservation checks.

## Verified checkpoint (2026-10-27)

9 Node tests passed, including activation on unrelated URLs, restricted schemes, access failure handling and an outbound-API source check. 12 browser checks passed on a local mixed-content fixture: classification, open shadow roots, same-origin frames, node/value/file preservation, editor exclusion, hidden dialog preservation, native invalid-submit blocking, original submit listeners, dynamically inserted inputs, repeated toggles, 375px overflow and exact DOM restoration. These are fixture results, not proof of compatibility with every live application.

Earlier audits and TESTING.md document the original site-specific prototype. This README describes the current installed extension.
