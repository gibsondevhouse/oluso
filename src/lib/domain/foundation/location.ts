import {
  FOUNDATION_RECORD_STATUSES,
  requiredChoice,
  requiredText,
  result,
  validateBusinessId,
  type FoundationRecordMetadata,
  type FoundationRecordStatus,
} from "./validation";

export const LOCATION_NODE_TYPES = [
  "Country",
  "StateOrRegion",
  "Site",
  "Building",
  "Unit",
  "Zone",
  "Subzone",
  "Room",
  "StorageArea",
  "OutdoorArea",
  "MobileArea",
] as const;

export type LocationNodeType = (typeof LOCATION_NODE_TYPES)[number];

export const LOCATION_PARENT_TYPES: Record<LocationNodeType, readonly LocationNodeType[]> = {
  Country: [],
  StateOrRegion: ["Country"],
  Site: ["StateOrRegion"],
  Building: ["Site", "Building"],
  Unit: ["Site", "Building"],
  Zone: ["Site", "Building", "Unit"],
  Subzone: ["Zone", "Unit"],
  Room: ["Building", "Unit", "Zone", "Subzone"],
  StorageArea: ["Site", "Building", "Unit", "Zone"],
  OutdoorArea: ["Site"],
  MobileArea: ["Site"],
};

export interface FoundationLocation extends FoundationRecordMetadata {
  name: string;
  nodeType: LocationNodeType;
  parentId: string | null;
  resolvedSiteId: string | null;
  description?: string;
  status?: FoundationRecordStatus;
}

export interface Location extends FoundationLocation {
  description: string;
  status: FoundationRecordStatus;
}

export interface LocationFields {
  businessId?: string;
  name: string;
  nodeType: LocationNodeType;
  parentId?: string | null;
  description?: string;
  status: FoundationRecordStatus;
}

export function validateLocation(input: LocationFields) {
  const issues = [
    ...validateBusinessId(input.businessId),
    ...requiredText(input.name, "name", "Name"),
    ...requiredChoice(input.nodeType, LOCATION_NODE_TYPES, "nodeType", "Node type"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ];
  if (input.nodeType === "Country" && input.parentId) {
    issues.push({ field: "parentId", message: "A Country cannot have a parent.", code: "INVALID_PARENT" });
  }
  if (input.nodeType !== "Country" && !input.parentId?.trim()) {
    issues.push({ field: "parentId", message: "Parent location is required.", code: "REQUIRED" });
  }
  return result(issues);
}

export function isOperationalLocation(nodeType: LocationNodeType) {
  return !["Country", "StateOrRegion"].includes(nodeType);
}

export function isValidLocationParent(
  nodeType: LocationNodeType,
  parent: FoundationLocation | null,
) {
  if (nodeType === "Country") return parent === null;
  return Boolean(parent && LOCATION_PARENT_TYPES[nodeType].includes(parent.nodeType));
}

export function resolveSiteForLocation(
  nodeType: LocationNodeType,
  id: string,
  parent: FoundationLocation | null,
) {
  if (nodeType === "Site") return id;
  if (!isOperationalLocation(nodeType)) return null;
  return parent?.nodeType === "Site" ? parent.id : parent?.resolvedSiteId ?? null;
}