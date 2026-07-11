import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog.svelte";

describe("ConfirmDialog", () => {
  it("supports keyboard cancellation and focusable actions", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(ConfirmDialog, {
      props: {
        title: "Archive record?",
        message: "Archive Workshop?",
        confirmLabel: "Archive",
        onConfirm,
        onCancel,
      },
    });

    const dialog = screen.getByRole("dialog", { name: "Archive record?" });
    const confirmButton = screen.getByRole("button", { name: "Archive" });

    expect(dialog).toHaveAttribute("tabindex", "-1");
    await fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);

    confirmButton.focus();
    expect(confirmButton).toHaveFocus();
    await fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
