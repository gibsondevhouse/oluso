import type { CorrectiveActionRecord } from "$lib/persistence/corrective-action.types";
import type { FindingRecord } from "$lib/persistence/finding.types";
import type { LocationRecord } from "$lib/persistence/location.types";
import type { PersistedRegisterRecord } from "$lib/persistence/local-persistence";
import type {
  ContinueWorkItem,
  HomeAttentionItem,
  HomeQueryInput,
  HomeReadModel,
  HomeStorageNotice,
  PlantStatusItem,
  PortalActivityItem,
  PortalItemTone,
  PortalSourceState,
  QuickActionItem,
  ResponsibilitySummary,
} from "./portal-query.types";

const CLOSED_ACTION_STATUSES = new Set(["Verified", "Closed", "Canceled"]);
const ACTIVE_FINDING_STATUSES = new Set(["Open", "Under Review", "In Progress", "Requires Action"]);
const ATTENTION_COMPLIANCE_STATUSES = new Set(["Due Soon", "Overdue", "Needs Evidence", "Expired"]);
const ATTENTION_REVIEW_STATUSES = new Set(["In Review", "Needs Review"]);
const ACTIONABLE_INCIDENT_STATUSES = new Set(["Open", "Under Investigation", "Action Required"]);

interface SourceDescriptor {
  sourceType: string;
  sourceLabel: string;
  sourceState: PortalSourceState;
  href: string;
  derivationRule: string;
}

