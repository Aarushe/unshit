# First-site audit — httpbin form

Inspected 27 October 2026 before implementation, using the live rendered page and its HTML: https://httpbin.org/forms/post. A byte-for-byte HTML capture is retained in `tests/fixtures/httpbin.html`.

## Observed problems and proposed changes

| Observed original behavior | Implemented improvement |
| --- | --- |
| No page heading or explanation | Page title, short introduction and visible demo/submission explanation |
| Default serif type with small controls | Locally bundled Inter, consistent type scale, 44px text controls |
| Labels and controls have inconsistent widths and inline alignment | Labels above full-width fields; phone/email share a row only on wide screens |
| Large full-width fieldsets contain tiny isolated radio/checkbox targets | Compact, wrapping option cards retaining the original input and label associations |
| Contact, customization and delivery sections have little hierarchy | Numbered section headings, separators and explanatory text |
| Delivery min/max/step exist only as input attributes | Visible 11:00–21:00 and 15-minute guidance associated with the original control |
| Validation feedback appears only in the native browser popup | Supplementary inline, associated error text on blur or native invalid events, cleared after correction |
| Submit result is not explained | Explanation that this is an echo demo and submission navigates to the site's response |
| Original HTML lacks a viewport declaration | Add a reversible viewport meta tag if absent; layout checked at 375px |

The original has 13 native controls (12 data controls and a submit button), two fieldsets, one form, no custom JavaScript, no uploads and no conditional sections. It does not mark fields required. The extension must not invent business requirements or convert this form to a multi-step wizard. Existing labels are already programmatically associated; retain them.

This target is deliberately a public demonstration form, not a production checkout. It demonstrates live-site DOM preservation without placing real orders. It cannot prove compatibility with complex production forms. Upload and conditional-field checks use explicitly added local test fixtures.

## Design decision

Apply scoped styling and additive assistance to the real document; never create a duplicate form or submit through a replacement API. The original node identity is the compatibility boundary. Keep all form actions, names, types, validation attributes, event listeners, radio grouping and input state untouched. A local adapter refuses unexpected structure before enhancement. Toggle off restores the original presentation without reloading.

## Future adapter contract

Each adapter supplies a stable id, exact URL matching, structural validation and reversible additions through the engine's tracked `add` function. A new website needs its own CSS scope, original markup snapshot, interaction tests and explicit privacy review of any optional AI processing. Full SPA form replacement, cross-origin iframes and Shadow DOM forms need separate lifecycle handling before being supported.
