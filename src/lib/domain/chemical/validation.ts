import { ChemicalValidationError } from "./errors";

export function requiredText(value: string | null | undefined, label: string) {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw new ChemicalValidationError(`${label} is required.`);
  return normalized;
}

export function optionalText(value: string | null | undefined) {
  return value?.trim() || undefined;
}

export function normalizeCasNumber(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return undefined;
  if (/[A-Za-z]/.test(trimmed)) {
    throw new ChemicalValidationError("CAS number cannot contain letters.", { casNumber: "CAS number is malformed." });
  }
  const normalized = trimmed
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  if (!/^\d{2,7}-\d{2}-\d$/.test(normalized)) {
    throw new ChemicalValidationError("CAS number must use the format 1918-02-1.", { casNumber: "CAS number is malformed." });
  }
  return normalized;
}

export function normalizedIdentity(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function dedupeStrings(values: readonly string[] = []) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLocaleLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

export function assertEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  label: string,
): T {
  if (!value || !allowed.includes(value as T)) {
    throw new ChemicalValidationError(`${label} must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

export function optionalNonNegative(value: number | null | undefined, label: string) {
  if (value === null || value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0) {
    throw new ChemicalValidationError(`${label} must be a non-negative number.`);
  }
  return value;
}

export function requireUnitForValue(
  value: number | null | undefined,
  unit: string | null | undefined,
  label: string,
) {
  if (value !== null && value !== undefined && !unit?.trim()) {
    throw new ChemicalValidationError(`${label} unit is required when a value is supplied.`);
  }
}

export function isActiveDependency(value: { lifecycleStatus: string; status?: string }) {
  return value.lifecycleStatus === "active" && value.status !== "inactive" && value.status !== "archived";
}
