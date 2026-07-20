import type { ChemicalRecord } from "$lib/persistence/chemical.types";
import type { ComplianceItemRecord } from "$lib/persistence/compliance-item.types";
import type { CorrectiveActionRecord } from "$lib/persistence/corrective-action.types";
import type { ControlRecord } from "$lib/persistence/control.types";
import type { EquipmentRecord } from "$lib/persistence/equipment.types";
import type { ExposureMonitoringRecord } from "$lib/persistence/exposure-monitoring.types";
import type { FindingRecord } from "$lib/persistence/finding.types";
import type { HazardRecord } from "$lib/persistence/hazard.types";
import type { IncidentRecord } from "$lib/persistence/incident.types";
import type { LocationRecord } from "$lib/persistence/location.types";
import type { PersistenceDiagnostics } from "$lib/persistence/local-persistence";
import type { ProcessRecord } from "$lib/persistence/process.types";
import type { RiskAssessmentRecord } from "$lib/persistence/risk-assessment.types";
import type { SegRecord } from "$lib/persistence/seg.types";

export type PortalItemTone = "critical" | "attention" | "warning" | "steady" | "neutral";
export type PortalSourceState = "current" | "legacy" | "limited-history" | "deferred";

export interface PortalSourceReference {
  sourceType: string;
  sourceId: string;
  sourceLabel: string;
  sourceState: PortalSourceState;
  href: string;
  derivationRule: string;
}

export interface HomeContextSummary {
  title: string;
  detail: string;
  href: string;
  sourceState: PortalSourceState;
}

export interface HomeAttentionItem extends PortalSourceReference {
  title: string;
  summary: string;
  tone: PortalItemTone;
  priority: number;
  dueDate?: string;
}

export interface ContinueWorkItem extends PortalSourceReference {
  title: string;
  summary: string;
  reason: string;
  updatedAt: string;
}

export interface PlantStatusItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: PortalItemTone;
  derivationRule: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  sourceState: PortalSourceState;
}

export interface PortalActivityItem extends PortalSourceReference {
  summary: string;
  recordTitle: string;
  timestamp: string;
  actor: string;
}

export interface ResponsibilitySummary {
  id: string;
  owner: string;
  openCount: number;
  overdueCount: number;
  href: string;
  sourceLabel: string;
  derivationRule: string;
}

export interface HomeStorageNotice {
  title: string;
  message: string;
  tone: PortalItemTone;
  href: string;
}

export interface HomeReadModel {
  context: HomeContextSummary;
  firstUse: boolean;
  localStatusLabel: string;
  localStatusDetail: string;
  continueWork: ContinueWorkItem[];
  attention: HomeAttentionItem[];
  plantStatus: PlantStatusItem[];
  quickActions: QuickActionItem[];
  activity: PortalActivityItem[];
  responsibilities: ResponsibilitySummary[];
  storageNotice: HomeStorageNotice | null;
}

export interface HomeQueryInput {
  diagnostics: PersistenceDiagnostics;
  now?: Date | string;
  locations: LocationRecord[];
  processes: ProcessRecord[];
  equipment: EquipmentRecord[];
  chemicals: ChemicalRecord[];
  hazards: HazardRecord[];
  controls: ControlRecord[];
  riskAssessments: RiskAssessmentRecord[];
  segs: SegRecord[];
  exposureMonitoring: ExposureMonitoringRecord[];
  findings: FindingRecord[];
  incidents: IncidentRecord[];
  complianceItems: ComplianceItemRecord[];
  correctiveActions: CorrectiveActionRecord[];
}
