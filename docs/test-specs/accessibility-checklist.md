# Accessibility Checklist

## Purpose

Provide a concise checklist of accessibility requirements that must be met across OLUSO.  This checklist guides both automated and manual testing to ensure the application is usable by people with disabilities and meets WCAG 2.1 AA standards.

## Checklist

1. **Keyboard Navigation**
   * All interactive elements (buttons, links, form fields, dialogs, menus) are reachable and operable via keyboard alone (Tab, Shift+Tab, Enter, Space, Arrow keys).
   * Focus order is logical and follows the visual layout.
   * Focus indicators are visible and clear.

2. **Focus Management**
   * When modals or dialogs open, focus moves to the dialog and is trapped until closed.
   * When a dialog closes, focus returns to the element that triggered it.
   * Skip links are provided for users to bypass repetitive navigation (optional but recommended).

3. **Semantic HTML & ARIA**
   * Use semantic elements (`<nav>`, `<main>`, `<header>`, `<table>`, etc.) where appropriate.
   * Use ARIA roles and properties only when necessary to enhance semantics (e.g. `role="status"`, `aria‑expanded`).  Avoid overuse.
   * Provide `aria-labels` or `aria-labelledby` for icons or buttons without visible labels.

4. **Labels & Instructions**
   * Form inputs have associated `<label>` elements.  Required fields are indicated in both visual and programmatic ways.
   * Error messages are linked to inputs via `aria-describedby` and announced using `role="alert"` or `aria-live`.

5. **Colour & Contrast**
   * Text and icons meet contrast ratios (4.5:1 for normal text; 3:1 for large text).  Use an accessible colour palette.
   * Colours are not the sole means of conveying information.  Use text labels or patterns for status chips and charts.

6. **Resize & Responsiveness**
   * The layout works at 200% zoom without clipping content or overlapping elements.
   * Controls remain usable on small window sizes and large text settings.

7. **Language & Readability**
   * The root HTML element includes `lang="en"` (or the user’s locale).  All text is written clearly and concisely.
   * Avoid jargon and provide explanations for domain‑specific terms via tooltips or help text.

8. **Error Prevention & Recovery**
   * Confirmation dialogs appear before destructive actions (archive, delete).
   * Forms prevent invalid submissions and provide clear instructions for correction.

9. **Announcements & Live Regions**
   * Loading indicators set `aria-busy` on relevant containers.
   * Toast notifications use `role="status"` or `role="alert"` and are automatically dismissed after a reasonable time.

10. **Screen Reader Testing**
   * Perform manual testing with screen reader software (NVDA, VoiceOver) to ensure all content is reachable and understandable.
   * Ensure that dynamic content updates are announced appropriately.

## Acceptance Criteria

* The application passes automated accessibility checks (axe‑core) with no critical issues.
* Manual testing confirms that the checklist items are satisfied across key pages and workflows.
* Accessibility defects are logged, prioritised and resolved before release.