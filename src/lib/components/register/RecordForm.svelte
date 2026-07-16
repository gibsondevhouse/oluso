<script lang="ts">
  import { onMount } from "svelte";
  import { Save, X } from "lucide-svelte";
  import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";

  type FieldType = "text" | "textarea" | "select" | "multiselect" | "checkbox";
  type RecordFormValues = Record<string, string>;
  type RecordFormErrors = Record<string, string | undefined>;

  interface RecordFormFieldOption {
    value: string;
    label: string;
  }

  interface RecordFormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    helperText?: string;
    placeholder?: string;
    options?: RecordFormFieldOption[];
    rows?: number;
  }

  interface Props {
    title: string;
    ariaLabel: string;
    fields: RecordFormField[];
    initialValues: RecordFormValues;
    onSave: (values: RecordFormValues) => void | Promise<void>;
    onCancel: () => void;
    validate?: (values: RecordFormValues) => RecordFormErrors;
    context?: string;
    submitLabel?: string;
    cancelLabel?: string;
    validationSummary?: string;
  }

  let {
    title,
    ariaLabel,
    fields,
    initialValues,
    onSave,
    onCancel,
    validate,
    context,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    validationSummary = "Fix the highlighted fields before saving.",
  }: Props = $props();

  let values = $state(getNormalizedInitialValues());
  let initialSnapshot = $state(JSON.stringify(getNormalizedInitialValues()));
  let fieldErrors = $state<RecordFormErrors>({});
  let formError = $state<string | null>(null);
  let isSaving = $state(false);
  let showDiscardDialog = $state(false);
  let pendingHref = $state<string | null>(null);

  const isDirty = $derived(JSON.stringify(values) !== initialSnapshot);

  function getNormalizedInitialValues() {
    return normalizeValues(initialValues);
  }

  function normalizeValues(nextValues: RecordFormValues): RecordFormValues {
    return Object.fromEntries(
      Object.entries(nextValues).map(([key, value]) => [key, value ?? ""]),
    );
  }

  function getFieldId(field: RecordFormField) {
    return `record-form-${field.name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  function getErrorId(field: RecordFormField) {
    return `${getFieldId(field)}-error`;
  }

  function getHelperId(field: RecordFormField) {
    return `${getFieldId(field)}-helper`;
  }

  function getDescribedBy(field: RecordFormField) {
    const ids = [];

    if (field.helperText) {
      ids.push(getHelperId(field));
    }

    if (fieldErrors[field.name]) {
      ids.push(getErrorId(field));
    }

    return ids.length > 0 ? ids.join(" ") : undefined;
  }

  function validateValues(nextValues: RecordFormValues) {
    let nextErrors: RecordFormErrors = {};

    try {
      nextErrors = validate?.(nextValues) ?? {};
    } catch {
      formError = "Validation could not complete. Review the fields and try again.";
    }

    for (const field of fields) {
      if (field.required && !nextValues[field.name]?.trim() && !nextErrors[field.name]) {
        nextErrors[field.name] = `${field.label} is required.`;
      }
    }

    return Object.fromEntries(
      Object.entries(nextErrors).filter(([, message]) => Boolean(message)),
    ) as RecordFormErrors;
  }

  function validateField(fieldName: string) {
    const nextErrors = validateValues(values);
    fieldErrors = {
      ...fieldErrors,
      [fieldName]: nextErrors[fieldName],
    };
  }

  function updateField(fieldName: string, value: string) {
    values = {
      ...values,
      [fieldName]: value,
    };

    if (fieldErrors[fieldName]) {
      fieldErrors = {
        ...fieldErrors,
        [fieldName]: undefined,
      };
    }
  }

  function updateCheckboxField(fieldName: string, checked: boolean) {
    updateField(fieldName, checked ? "true" : "false");
  }

  function getMultiValues(fieldName: string) {
    return (values[fieldName] ?? "").split("|").filter(Boolean);
  }

  function isMultiSelected(fieldName: string, optionValue: string) {
    return getMultiValues(fieldName).includes(optionValue);
  }

  function updateMultiField(fieldName: string, select: HTMLSelectElement) {
    updateField(
      fieldName,
      Array.from(select.selectedOptions)
        .map((option) => option.value)
        .filter(Boolean)
        .join("|"),
    );
  }

  async function submitForm() {
    formError = null;
    const nextErrors = validateValues(values);
    fieldErrors = nextErrors;

    if (Object.keys(nextErrors).length > 0) {
      formError = validationSummary;
      return;
    }

    isSaving = true;

    try {
      await onSave(values);
      initialSnapshot = JSON.stringify(normalizeValues(values));
    } catch (error) {
      formError = error instanceof Error ? error.message : String(error);
    } finally {
      isSaving = false;
    }
  }

  function requestCancel() {
    if (isDirty) {
      pendingHref = null;
      showDiscardDialog = true;
      return;
    }

    onCancel();
  }

  function discardChanges() {
    const href = pendingHref;
    showDiscardDialog = false;
    pendingHref = null;
    onCancel();

    if (href) {
      window.location.href = href;
    }
  }

  function keepEditing() {
    showDiscardDialog = false;
    pendingHref = null;
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!isDirty) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a[href]");
    const href = anchor?.getAttribute("href");

    if (!href || href.startsWith("#")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    pendingHref = href;
    showDiscardDialog = true;
  }

  onMount(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  });
</script>

<form
  class="record-form"
  aria-label={ariaLabel}
  onsubmit={(event) => {
    event.preventDefault();
    void submitForm();
  }}
>
  <div class="form-header">
    <div>
      <span class="form-eyebrow">Validated workflow</span>
      <h2>{title}</h2>
    </div>
    {#if context}
      <span class="form-context">{context}</span>
    {/if}
  </div>

  {#if formError}
    <p class="error-message" role="alert">{formError}</p>
  {/if}

  {#each fields as field (field.name)}
    {@const fieldId = getFieldId(field)}
    <div class="record-form-field" class:errorState={Boolean(fieldErrors[field.name])}>
      {#if field.type !== "checkbox"}
        <label class="field-label" for={fieldId}>
          <span>
            {field.label}
            {#if field.required}
              <span class="required-mark" aria-hidden="true">*</span>
            {/if}
          </span>
        </label>
      {/if}

      {#if field.helperText}
        <span class="field-helper" id={getHelperId(field)}>{field.helperText}</span>
      {/if}

      {#if field.type === "checkbox"}
        <label class="checkbox-control" for={fieldId}>
          <input
            id={fieldId}
            name={field.name}
            type="checkbox"
            disabled={isSaving}
            checked={values[field.name] === "true"}
            aria-invalid={fieldErrors[field.name] ? "true" : "false"}
            aria-describedby={getDescribedBy(field)}
            onchange={(event) => updateCheckboxField(field.name, (event.currentTarget as HTMLInputElement).checked)}
            onblur={() => validateField(field.name)}
          />
          <span>{field.label}</span>
        </label>
      {:else if field.type === "textarea"}
        <textarea
          id={fieldId}
          name={field.name}
          aria-label={field.label}
          rows={field.rows ?? 4}
          disabled={isSaving}
          placeholder={field.placeholder}
          value={values[field.name] ?? ""}
          aria-invalid={fieldErrors[field.name] ? "true" : "false"}
          aria-describedby={getDescribedBy(field)}
          aria-required={field.required ? "true" : undefined}
          oninput={(event) => updateField(field.name, (event.currentTarget as HTMLTextAreaElement).value)}
          onblur={() => validateField(field.name)}
        ></textarea>
      {:else if field.type === "select"}
        <select
          id={fieldId}
          name={field.name}
          aria-label={field.label}
          disabled={isSaving}
          value={values[field.name] ?? ""}
          aria-invalid={fieldErrors[field.name] ? "true" : "false"}
          aria-describedby={getDescribedBy(field)}
          aria-required={field.required ? "true" : undefined}
          onchange={(event) => updateField(field.name, (event.currentTarget as HTMLSelectElement).value)}
          onblur={() => validateField(field.name)}
        >
          {#each field.options ?? [] as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      {:else if field.type === "multiselect"}
        <select
          id={fieldId}
          name={field.name}
          aria-label={field.label}
          disabled={isSaving}
          multiple
          aria-invalid={fieldErrors[field.name] ? "true" : "false"}
          aria-describedby={getDescribedBy(field)}
          aria-required={field.required ? "true" : undefined}
          onchange={(event) => updateMultiField(field.name, event.currentTarget as HTMLSelectElement)}
          onblur={() => validateField(field.name)}
        >
          {#each field.options ?? [] as option}
            <option value={option.value} selected={isMultiSelected(field.name, option.value)}>{option.label}</option>
          {/each}
        </select>
      {:else}
        <input
          id={fieldId}
          name={field.name}
          aria-label={field.label}
          disabled={isSaving}
          placeholder={field.placeholder}
          value={values[field.name] ?? ""}
          aria-invalid={fieldErrors[field.name] ? "true" : "false"}
          aria-describedby={getDescribedBy(field)}
          aria-required={field.required ? "true" : undefined}
          oninput={(event) => updateField(field.name, (event.currentTarget as HTMLInputElement).value)}
          onblur={() => validateField(field.name)}
        />
      {/if}

      {#if fieldErrors[field.name]}
        <p class="field-error" id={getErrorId(field)} role="alert">{fieldErrors[field.name]}</p>
      {/if}
    </div>
  {/each}

  <div class="action-row">
    <button class="button-link" type="submit" disabled={isSaving}>
      <Save size={16} aria-hidden="true" />
      {isSaving ? "Saving..." : submitLabel}
    </button>
    <button class="secondary-button" type="button" disabled={isSaving} onclick={requestCancel}>
      <X size={16} aria-hidden="true" />
      {cancelLabel}
    </button>
    <span class="save-state" role="status" aria-live="polite">
      {isSaving ? "Saving changes" : isDirty ? "Unsaved changes" : "No unsaved changes"}
    </span>
  </div>
</form>

{#if showDiscardDialog}
  <ConfirmDialog
    title="Discard unsaved changes?"
    message="This form has unsaved changes. Discard them and continue?"
    confirmLabel="Discard changes"
    cancelLabel="Keep editing"
    danger
    onConfirm={discardChanges}
    onCancel={keepEditing}
  />
{/if}

<style>
  .form-header {
    align-items: flex-start;
    border-bottom: 1px solid var(--glass-border-subtle);
    padding-bottom: 14px;
  }

  .form-eyebrow {
    display: block;
    margin-bottom: 4px;
    color: var(--color-accent-strong);
    font-size: 0.6875rem;
    font-weight: 760;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .record-form-field {
    display: grid;
    gap: 7px;
    min-width: 0;
    border-bottom: 1px solid rgba(176, 198, 197, 0.08);
    padding-bottom: 14px;
  }

  .record-form-field:last-of-type {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .record-form-field.errorState {
    border-bottom-color: rgba(249, 112, 102, 0.2);
  }

  .record-form-field label,
  .field-label {
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 720;
  }

  .required-mark {
    color: var(--color-warning-text);
    margin-left: 3px;
  }

  .field-helper {
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.45;
  }

  button:disabled,
  input:disabled,
  select:disabled,
  textarea:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  select[multiple] {
    min-height: 116px;
  }

  .save-state {
    align-self: center;
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 650;
  }

  .checkbox-control {
    display: inline-flex;
    align-items: flex-start;
    gap: 10px;
    width: fit-content;
    min-height: 38px;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-control);
    background: var(--color-field-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 720;
    padding: 9px 11px;
  }

  .checkbox-control input {
    width: 17px;
    height: 17px;
    margin: 0;
    accent-color: var(--color-accent);
  }

  .action-row {
    align-items: center;
    border-top: 1px solid var(--glass-border-subtle);
    padding-top: 14px;
  }
</style>
