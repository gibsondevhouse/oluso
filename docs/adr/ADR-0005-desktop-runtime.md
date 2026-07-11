# ADR‑0005: Desktop Runtime

## Status

Proposed

## Context

OLUSO is designed as a local‑first desktop application rather than a web application.  We need to select a runtime that provides:

* A cross‑platform **application shell** capable of running on Windows, macOS and Linux.
* Integration with **native file system APIs** to read and write the SQLite database and user attachments.
* The ability to bundle **web‑based UI components** (we use HTML, CSS and JavaScript/TypeScript) without requiring a browser.

The runtime decision must be made before any app‑shell or UI work because it affects how we access local files, package the application and deliver updates.

## Decision

1. **Use Tauri as the desktop runtime.**  Tauri allows us to build our UI in a modern web stack while running in a lightweight Rust‑based host.  It is more resource‑efficient than Electron and exposes secure APIs for file system access.
2. **Bundle our front‑end as a single‑page application** served within the Tauri window.  Navigation will still be routed internally using the router defined in `09-routing.md`.
3. **Expose custom commands for persistence and system interactions** via Tauri’s command interface.  The persistence module (see ADR‑0004) will call these commands to open, query and write the SQLite database.  The UI will never access Node.js or OS APIs directly.
4. **Use platform conventions for application data directories**.  Tauri’s API provides the correct path for persistent data; our persistence module will use this path to store `oluso.db` and attachments.

## Consequences

* Choosing Tauri gives us a secure, low‑overhead runtime with Rust safety guarantees.  We avoid the large footprint of Electron.
* We must write a small Rust layer to expose the commands we need.  Developers unfamiliar with Rust will need guidelines and examples.
* Packaging and auto‑updating must follow Tauri’s distribution workflow.  This includes signing on macOS and code‑signing on Windows.
* If we later decide to support web or mobile, we may need to extract our UI into a framework‑agnostic library.  However, the Tauri choice does not prevent this since the UI remains a web app.

## Alternatives Considered

* **Electron** was considered but rejected due to its high memory and disk footprint and the need to bundle a full Chromium engine.
* **Native desktop frameworks** (Qt, .NET, Swift) would provide deeper system integration but require multiple codebases and would undermine our ability to reuse web skills.  Tauri strikes the right balance.

## Related ADRs

* ADR‑0001: Local‑First
* ADR‑0004: Persistence Stack — determines how the runtime will store data.