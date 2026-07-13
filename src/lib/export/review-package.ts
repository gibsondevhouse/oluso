import type {
  PersistedRegisterRecord,
  RegisterCollectionName,
} from "$lib/persistence/local-persistence";
import { EXPORT_REGISTERS } from "./register-export";

export type ExportPreset = "full" | "review-ready" | "evidence-gaps" | "overdue";

export interface ReviewPackageRegister {
  collection: RegisterCollectionName;
  label: string;
  records: PersistedRegisterRecord[];
}

export interface ReviewPackageFile {
  content: string;
  extension: "json" | "html";
  fileName: string;
  mimeType: string;
  recordCount: number;
}

function recordValue(record: PersistedRegisterRecord, key: string) {
  return (record as unknown as Record<string, unknown>)[key];
}

function text(record: PersistedRegisterRecord, key: string) {
  const value = recordValue(record, key);
  return typeof value === "string" ? value.trim() : "";
}

export function recordHasEvidenceGap(record: PersistedRegisterRecord) {
  const required = recordValue(record, "evidenceRequired") === true;
  const reference = text(record, "evidenceReference") || text(record, "sdsReference");
  return required && !reference;
}

export function recordIsOverdue(record: PersistedRegisterRecord, today = new Date()) {
  const dueDate = text(record, "dueDate") || text(record, "reviewDate") || text(record, "nextReviewDate");
  if (!dueDate) return false;
  const status = text(record, "status").toLowerCase();
  if (["complete", "closed", "cancelled", "canceled"].includes(status)) return false;
  return dueDate < today.toISOString().slice(0, 10);
}

export function recordNeedsReview(record: PersistedRegisterRecord) {
  const status = text(record, "reviewStatus").toLowerCase();
  return status === "needs review" || status === "not reviewed" || status === "in review";
}

export function applyExportPreset(
  records: PersistedRegisterRecord[],
  preset: ExportPreset,
  today = new Date(),
) {
  if (preset === "evidence-gaps") return records.filter(recordHasEvidenceGap);
  if (preset === "overdue") return records.filter((record) => recordIsOverdue(record, today));
  if (preset === "review-ready") {
    return records.filter(
      (record) => recordNeedsReview(record) || recordHasEvidenceGap(record) || recordIsOverdue(record, today),
    );
  }
  return records;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function recordTitle(record: PersistedRegisterRecord) {
  return text(record, "title") || text(record, "name") || text(record, "sampleReference") || record.id;
}

export function buildAuditPackage(
  registers: ReviewPackageRegister[],
  format: "json" | "html",
  generatedAt: Date,
): ReviewPackageFile {
  const recordCount = registers.reduce((total, register) => total + register.records.length, 0);
  const manifest = {
    packageType: "OLUSO review support package",
    generatedAt: generatedAt.toISOString(),
    sourceStatement:
      "This package is a point-in-time projection of source register records. The records in OLUSO remain authoritative.",
    registerCount: registers.length,
    recordCount,
    evidenceGapCount: registers.flatMap((register) => register.records).filter(recordHasEvidenceGap).length,
    overdueCount: registers.flatMap((register) => register.records).filter((record) => recordIsOverdue(record, generatedAt)).length,
  };
  const timestamp = generatedAt.toISOString().replace(/\.\d{3}Z$/, "Z").replaceAll(":", "");

  if (format === "json") {
    return {
      content: JSON.stringify({ manifest, registers }, null, 2),
      extension: "json",
      fileName: `oluso-review-support-package-${timestamp}.json`,
      mimeType: "application/json",
      recordCount,
    };
  }

  const sections = registers
    .filter((register) => register.records.length > 0)
    .map(
      (register) => `<section><h2>${escapeHtml(register.label)}</h2>${register.records
        .map(
          (record) => `<article><h3>${escapeHtml(recordTitle(record))}</h3><dl>
<div><dt>ID</dt><dd>${escapeHtml(record.id)}</dd></div>
<div><dt>Status</dt><dd>${escapeHtml(text(record, "status") || text(record, "reviewStatus") || record.lifecycleStatus)}</dd></div>
<div><dt>Owner</dt><dd>${escapeHtml(text(record, "owner") || text(record, "assignedTo") || text(record, "reportedBy") || "Not assigned")}</dd></div>
<div><dt>Updated</dt><dd>${escapeHtml(record.updatedAt)}</dd></div>
<div><dt>Evidence</dt><dd>${escapeHtml(text(record, "evidenceReference") || text(record, "sdsReference") || (recordHasEvidenceGap(record) ? "MISSING REQUIRED EVIDENCE" : "No reference"))}</dd></div>
</dl></article>`,
        )
        .join("")}</section>`,
    )
    .join("");

  const content = `<!doctype html><html><head><meta charset="utf-8"><title>OLUSO Review Support Package</title><style>
body{font:14px system-ui,sans-serif;color:#17211b;margin:32px}header{border-bottom:2px solid #245b45;margin-bottom:24px}h1,h2,h3{margin:.4em 0}section{break-before:page}section:first-of-type{break-before:auto}article{border:1px solid #ccd6d0;border-radius:6px;padding:12px;margin:10px 0;break-inside:avoid}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 18px}dl div{display:grid;grid-template-columns:90px 1fr}dt{font-weight:700}dd{margin:0}@media print{body{margin:12mm}button{display:none}}
</style></head><body><header><h1>OLUSO Review Support Package</h1><p>${escapeHtml(manifest.sourceStatement)}</p><p>Generated ${escapeHtml(manifest.generatedAt)} / ${recordCount} records / ${manifest.evidenceGapCount} evidence gaps / ${manifest.overdueCount} overdue</p><button onclick="window.print()">Print or save as PDF</button></header>${sections}</body></html>`;

  return {
    content,
    extension: "html",
    fileName: `oluso-review-support-package-${timestamp}.html`,
    mimeType: "text/html",
    recordCount,
  };
}

export function collectReviewPackageRegisters(
  list: (collection: RegisterCollectionName) => PersistedRegisterRecord[],
  preset: ExportPreset,
  today = new Date(),
): ReviewPackageRegister[] {
  return EXPORT_REGISTERS.map((definition) => ({
    collection: definition.collection,
    label: definition.label,
    records: applyExportPreset(list(definition.collection), preset, today),
  }));
}
