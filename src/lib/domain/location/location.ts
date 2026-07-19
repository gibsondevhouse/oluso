import {
  FOUNDATION_RECORD_STATUSES,
  requiredChoice,
  requiredText,
  result,
  validateBusinessId,
  type FoundationRecordMetadata,
  type FoundationRecordStatus,
} from "../foundation/validation";

export const GEOGRAPHIC_LOCATION_NODE_TYPES = [
  "Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality",
] as const;
export const PHYSICAL_LOCATION_NODE_TYPES = [
  "Site", "Facility", "Building", "Floor", "Unit", "Zone", "Subzone", "Room",
  "StorageArea", "OutdoorArea", "MobileArea",
] as const;
export const LOCATION_NODE_TYPES = [...GEOGRAPHIC_LOCATION_NODE_TYPES, ...PHYSICAL_LOCATION_NODE_TYPES] as const;
export type GeographicLocationNodeType = (typeof GEOGRAPHIC_LOCATION_NODE_TYPES)[number];
export type PhysicalLocationNodeType = (typeof PHYSICAL_LOCATION_NODE_TYPES)[number];
export type LocationNodeType = (typeof LOCATION_NODE_TYPES)[number];

export const LOCATION_PARENT_TYPES: Record<LocationNodeType, readonly LocationNodeType[]> = {
  Country: [],
  StateOrProvince: ["Country"],
  CountyOrDistrict: ["StateOrProvince"],
  CityOrMunicipality: ["StateOrProvince", "CountyOrDistrict"],
  Site: ["CityOrMunicipality", "CountyOrDistrict"],
  Facility: ["Site"],
  Building: ["Site", "Facility"],
  Floor: ["Building"],
  Unit: ["Facility", "Building", "Floor"],
  Zone: ["Site", "Facility", "Building", "Floor", "Unit"],
  Subzone: ["Zone", "Unit"],
  Room: ["Building", "Floor", "Unit", "Zone", "Subzone"],
  StorageArea: ["Site", "Facility", "Building", "Floor", "Unit", "Zone", "Subzone"],
  OutdoorArea: ["Site", "Facility"],
  MobileArea: ["Site"],
};

export interface FoundationLocation extends FoundationRecordMetadata {
  name: string;
  nodeType: LocationNodeType;
  parentId: string | null;
  countryCode: string;
  stateOrProvinceCode: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  addressLine1: string;
  addressLine2: string;
  resolvedCountryId: string | null;
  resolvedStateOrProvinceId: string | null;
  resolvedCountyOrDistrictId: string | null;
  resolvedCityOrMunicipalityId: string | null;
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
  countryCode?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  addressLine1?: string;
  addressLine2?: string;
  description?: string;
  status: FoundationRecordStatus;
}

export interface ResolvedLocationAncestry {
  resolvedCountryId: string | null;
  resolvedStateOrProvinceId: string | null;
  resolvedCountyOrDistrictId: string | null;
  resolvedCityOrMunicipalityId: string | null;
  resolvedSiteId: string | null;
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
  if (input.latitude !== undefined && input.latitude !== null && (input.latitude < -90 || input.latitude > 90)) {
    issues.push({ field: "latitude", message: "Latitude must be between -90 and 90.", code: "INVALID_RANGE" });
  }
  if (input.longitude !== undefined && input.longitude !== null && (input.longitude < -180 || input.longitude > 180)) {
    issues.push({ field: "longitude", message: "Longitude must be between -180 and 180.", code: "INVALID_RANGE" });
  }
  return result(issues);
}

export function isGeographicLocation(nodeType: LocationNodeType): nodeType is GeographicLocationNodeType {
  return (GEOGRAPHIC_LOCATION_NODE_TYPES as readonly string[]).includes(nodeType);
}

export function isPhysicalLocation(nodeType: LocationNodeType): nodeType is PhysicalLocationNodeType {
  return (PHYSICAL_LOCATION_NODE_TYPES as readonly string[]).includes(nodeType);
}

/** Compatibility name used by the released Foundation services. */
export const isOperationalLocation = isPhysicalLocation;

export function isValidLocationParent(nodeType: LocationNodeType, parent: FoundationLocation | null) {
  if (nodeType === "Country") return parent === null;
  return Boolean(parent && LOCATION_PARENT_TYPES[nodeType].includes(parent.nodeType));
}

export function resolveLocationAncestry(
  nodeType: LocationNodeType,
  id: string,
  parent: FoundationLocation | null,
): ResolvedLocationAncestry {
  return {
    resolvedCountryId: nodeType === "Country" ? id : parent?.resolvedCountryId ?? null,
    resolvedStateOrProvinceId: nodeType === "StateOrProvince" ? id : parent?.resolvedStateOrProvinceId ?? null,
    resolvedCountyOrDistrictId: nodeType === "CountyOrDistrict" ? id : parent?.resolvedCountyOrDistrictId ?? null,
    resolvedCityOrMunicipalityId: nodeType === "CityOrMunicipality" ? id : parent?.resolvedCityOrMunicipalityId ?? null,
    resolvedSiteId: nodeType === "Site" ? id : parent?.resolvedSiteId ?? null,
  };
}

export function resolveSiteForLocation(nodeType: LocationNodeType, id: string, parent: FoundationLocation | null) {
  return resolveLocationAncestry(nodeType, id, parent).resolvedSiteId;
}
