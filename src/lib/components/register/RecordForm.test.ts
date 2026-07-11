import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import RecordForm from "./RecordForm.svelte";

const fields = [
  {
    name: "name",
    label: "Name",
    type: "text" as const,
    required: true,
    helperText: "Use a clear record name.",
  },
  {
    name: "type",
    label: "Type",
    type: "select" as const,
    required: true,
    options: [
      { value: "", label: "Select type" },
      { value: "Facility", label: "Facility" },
      { value: "Storage", label: "Storage" },
    ],
  },
  {
    name: "description",
    label: "Description",
    type: "textarea" as const,
    helperText: "Optional context.",
  },
];

function renderForm(overrides = {}) {
  return render(RecordForm, {
    props: {
      title: "Add Record",
      ariaLabel: "Add record",
      fields,
      initialValues: {
        name: "",
        type: "",
        description: "",
      },
      onSave: vi.fn(),
      onCancel: vi.fn(),
      validate: (values: Record<string, string>) => ({
        name: values.name.trim() ? undefined : "Name is required.",
        type: values.type ? undefined : "Type is required.",
      }),
      validationSummary: "Fix the highlighted fields before saving the record.",
      submitLabel: "Save record",
      cancelLabel: "Cancel",
      ...overrides,
    },
  });
}

describe("RecordForm", () => {
  it("renders labels, helper text, and validation messages", async () => {
    const onSave = vi.fn();
    renderForm({ onSave });

    expect(screen.getByRole("form", { name: "Add record" })).toBeInTheDocument();
    expect(screen.getByText("Use a clear record name.")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Save record" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Fix the highlighted fields before saving the record.")).toBeInTheDocument();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Type is required.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });

  it("submits valid values", async () => {
    const onSave = vi.fn();
    renderForm({ onSave });

    await fireEvent.input(screen.getByLabelText("Name"), {
      target: { value: "Main Facility" },
    });
    await fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "Facility" },
    });
    await fireEvent.input(screen.getByLabelText("Description"), {
      target: { value: "Primary operating location." },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save record" }));

    expect(onSave).toHaveBeenCalledWith({
      name: "Main Facility",
      type: "Facility",
      description: "Primary operating location.",
    });
  });

  it("adds native names to generated controls", () => {
    renderForm();

    expect(screen.getByLabelText("Name")).toHaveAttribute("name", "name");
    expect(screen.getByLabelText("Type")).toHaveAttribute("name", "type");
    expect(screen.getByLabelText("Description")).toHaveAttribute("name", "description");
  });

  it("prompts before discarding dirty forms", async () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });

    await fireEvent.input(screen.getByLabelText("Name"), {
      target: { value: "Unsaved" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByText("Discard unsaved changes?")).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
