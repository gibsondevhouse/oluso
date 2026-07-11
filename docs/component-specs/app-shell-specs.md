# App Shell Component Specs

## Purpose

The app shell defines the root layout for OLUSO.  It composes the side panel, header, and main content region into a cohesive frame.  Every page in the application is rendered within the app shell, which manages global concerns such as persistent navigation, responsive layout, and high‑level status surfaces (e.g. global loading indicators).

## Structure

The app shell consists of the following regions:

1. **Side Panel** — see `sidepanel-specs.md` for details.  Anchored to the left; may be collapsible.
2. **Header Bar** — a horizontal bar across the top of the main content area.  Contains the page header component when on content pages or the app name/logo on dashboard login.  May also host global actions such as user settings, sync status, and help links.
3. **Main Content Region** — the area where route content is rendered.  Pages are responsible for their own layouts within this region.
4. **Global Overlay Layer** — optional.  Provides a container for modal dialogs, toasts, or other overlay components that must appear above both the header and main content.

## Props / Data Contract

* `children` — the routed page content to render within the main content region.
* `collapsed: boolean` — passed down to the side panel to indicate its collapsed state.
* `onToggleCollapse: () => void` — callback invoked when the user toggles the side panel.  Allows the shell to persist collapsed state.
* `globalStatus?: ReactNode` — optional element displayed in the header bar to indicate application‑wide status (e.g. “Offline”, “Unsaved changes”).

## Layout Behavior

* The side panel has a fixed width when expanded and a narrower width when collapsed.  The main content region fills the remaining horizontal space.
* The header bar spans the width of the main content region and has a fixed height.  It may cast a subtle shadow to separate it from content.
* The app shell uses CSS flexbox to avoid scroll nesting.  Only the main content region scrolls; the header and side panel remain fixed.
* On very narrow window widths (e.g. < 800 px), the side panel may auto‑collapse to provide more space for content.

## Interaction Rules

* The toggle collapse button is located within the header bar and labelled appropriately (e.g. “Collapse navigation”).  When clicked, it calls `onToggleCollapse`.
* The app shell listens for global keyboard shortcuts (e.g. `Ctrl+\` to collapse/expand the side panel).  These shortcuts should not conflict with browser defaults.
* Any modal opened in the global overlay layer must trap focus and restore focus when closed.  The app shell provides the overlay container but does not own specific modals.

## Error & Empty States

The app shell itself does not load data.  If a routed page fails, that page is responsible for rendering its own error state within the main content region.  The app shell may optionally display a top‑level offline banner if the persistence layer detects a disk or permission error.

## Accessibility Rules

* The root element must set `lang` and `dir` attributes according to user locale.
* Landmarks (`role="navigation"`, `role="main"`, `role="banner"`) must be clearly defined for screen readers.
* Focus should not be trapped within the side panel; when collapsed, keyboard focus should move naturally to the main content.

## Acceptance Criteria

* The side panel, header bar, and content region are laid out correctly and adapt to collapsed state.
* Global shortcuts toggle the side panel and are announced to screen readers.
* The component uses ARIA landmarks to delineate navigation and main regions.
* Overflow scrolling occurs only within the main content region.