function todayIso(input: Date | string | undefined) {
  const date = input ? new Date(input) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function dateSortValue(value: string | null | undefined, fallback = "9999-12-31") {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : fallback;
}

function isDueOrOverdue(value: string | null | undefined, today: string) {
  return dateSortValue(value) <= today;
}

function dueLabel(value: string | null | undefined, today: string) {
  const date = dateSortValue(value, "");
  if (!date) return "no due date";
  if (date < today) return `overdue since ${date}`;
  if (date === today) return `due today`;
  return `due ${date}`;
}

function compactListCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function openCorrectiveActions(records: CorrectiveActionRecord[]) {
  return records.filter((record) => !CLOSED_ACTION_STATUSES.has(record.status));
}

function openFindings(records: FindingRecord[]) {
  return records.filter((record) => ACTIVE_FINDING_STATUSES.has(record.status));
}

function source(record: { id: string }, descriptor: SourceDescriptor) {
  return {
    sourceId: record.id,
    ...descriptor,
  };
}

function getLocationName(locations: LocationRecord[], id: string) {
  return locations.find((location) => location.id === id)?.name ?? "Unassigned location";
}

function latestFirst<T extends { updatedAt?: string; createdAt?: string }>(left: T, right: T) {
  return dateSortValue(right.updatedAt ?? right.createdAt, "0000-00-00").localeCompare(
    dateSortValue(left.updatedAt ?? left.createdAt, "0000-00-00"),
  );
}

function buildContext(input: HomeQueryInput) {
  const sites = input.locations.filter((location) => location.type === "Facility");
  const primarySite = sites[0];

  if (primarySite) {
    const childCount = input.locations.filter(
      (location) => location.parentLocationId === primarySite.id,
    ).length;

    return {
      title: primarySite.name,
      detail: `${compactListCount(sites.length, "site")} available; ${compactListCount(
        childCount,
        "child location",
      )} under this working context.`,
      href: `/operations/locations/${encodeURIComponent(primarySite.id)}`,
      sourceState: "current" as const,
    };
  }

  return {
    title: "No Site selected",
    detail: "Create or open a Location to establish a local working context.",
    href: "/operations/locations",
    sourceState: "current" as const,
  };
}

function buildAttention(input: HomeQueryInput, today: string): HomeAttentionItem[] {
  const actionItems: HomeAttentionItem[] = openCorrectiveActions(input.correctiveActions).map((action) => {
    const overdue = isDueOrOverdue(action.dueDate, today);
    const highPriority = action.priority === "Critical" || action.priority === "High";
    const tone: PortalItemTone = overdue || action.priority === "Critical" ? "critical" : "attention";

    return {
      ...source(action, {
        sourceType: "corrective-action",
        sourceLabel: "Corrective Action",
        sourceState: "legacy",
        href: `/actions/corrective-actions/${encodeURIComponent(action.id)}`,
        derivationRule:
          "Active corrective actions are attention items when they are not verified, closed, or canceled; overdue and critical items sort first.",
      }),
      title: action.title,
      summary: `${action.status}; assigned to ${action.assignedTo || "unassigned"}; ${dueLabel(
        action.dueDate,
        today,
      )}.`,
      tone,
      priority: (overdue ? 50 : 0) + (highPriority ? 25 : 0) + 10,
      dueDate: action.dueDate,
    };
  });

  const findingItems: HomeAttentionItem[] = openFindings(input.findings).map((finding) => ({
    ...source(finding, {
      sourceType: "finding",
      sourceLabel: "Finding",
      sourceState: "legacy",
      href: `/field/findings/${encodeURIComponent(finding.id)}`,
      derivationRule:
        "Findings are attention items when status is Open, Under Review, In Progress, or Requires Action.",
    }),
    title: finding.title,
    summary: `${finding.status}; ${finding.severity} severity at ${getLocationName(
      input.locations,
      finding.locationId,
    )}.`,
    tone: finding.severity === "Critical" || finding.severity === "High" ? "critical" : "attention",
    priority:
      (finding.status === "Requires Action" ? 30 : 10) +
      ({ Critical: 35, High: 25, Medium: 12, Low: 4 }[finding.severity] ?? 0),
  }));

  const incidentItems: HomeAttentionItem[] = input.incidents
    .filter((incident) => ACTIONABLE_INCIDENT_STATUSES.has(incident.status))
    .map((incident) => ({
      ...source(incident, {
        sourceType: "incident",
        sourceLabel: "Incident / Near Miss",
        sourceState: "legacy",
        href: `/incidents/log/${encodeURIComponent(incident.id)}`,
        derivationRule:
          "Incidents are attention items while open, under investigation, or marked action required.",
      }),
      title: incident.title,
      summary: `${incident.status}; reporting state ${incident.reportingStatus}.`,
      tone: incident.status === "Action Required" ? "critical" : "attention",
      priority: incident.status === "Action Required" ? 45 : 22,
    }));

  const complianceItems: HomeAttentionItem[] = input.complianceItems
    .filter(
      (item) =>
        ATTENTION_COMPLIANCE_STATUSES.has(item.status) ||
        ATTENTION_REVIEW_STATUSES.has(item.reviewStatus),
    )
    .map((item) => ({
      ...source(item, {
        sourceType: "compliance-item",
        sourceLabel: "Compliance Support",
        sourceState: "legacy",
        href: `/compliance/items/${encodeURIComponent(item.id)}`,
        derivationRule:
          "Compliance support items are attention items when status or review status requires action; this is not a legal compliance conclusion.",
      }),
      title: item.title,
      summary: `${item.status}; ${item.reviewStatus}; owner ${item.owner || "unassigned"}.`,
      tone: item.status === "Overdue" || item.status === "Expired" ? "critical" : "warning",
      priority: item.status === "Overdue" || item.status === "Expired" ? 42 : 18,
      dueDate: item.dueDate,
    }));

  const chemicalItems: HomeAttentionItem[] = input.chemicals
    .filter((chemical) => chemical.sdsStatus === "Missing" || chemical.sdsStatus === "Needs Review")
    .map((chemical) => ({
      ...source(chemical, {
        sourceType: "chemical",
        sourceLabel: "Legacy Chemical",
        sourceState: "legacy",
        href: "/migration/chemicals",
        derivationRule:
          "Legacy chemicals are attention items only for explicit SDS status values Missing or Needs Review.",
      }),
      title: chemical.name,
      summary: `SDS status is ${chemical.sdsStatus}; stored at ${getLocationName(
        input.locations,
        chemical.storageLocationId,
      )}.`,
      tone: chemical.sdsStatus === "Missing" ? "critical" : "warning",
      priority: chemical.sdsStatus === "Missing" ? 36 : 16,
    }));

  return [
    ...actionItems,
    ...findingItems,
    ...incidentItems,
    ...complianceItems,
    ...chemicalItems,
  ]
    .sort((left, right) => {
      const priority = right.priority - left.priority;
      if (priority !== 0) return priority;
      return dateSortValue(left.dueDate).localeCompare(dateSortValue(right.dueDate));
    })
    .slice(0, 7);
}

function buildContinueWork(input: HomeQueryInput): ContinueWorkItem[] {
  const actions = openCorrectiveActions(input.correctiveActions).map((action) => ({
    ...source(action, {
      sourceType: "corrective-action",
      sourceLabel: "Corrective Action",
      sourceState: "legacy",
      href: `/actions/corrective-actions/${encodeURIComponent(action.id)}`,
      derivationRule:
        "Continue Working uses active records with explicit in-progress or draft workflow states; it is not audit activity.",
    }),
    title: action.title,
    summary: `${action.status}; assigned to ${action.assignedTo || "unassigned"}.`,
    reason: "Active corrective action",
    updatedAt: action.updatedAt,
  }));

  const findings = input.findings
    .filter((finding) => finding.status === "Draft" || finding.status === "In Progress")
    .map((finding) => ({
      ...source(finding, {
        sourceType: "finding",
        sourceLabel: "Finding",
        sourceState: "legacy",
        href: `/field/findings/${encodeURIComponent(finding.id)}`,
        derivationRule:
          "Continue Working uses active records with explicit in-progress or draft workflow states; it is not audit activity.",
      }),
      title: finding.title,
      summary: `${finding.status}; ${finding.severity} severity.`,
      reason: "Finding in progress",
      updatedAt: finding.updatedAt,
    }));

  const assessments = input.riskAssessments
    .filter((assessment) => assessment.reviewStatus === "Draft" || assessment.reviewStatus === "Needs Review")
    .map((assessment) => ({
      ...source(assessment, {
        sourceType: "risk-assessment",
        sourceLabel: "Risk Assessment",
        sourceState: "legacy",
        href: `/risk/assessments/${encodeURIComponent(assessment.id)}`,
        derivationRule:
          "Continue Working includes assessments with Draft or Needs Review status.",
      }),
      title: assessment.title,
      summary: `${assessment.reviewStatus}; next review ${assessment.nextReviewDate || "not scheduled"}.`,
      reason: "Assessment needs review",
      updatedAt: assessment.updatedAt,
    }));

  return [...actions, ...findings, ...assessments].sort(latestFirst).slice(0, 5);
}

function buildPlantStatus(input: HomeQueryInput): PlantStatusItem[] {
  const siteCount = input.locations.filter((location) => location.type === "Facility").length;
  const missingSdsCount = input.chemicals.filter((chemical) => chemical.sdsStatus === "Missing").length;
  const openActionCount = openCorrectiveActions(input.correctiveActions).length;
  const openIncidentCount = input.incidents.filter((incident) =>
    ACTIONABLE_INCIDENT_STATUSES.has(incident.status),
  ).length;

  return [
    {
      id: "sites",
      label: "Site and Location context",
      value: String(siteCount || input.locations.length),
      detail: siteCount
        ? `${compactListCount(input.locations.length, "active location")} across ${compactListCount(
            siteCount,
            "site",
          )}.`
        : "No Site records are available yet.",
      href: "/operations/locations",
      tone: siteCount ? "steady" : "warning",
      derivationRule: "Counts active Location records currently published by the local persistence layer.",
    },
    {
      id: "processes",
      label: "Processes and equipment",
      value: String(input.processes.length + input.equipment.length),
      detail: `${compactListCount(input.processes.length, "process")} and ${compactListCount(
        input.equipment.length,
        "equipment item",
      )} available for operational context.`,
      href: "/operations/processes",
      tone: input.processes.length ? "steady" : "neutral",
      derivationRule: "Counts active process and equipment records; it is not a baseline-completeness score.",
    },
    {
      id: "chemicals",
      label: "Chemicals and SDS",
      value: String(input.chemicals.length),
      detail: missingSdsCount
        ? `${compactListCount(missingSdsCount, "legacy chemical")} has missing SDS status.`
        : "No missing SDS status in retained legacy chemical records.",
      href: "/master/products",
      tone: missingSdsCount ? "warning" : "steady",
      derivationRule: "Uses explicit SDS status on retained legacy chemical records only.",
    },
    {
      id: "actions-incidents",
      label: "Open actions and events",
      value: String(openActionCount + openIncidentCount),
      detail: `${compactListCount(openActionCount, "open action")} and ${compactListCount(
        openIncidentCount,
        "open incident",
      )} need review or follow-up.`,
      href: "/actions/corrective-actions",
      tone: openActionCount + openIncidentCount ? "attention" : "steady",
      derivationRule: "Counts records with explicit open/actionable statuses; no compliance conclusion is inferred.",
    },
  ];
}

function buildQuickActions(): QuickActionItem[] {
  return [
    {
      id: "search",
      title: "Find a record",
      description: "Search current typed records and retained registers.",
      href: "/search",
      sourceState: "current",
    },
    {
      id: "new-finding",
      title: "Add finding",
      description: "Capture an observation, inspection finding, or field issue.",
      href: "/field/findings/new",
      sourceState: "legacy",
    },
    {
      id: "new-action",
      title: "Add action",
      description: "Create a corrective action with owner, priority, due date, and verification needs.",
      href: "/actions/corrective-actions/new",
      sourceState: "legacy",
    },
    {
      id: "chemical-product",
      title: "Open Chemicals & SDS",
      description: "Review Product, SDS, Inventory, and Use workspaces.",
      href: "/master/products",
      sourceState: "current",
    },
    {
      id: "storage",
      title: "Check local data",
      description: "Review storage diagnostics, backup, and local persistence health.",
      href: "/system/settings",
      sourceState: "current",
    },
  ];
}

function activityForRecord(
  record: PersistedRegisterRecord,
  descriptor: SourceDescriptor,
  title: string,
): PortalActivityItem {
  const timestamp = "updatedAt" in record && typeof record.updatedAt === "string"
    ? record.updatedAt
    : "createdAt" in record && typeof record.createdAt === "string"
      ? record.createdAt
      : "";

  return {
    ...source(record, descriptor),
    summary: `${descriptor.sourceLabel} updated from retained record metadata.`,
    recordTitle: title,
    timestamp,
    actor: "Local record metadata",
  };
}

function buildActivity(input: HomeQueryInput): PortalActivityItem[] {
  const items = [
    ...input.findings.map((record) =>
      activityForRecord(
        record,
        {
          sourceType: "finding",
          sourceLabel: "Finding",
          sourceState: "limited-history",
          href: `/field/findings/${encodeURIComponent(record.id)}`,
          derivationRule:
            "Recent Activity is a limited projection from created/updated metadata until governed revision history covers this legacy family.",
        },
        record.title,
      ),
    ),
    ...input.correctiveActions.map((record) =>
      activityForRecord(
        record,
        {
          sourceType: "corrective-action",
          sourceLabel: "Corrective Action",
          sourceState: "limited-history",
          href: `/actions/corrective-actions/${encodeURIComponent(record.id)}`,
          derivationRule:
            "Recent Activity is a limited projection from created/updated metadata until governed revision history covers this legacy family.",
        },
        record.title,
      ),
    ),
    ...input.incidents.map((record) =>
      activityForRecord(
        record,
        {
          sourceType: "incident",
          sourceLabel: "Incident / Near Miss",
          sourceState: "limited-history",
          href: `/incidents/log/${encodeURIComponent(record.id)}`,
          derivationRule:
            "Recent Activity is a limited projection from created/updated metadata until governed revision history covers this legacy family.",
        },
        record.title,
      ),
    ),
    ...input.complianceItems.map((record) =>
      activityForRecord(
        record,
        {
          sourceType: "compliance-item",
          sourceLabel: "Compliance Support",
          sourceState: "limited-history",
          href: `/compliance/items/${encodeURIComponent(record.id)}`,
          derivationRule:
            "Recent Activity is a limited projection from created/updated metadata until governed revision history covers this legacy family.",
        },
        record.title,
      ),
    ),
  ];

  return items
    .filter((item) => item.timestamp)
    .sort((left, right) => dateSortValue(right.timestamp, "0000-00-00").localeCompare(
      dateSortValue(left.timestamp, "0000-00-00"),
    ))
    .slice(0, 6);
}

function incrementResponsibility(
  summaries: Map<string, ResponsibilitySummary>,
  owner: string,
  overdue: boolean,
  sourceLabel: string,
  href: string,
) {
  const key = owner.trim() || "Unassigned";
  const existing =
    summaries.get(key) ??
    ({
      id: key.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-") || "unassigned",
      owner: key,
      openCount: 0,
      overdueCount: 0,
      href,
      sourceLabel,
      derivationRule:
        "Responsibility groups explicit owner, assigned-to, and reported-by fields on active records; it does not infer reporting hierarchy.",
    } satisfies ResponsibilitySummary);

  existing.openCount += 1;
  existing.overdueCount += overdue ? 1 : 0;
  summaries.set(key, existing);
}

function buildResponsibilities(input: HomeQueryInput, today: string): ResponsibilitySummary[] {
  const summaries = new Map<string, ResponsibilitySummary>();

  for (const action of openCorrectiveActions(input.correctiveActions)) {
    incrementResponsibility(
      summaries,
      action.assignedTo,
      isDueOrOverdue(action.dueDate, today),
      "Corrective Actions",
      "/actions/corrective-actions",
    );
  }

  for (const item of input.complianceItems.filter((record) =>
    ATTENTION_COMPLIANCE_STATUSES.has(record.status),
  )) {
    incrementResponsibility(
      summaries,
      item.owner,
      item.status === "Overdue" || isDueOrOverdue(item.dueDate, today),
      "Compliance Support",
      "/compliance/items",
    );
  }

  for (const control of input.controls.filter((record) => record.status === "needs-review")) {
    incrementResponsibility(summaries, control.owner, false, "Controls", "/risk/controls");
  }

  return Array.from(summaries.values())
    .sort((left, right) => {
      const overdue = right.overdueCount - left.overdueCount;
      if (overdue !== 0) return overdue;
      return right.openCount - left.openCount;
    })
    .slice(0, 5);
}

function localStatusLabel(input: HomeQueryInput) {
  switch (input.diagnostics.status) {
    case "ready":
      return "Saved locally";
    case "loading":
      return "Opening local data";
    case "error":
      return "Local data unavailable";
    case "not_configured":
      return "Local data not configured";
  }
}

function localStatusDetail(input: HomeQueryInput) {
  if (input.diagnostics.lastError) {
    return input.diagnostics.lastError;
  }

  if (input.diagnostics.dataPath) {
    return input.diagnostics.dataPath;
  }

  return input.diagnostics.lastInitializationStatus;
}

function buildStorageNotice(input: HomeQueryInput): HomeStorageNotice | null {
  if (input.diagnostics.status === "ready" && !input.diagnostics.lastError) {
    return null;
  }

  return {
    title: localStatusLabel(input),
    message: localStatusDetail(input),
    tone: input.diagnostics.status === "error" ? "critical" : "warning",
    href: "/system/settings",
  };
}

export function buildHomeReadModel(input: HomeQueryInput): HomeReadModel {
  const today = todayIso(input.now);
  const totalRecords =
    input.locations.length +
    input.processes.length +
    input.equipment.length +
    input.chemicals.length +
    input.hazards.length +
    input.controls.length +
    input.riskAssessments.length +
    input.segs.length +
    input.exposureMonitoring.length +
    input.findings.length +
    input.incidents.length +
    input.complianceItems.length +
    input.correctiveActions.length;

  return {
    context: buildContext(input),
    firstUse: totalRecords === 0,
    localStatusLabel: localStatusLabel(input),
    localStatusDetail: localStatusDetail(input),
    continueWork: buildContinueWork(input),
    attention: buildAttention(input, today),
    plantStatus: buildPlantStatus(input),
    quickActions: buildQuickActions(),
    activity: buildActivity(input),
    responsibilities: buildResponsibilities(input, today),
    storageNotice: buildStorageNotice(input),
  };
}
