import type { LifecycleMetadata } from "$lib/persistence/lifecycle.types";

export type TraceableRecord = LifecycleMetadata & {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

export interface RecordActivityItem {
  label: string;
  detail: string;
  timestamp: string;
}

function textValue(record: TraceableRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function getRecordOwner(record: TraceableRecord) {
  return textValue(record, "owner", "assignedTo", "reportedBy", "assessor") || "Not assigned";
}

export function getRecordSource(record: TraceableRecord) {
  const sourceType = textValue(record, "sourceType");
  const sourceId = textValue(record, "sourceId", "findingId");
  if (sourceType && sourceId) return `${sourceType}: ${sourceId}`;
  if (sourceType) return sourceType;

  return (
    textValue(
      record,
      "requirementSource",
      "criteriaReference",
      "sampleReference",
      "sdsReference",
      "exposureLimitReference",
    ) || "Direct register entry"
  );
}

export function getRecordEvidenceState(record: TraceableRecord) {
  const required = record.evidenceRequired === true;
  const reference = textValue(record, "evidenceReference", "sdsReference");
  if (reference) return { label: "Referenced", tone: "active", reference };
  if (required) return { label: "Missing required evidence", tone: "critical", reference: "" };
  return { label: "No reference", tone: "neutral", reference: "" };
}

export function getRecordActivity(record: TraceableRecord): RecordActivityItem[] {
  const items: RecordActivityItem[] = [
    { label: "Created", detail: "Record added to its source register.", timestamp: record.createdAt },
  ];

  if (record.updatedAt && record.updatedAt !== record.createdAt) {
    items.push({ label: "Updated", detail: "Record fields or workflow state changed.", timestamp: record.updatedAt });
  }

  if (record.archivedAt) {
    items.push({
      label: "Archived",
      detail: "Record removed from active workflow while retained for review.",
      timestamp: record.archivedAt,
    });
  }

  return items.sort((first, second) => second.timestamp.localeCompare(first.timestamp));
}
