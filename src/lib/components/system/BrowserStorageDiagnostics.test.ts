import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import BrowserStorageDiagnostics from "./BrowserStorageDiagnostics.svelte";

const healthy = {
  indexedDbAvailable: true,
  serviceWorkerSupported: true,
  storageEstimateSupported: true,
  persistenceRequestSupported: true,
  persisted: false,
  usageBytes: 1024,
  quotaBytes: 1024 * 1024,
  usageRatio: 1 / 1024,
  risk: "healthy" as const,
};

describe("BrowserStorageDiagnostics", () => {
  it("shows web persistence and offline readiness", async () => {
    render(BrowserStorageDiagnostics, { inspect: vi.fn(async () => healthy) });

    expect(await screen.findByText("Web Database Readiness")).toBeInTheDocument();
    expect(await screen.findAllByText("Available")).toHaveLength(1);
    expect(screen.getByText("Supported")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB of 1.0 MB")).toBeInTheDocument();
  });

  it("requests durable storage and reports the result", async () => {
    const inspect = vi
      .fn()
      .mockResolvedValueOnce(healthy)
      .mockResolvedValueOnce({ ...healthy, persisted: true });
    const requestPersistence = vi.fn(async () => true);
    render(BrowserStorageDiagnostics, { inspect, requestPersistence });

    await fireEvent.click(await screen.findByRole("button", { name: "Request durable storage" }));

    await waitFor(() => expect(requestPersistence).toHaveBeenCalledOnce());
    expect(await screen.findByText("The browser granted durable local storage.")).toBeInTheDocument();
  });

  it("makes an unavailable IndexedDB failure visible", async () => {
    render(BrowserStorageDiagnostics, {
      inspect: vi.fn(async () => ({
        ...healthy,
        indexedDbAvailable: false,
        persistenceRequestSupported: false,
      })),
    });

    expect(
      await screen.findByText(
        "IndexedDB is unavailable. ADAMA HSE cannot safely use this browser for operational data.",
      ),
    ).toBeInTheDocument();
  });
});
