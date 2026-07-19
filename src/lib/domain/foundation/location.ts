import { FOUNDATION_RECORD_STATUSES, requiredChoice, requiredText, result, validateBusinessId, type FoundationRecordMetadata, type FoundationRecordStatus } from "./validation";

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
  Subzone: ["Zone"],
  Room: ["Building", "Unit", "Zone"],
  StorageArea: ["Site", "Building", "Unit", "Zone"],
  OutdoorArea: ["Site"],
  MobileArea: ["Site"],
};

export interface Location extends FoundationRecordMetadata {
  name: string;
  nodeType: LocationNodeType;
  parentId: string | null;
  resolvedSiteId: string | null;
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
