# Indian e-Visa compatibility check

Checked 27 October 2026: https://indianvisaonline.gov.in/evisa/

## Result

**Unsupported by the current prototype. No redesign was applied.** The popup permits only `https://httpbin.org/forms/post`, and the engine assumes that page's single form. Added the e-Visa landing and registration URLs to the unsupported-page regression cases. All 9 Node tests pass. These are activation-boundary checks, not proof of e-Visa compatibility.

## Live observations

- The landing page has navigation, moving notices, helpdesk content, application-process steps, category panels, Bootstrap modal dialogs and separate application/payment/status links. It is not the single-form structure supported by the prototype.
- The FAQ modal opens and closes successfully on the original site.
- Direct navigation to `/evisa/Registration` initially redirected to `/evisa/tvoa.html`. Following the original landing-page application link subsequently opened the registration page successfully. Preserve the original navigation and session flow.
- The first application screen contains nationality, passport type, arrival port, birth date, email/re-enter email, arrival date, CAPTCHA, a declaration checkbox and Continue.
- A native automation attempt to focus the birth-date input failed. Date-picker behavior has not been verified.
- No form values were entered, CAPTCHA solved, declaration accepted, files uploaded, payments attempted or application submitted. Later pages, validation and conditional fields remain untested.

## Usability issues observed

The landing page uses competing saturated colors and tightly packed content. At the observed narrow desktop viewport, information and helpdesk blocks precede the process and application links, producing a long route to the main task. The layout needs clearer spacing, typography and action hierarchy. Public copy and advisory text must remain unchanged.

## Work required for support

Create separate landing-page and registration-page adapters, scoped to verified URLs and structures. Keep original elements, scripts, navigation, modals, hidden fields, declarations, CAPTCHA and submission targets intact. Only adjust layout, spacing, typography and existing label associations. Use a read-only/local fixture to test dynamic behavior before enabling the adapter. The existing httpbin adapter cannot simply be enabled for this domain.
