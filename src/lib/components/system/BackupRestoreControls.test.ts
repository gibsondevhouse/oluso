import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PersistedDatabase } from "$lib/persistence/local-persistence";
import BackupRestoreControls from "./BackupRestoreControls.svelte";

const database = {
  schemaVersion: 10,
  locations: [],
  findings: [],
  processes: [],
  equipment: [],
  chemicals: [],
  hazards: [],
  controls: [],
  riskAssessments: [],
  segs: [],
  correctiveActions: [],
  initializedAt: "2026-07-11T12:00:00.000Z",
  updatedAt: "2026-07-11T12:00:00.000Z",
} as unknown as PersistedDatabase;

function createApplication() {
  return {
    initialize: vi.fn(async () => database),
    exportDatabase: vi.fn(async () => database),
    importDatabase: vi.fn(async () => ({ database, importedCount: 2 })),
    restoreDatabase: vi.fn(async () => database),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BackupRestoreControls", () => {
  it("creates and downloads a database backup", async () => {
    const application = createApplication();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(BackupRestoreControls, {
      props: { application, autoInitialize: false },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Create backup" }));

    await waitFor(() => expect(application.exportDatabase).toHaveBeenCalledOnce());
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole("status", { name: /Backup created:/ })).toBeInTheDocument();
  });

  it("imports only missing records from a selected JSON file", async () => {
    const application = createApplication();
    render(BackupRestoreControls, {
      props: { application, autoInitialize: false },
    });
    const file = new File(['{"schemaVersion":10}'], "import.json", {
      type: "application/json",
    });

    await fireEvent.change(screen.getByLabelText("Backup JSON file"), {
      target: { files: [file] },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Import missing records" }));

    await waitFor(() => expect(application.importDatabase).toHaveBeenCalledWith({ schemaVersion: 10 }));
    expect(
      screen.getByRole("status", {
        name: "Imported 2 missing records. Existing records were left unchanged.",
      }),
    ).toBeInTheDocument();
  });

  it("requires explicit backup acknowledgement before replacing data", async () => {
    const application = createApplication();
    render(BackupRestoreControls, {
      props: { application, autoInitialize: false },
    });
    const file = new File(['{"schemaVersion":10}'], "restore.json", {
      type: "application/json",
    });

    await fireEvent.change(screen.getByLabelText("Restore JSON file"), {
      target: { files: [file] },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Restore and replace" }));

    const dialog = screen.getByRole("dialog", { name: "Replace all current data?" });
    const replaceButton = screen.getByRole("button", { name: "Replace current data" });
    expect(dialog).toBeInTheDocument();
    expect(replaceButton).toBeDisabled();

    await fireEvent.click(
      screen.getByRole("checkbox", {
        name: "I have created a backup of the current data.",
      }),
    );
    expect(replaceButton).toBeEnabled();
    await fireEvent.click(replaceButton);

    await waitFor(() => expect(application.restoreDatabase).toHaveBeenCalledWith({ schemaVersion: 10 }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", {
        name: "Restore complete. Current data was replaced from restore.json.",
      }),
    ).toBeInTheDocument();
  });
});
