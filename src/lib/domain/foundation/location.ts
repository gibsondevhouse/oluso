import type { RecordEnvelope } from "$lib/data/database";

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

export interface FoundationLocation extends RecordEnvelope {
  name: string;
  nodeType: LocationNodeType;
  parentId: string | null;
  resolvedSiteId: string | null;
  status?: string;
  description?: string;
}

const VALID_PARENTS: Record<LocationNodeType, readonly LocationNodeType[]> = {
  Country: [],
  StateOrRegion: ["Country"],
  Site: ["StateOrRegion"],
  Building: ["Site"],
  Unit: ["Site", "Building"],
  Zone: ["Site", "Building", "Unit"],
  Subzone: ["Zone", "Unit"],
  Room: ["Building", "Unit", "Zone", "Subzone"],
  StorageArea: ["Site", "Building", "Unit", "Zone"],
  OutdoorArea: ["Site"],
  MobileArea: ["Site"],
};

export function isValidLocationParent(
  nodeType: LocationNodeType,
  parent: FoundationLocation | null,
) {
  if (nodeType === "Country") return parent === null;
  return Boolean(parent && VALID_PARENTS[nodeType].includes(parent.nodeType));
}

export function resolveSiteForLocation(
  nodeType: LocationNodeType,
  id: string,
  parent: FoundationLocation | null,
) {
  if (nodeType === "Site") return id;
  if (nodeType === "Country" || nodeType === "StateOrRegion") return null;
  return parent?.nodeType === "Site" ? parent.id : parent?.resolvedSiteId ?? null;
}
