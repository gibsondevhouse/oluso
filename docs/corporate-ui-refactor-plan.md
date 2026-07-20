# ADAMA HSE Corporate Glass and Motion Refactor Plan

Status: Foundation implemented; staged migration planned  
Applies to: Oluso SvelteKit SPA/PWA shell and shared workspace components  
Data boundary: No persistence, repository, migration, or IndexedDB contract changes

## Product intent

The visual system should reinforce ADAMA HSE as a calm professional operations console: dense,
traceable, explicit about uncertainty, and fast under routine keyboard-heavy use. Glass is a shell
layering device, not a content treatment. Registers, forms, evidence, safety records, and printable
review material remain opaque.

## Stack decision

Oluso does not currently use Tailwind. Introducing a dormant `tailwind.config.js` would not generate
utilities and would add a second styling system. The Tailwind concepts are implemented as semantic
CSS tokens and reusable classes in `src/app.css`, which is already the governing token layer.

Shared utilities:

- `corporate-glass-surface`: light shell chrome.
- `corporate-glass-dark`: dark navigation and overlay anchors.
- `corporate-dialog-surface`: focused overlay surface.
- `corporate-dialog-backdrop`: contextual modal scrim.
- `backdrop-blur-xs`: 8px blur for scrims.
- `backdrop-blur-corporate`: 16px blur for shell and overlays.

## Phase 1 — Design tokens and core utilities

### Implemented

- [x] Add semantic glass surfaces, borders, blur levels, inner borders, and corporate shadows.
- [x] Keep compatibility `--glass-*` aliases solid so existing data canvases do not become translucent.
- [x] Add opaque fallback colors when `backdrop-filter` is unavailable.
- [x] Disable glass filters and shadows for print.
- [x] Add thin, low-contrast scrollbars to main workspaces, navigation, tabs, command results, and tables.
- [x] Add reduced-motion-aware Svelte transition helpers in `src/lib/transitions.ts`.

### Exit gates

- Token names are semantic and no component introduces one-off blur values.
- Text contrast remains WCAG AA over every glass surface.
- Forced-colors and print output remain intelligible.
- Data tables and form fields stay fully opaque.

## Phase 2 — Global shell and overlay refactor

### Implemented

- [x] Apply a light 16px glass layer to the fixed command header.
- [x] Apply the same layer to the global Organization / Country / Site / Location / Function scope bar.
- [x] Apply a dark 16px glass layer to the fixed navigation spine.
- [x] Apply focused glass surfaces and fast entrance/exit motion to the command palette.
- [x] Apply the shared overlay treatment to confirmation, lifecycle, destructive-action, and backup restore dialogs.
- [x] Add a 100ms scale confirmation to local save-state icon changes.

### Remaining work

- [ ] Consolidate the three confirmation-dialog implementations behind one accessible dialog primitive.
- [ ] Add focus trapping and trigger-focus restoration to that primitive before removing legacy dialogs.
- [ ] Add a read-first slide-over primitive for related records and SDS context; keep editing and destructive actions in full workspaces.
- [ ] Route storage failure, quota risk, backup age, and exchange-conflict status into a narrow global diagnostic region.

### Exit gates

- Only the header, scope bar, sidebar, command palette, dialog, and read-first drawer layers may use blur.
- No more than three full-area backdrop filters are visible at once.
- The main content region remains the sole shell scroll container.
- Escape, Tab, Shift+Tab, and focus restoration pass keyboard QA.

## Phase 3 — Dashboard and register restructuring

### Home operations portal

- [ ] Replace the vertical dashboard stack with three operational tabs: `Needs attention`, `My work`, and `Plant context`.
- [ ] Keep local data health visible outside those tabs because persistence trust is global, not a work queue.
- [ ] Preserve direct links from every count or status to its source record, missing step, or remediation route.
- [ ] Persist the selected dashboard tab as non-authoritative UI preference only.
- [ ] Do not introduce vanity charts or legal/compliance conclusions.

### Record workspaces

- [ ] Standardize Overview, Relationships, Evidence, History, and Actions tab contracts where the domain supports them.
- [ ] Keep tab panels opaque and apply only the 140ms content fade at the panel boundary.
- [ ] Preserve draft state before allowing a tab change from editable panels.
- [ ] Announce tab-panel changes to assistive technology without moving focus unexpectedly.

### Registers and forms

- [ ] Standardize a solid white register canvas, sticky opaque table header, and visible focus/selection state.
- [ ] Virtualize or paginate only after measuring real datasets; do not hide records behind decorative motion.
- [ ] Keep validation, evidence, uncertainty, review state, and archived dependencies visible in solid surfaces.
- [ ] Verify 200% zoom, print packets, long business IDs, and dense industrial-hygiene units.

### Exit gates

- Typical register interaction remains responsive in under 100ms.
- Home and register data derive from existing read models and repositories.
- No component writes directly to IndexedDB or creates revisions independently.
- Opaque content canvases meet WCAG AA and print without interactive chrome.

## Phase 4 — Motion integration and quality gates

### Motion contract

- Use opacity and transform only for routine transitions.
- Feedback scale: 100ms maximum.
- Tab/content fade: 140–150ms.
- Dialog/drawer fly: 160–200ms with 4px travel.
- No stagger on safety-critical lists, confirmation choices, or record tables.
- `prefers-reduced-motion: reduce` resolves shared transition duration to zero.
- Motion must never delay mutation, validation, persistence, or navigation logic.

### Migration sequence

1. Inventory remaining one-off transitions and backdrop filters.
2. Migrate command and modal surfaces to shared utilities.
3. Migrate `RecordWorkspace` tab consumers and test draft-state boundaries.
4. Introduce the Home operational tab read model without changing persistence schemas.
5. Consolidate dialog focus behavior.
6. Remove legacy glass and motion implementations only after every caller moves.

### Automated gates

- `npm run check`
- `npm test`
- `npm run build`
- `npm run verify:pwa`
- `git diff --check`

### Manual gates

- Chrome/PWA QA at laptop width and 200% zoom.
- Keyboard-only command palette, tabs, dialog, drawer, and register navigation.
- VoiceOver smoke test for active tabs, save feedback, and modal labels.
- Reduced-motion verification.
- Offline reload with existing IndexedDB records intact.
- Backup export/import and restore confirmation regression.
- Print review packet with all glass effects removed.

## Non-goals

- No IndexedDB schema, migration, repository, or exchange-protocol changes.
- No Tailwind adoption without a separate build-system decision.
- No translucent tables, forms, evidence blocks, or printable packets.
- No theatrical page transitions, parallax, animated counts, or long entrance staggers.
- No use of “sync” language for local writes or reviewed manual exchange.
