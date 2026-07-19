import type { FoundationServices } from "$lib/application/foundation";
import type { DetailSection } from "$lib/components/register/RecordDetailLayout.svelte";
import type { RelationshipSection } from "$lib/components/register/RelationshipPanel.svelte";
import type { RegisterTableColumn } from "$lib/components/register/register-table.types";
import {
  FOUNDATION_RECORD_STATUSES,
  LOCATION_NODE_TYPES,
  LOCATION_PARENT_TYPES,
  ORGANIZATION_TYPES,
  PERSON_TYPES,
  PROCESS_TYPES,
  TASK_TYPES,
  ValidationError,
  issuesByField,
  validateLocation,
  validateOrganization,
  validatePerson,
  validateProcess,
  validateTask,
  type FoundationRecordStatus,
  type Location,
  type LocationFields,
  type LocationNodeType,
  type Organization,
  type OrganizationFields,
  type OrganizationType,
  type Person,
  type PersonFields,
  type PersonType,
  type Process,
  type ProcessFields,
  type ProcessType,
  type Task,
  type TaskFields,
  type TaskType,
} from "$lib/domain/foundation";
import {
  ROUTINE_CLASSIFICATIONS,
  assignmentIsEffective,
  type LocationFunctionAssignment,
  type OperationalFunction,
  type ProcessLocationAssignment,
  type RoutineClassification,
} from "$lib/domain/operations";
import type {
  OrganizationFunctionResponsibility,
  OrganizationLocationAssignment,
} from "$lib/domain/enterprise";
import type { FoundationRouteKind } from "$lib/navigation/route-registry";

export type FoundationRecord = Organization | Person | Location | Process | Task;
export type FoundationFormValues = Record<string, string>;

export interface FoundationContext {
  organizations: Organization[];
  people: Person[];
  locations: Location[];
  operationalFunctions: OperationalFunction[];
  locationFunctionAssignments: LocationFunctionAssignment[];
  organizationLocationAssignments: OrganizationLocationAssignment[];
  organizationFunctionResponsibilities: OrganizationFunctionResponsibility[];
  processes: Process[];
  processLocationAssignments: ProcessLocationAssignment[];
  tasks: Task[];
}

export interface FoundationFormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "checkbox";
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  disabled?: boolean;
}

export interface FoundationUiConfig {
  kind: FoundationRouteKind;
  recordType: string;
  basePath: string;
  breadcrumbs: string;
  title: string;
  recordLabel: string;
  pluralRecordLabel: string;
  summary: string;
  emptyMessage: string;
  newActionLabel: string;
  titleOf(record: FoundationRecord): string;
  records(context: FoundationContext): FoundationRecord[];
  get(services: FoundationServices, id: string): Promise<FoundationRecord>;
  create(services: FoundationServices, values: FoundationFormValues): Promise<FoundationRecord>;
  update(
    services: FoundationServices,
    id: string,
    values: FoundationFormValues,
    expectedRevision: number,
  ): Promise<FoundationRecord>;
  archive(
    services: FoundationServices,
    id: string,
    expectedRevision: number,
    reason: string,
  ): Promise<FoundationRecord>;
  restore(
    services: FoundationServices,
    id: string,
    expectedRevision: number,
  ): Promise<FoundationRecord>;
  validate(values: FoundationFormValues): Record<string, string | undefined>;
  initialValues(record: FoundationRecord | null): FoundationFormValues;
  fields(
    context: FoundationContext,
    values: FoundationFormValues,
    record: FoundationRecord | null,
  ): FoundationFormField[];
  columns(context: FoundationContext): RegisterTableColumn<FoundationRecord>[];
  detailSections(record: FoundationRecord, context: FoundationContext): DetailSection[];
  relationshipSections(record: FoundationRecord, context: FoundationContext): RelationshipSection[];
  siteFilterValues(record: FoundationRecord): string[];
}

const blank = { value: "", label: "Select…" };
const statusOptions = FOUNDATION_RECORD_STATUSES.map(option);

function option(value: string) {
  return { value, label: value };
}

function recordOption(record: FoundationRecord, title: string) {
  return {
    value: record.id,
    label: `${title} (${record.businessId})${record.lifecycleStatus === "archived" ? " — Archived" : ""}`,
  };
}

function active<T extends FoundationRecord>(records: T[]) {
  return records.filter((record) => record.lifecycleStatus === "active");
}

function statusTone(record: FoundationRecord) {
  if (record.lifecycleStatus === "archived" || record.status === "Inactive") return "inactive";
  return record.status === "Active" ? "positive" : "review";
}

function commonColumns(
  typeAccessor: (record: FoundationRecord) => string,
): RegisterTableColumn<FoundationRecord>[] {
  return [
    {
      key: "businessId",
      label: "Business ID",
      accessor: (record) => record.businessId,
      searchable: true,
      sortable: true,
      width: "140px",
    },
    {
      key: "name",
      label: "Name",
      accessor: titleFor,
      descriptionAccessor: typeAccessor,
      searchable: true,
      sortable: true,
      primary: true,
    },
    {
      key: "type",
      label: "Type",
      accessor: typeAccessor,
      searchable: true,
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      accessor: (record) => record.lifecycleStatus === "archived" ? "Archived" : record.status,
      toneAccessor: statusTone,
      cellKind: "status",
      sortable: true,
    },
    {
      key: "revision",
      label: "Revision",
      accessor: (record) => record.revision,
      sortable: true,
      width: "90px",
    },
  ];
}

function titleFor(record: FoundationRecord) {
  if ("displayName" in record) return record.displayName;
  return record.name;
}

function commonFields(
  typeName: string,
  typeOptions: readonly string[],
  businessIdLocked = false,
): FoundationFormField[] {
  return [
    {
      name: "businessId",
      label: "Business ID",
      type: "text",
      helperText: businessIdLocked
        ? "Business ID is immutable after creation."
        : "Leave blank to generate the next stable business identifier.",
      disabled: businessIdLocked,
    },
    { name: "name", label: "Name", type: "text", required: true },
    { name: typeName, label: "Type", type: "select", required: true, options: typeOptions.map(option) },
    { name: "status", label: "Status", type: "select", required: true, options: statusOptions },
    { name: "description", label: "Description", type: "textarea", rows: 3 },
  ];
}

function commonInitial(record: FoundationRecord | null) {
  return {
    businessId: record?.businessId ?? "",
    status: record?.status ?? "Active",
    description: record?.description ?? "",
  };
}

function commonDetails(record: FoundationRecord): DetailSection[] {
  return [
    {
      title: "Record",
      fields: [
        { label: "Business ID", value: record.businessId },
        { label: "Status", value: record.status },
        { label: "Description", value: record.description },
      ],
    },
    {
      title: "Revision context",
      fields: [
        { label: "Revision", value: String(record.revision) },
        { label: "Origin installation", value: record.originInstallationId },
        { label: "Last exchange package", value: record.lastExchangePackageId ?? "Local change" },
      ],
    },
  ];
}

function relationshipItem(
  id: string | null,
  records: FoundationRecord[],
  href: (id: string) => string,
  label: string,
) {
  if (!id) return [];
  const record = records.find((candidate) => candidate.id === id);
  return [{
    id,
    title: record ? titleFor(record) : `${label} ${id}`,
    href: record ? href(record.id) : undefined,
    meta: record ? record.businessId : `${label} record is missing.`,
    archived: record?.lifecycleStatus === "archived",
    missing: !record,
  }];
}

function descendants(locationId: string, locations: Location[]) {
  const found: Location[] = [];
  const pending = locations.filter((location) => location.parentId === locationId);
  while (pending.length) {
    const next = pending.shift()!;
    found.push(next);
    pending.push(...locations.filter((location) => location.parentId === next.id));
  }
  return found;
}

function organizationDescendants(organizationId: string, organizations: Organization[]) {
  const found: Organization[] = [];
  const pending = organizations.filter((organization) => organization.parentOrganizationId === organizationId);
  while (pending.length) {
    const next = pending.shift()!;
    if (found.some((candidate) => candidate.id === next.id)) continue;
    found.push(next);
    pending.push(...organizations.filter((organization) => organization.parentOrganizationId === next.id));
  }
  return found;
}

function locationPath(location: Location, locations: Location[]) {
  const path = [location.name];
  const seen = new Set([location.id]);
  let parentId = location.parentId;
  while (parentId) {
    const parent = locations.find((candidate) => candidate.id === parentId);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    path.unshift(parent.name);
    parentId = parent.parentId;
  }
  return path.join(" › ");
}

const organizationConfig: FoundationUiConfig = {
  kind: "organizations",
  recordType: "Organization",
  basePath: "/people/organizations",
  breadcrumbs: "People and Work",
  title: "Organizations",
  recordLabel: "organization",
  pluralRecordLabel: "organizations",
  summary: "Manage internal entities, departments, contractors, vendors, and other HSE organizations in IndexedDB.",
  emptyMessage: "Create the first organization used by people and operational relationships.",
  newActionLabel: "New organization",
  titleOf: titleFor,
  records: (context) => context.organizations,
  get: (services, id) => services.organizations.get(id, true),
  create: (services, values) => services.organizations.create(organizationInput(values)),
  update: (services, id, values, revision) => services.organizations.update(id, organizationInput(values), revision),
  archive: (services, id, revision, reason) => services.organizations.archive(id, revision, reason),
  restore: (services, id, revision) => services.organizations.restore(id, revision),
  validate: (values) => issuesByField(validateOrganization(organizationInput(values))),
  initialValues: (record) => {
    const organization = record as Organization | null;
    return {
      ...commonInitial(record),
      name: organization?.name ?? "",
      organizationType: organization?.organizationType ?? "Contractor",
      parentOrganizationId: organization?.parentOrganizationId ?? "",
      organizationCode: organization?.organizationCode ?? "",
      legalEntityCode: organization?.legalEntityCode ?? "",
      countryCode: organization?.countryCode ?? "",
      primaryContactPersonId: organization?.primaryContactPersonId ?? "",
    };
  },
  fields: (context, _values, record) => {
    const blocked = record ? new Set([record.id, ...organizationDescendants(record.id, context.organizations).map((item) => item.id)]) : new Set<string>();
    return [
    ...commonFields("organizationType", ORGANIZATION_TYPES, Boolean(record)),
    {
      name: "parentOrganizationId", label: "Parent Organization", type: "select",
      helperText: "Internal corporate, regional, country, Site, and Department hierarchy is explicit.",
      options: [blank, ...active(context.organizations).filter((item) => !blocked.has(item.id)).map((item) => recordOption(item, item.name))],
    },
    { name: "organizationCode", label: "Organization code", type: "text" },
    { name: "legalEntityCode", label: "Legal entity code", type: "text" },
    { name: "countryCode", label: "Country code", type: "text" },
    {
      name: "primaryContactPersonId",
      label: "Primary contact",
      type: "select",
      options: [blank, ...active(context.people).map((person) => recordOption(person, person.displayName))],
    },
  ];
  },
  columns: () => commonColumns((record) => (record as Organization).organizationType),
  detailSections: (record) => [
    ...commonDetails(record),
    { title: "Organization", fields: [
      { label: "Type", value: (record as Organization).organizationType },
      { label: "Organization code", value: (record as Organization).organizationCode || "—" },
      { label: "Legal entity code", value: (record as Organization).legalEntityCode || "—" },
      { label: "Country code", value: (record as Organization).countryCode || "—" },
    ] },
  ],
  relationshipSections: (record, context) => [{
    title: "Primary contact",
    items: relationshipItem(
      (record as Organization).primaryContactPersonId,
      context.people,
      (id) => `/people/workers/${encodeURIComponent(id)}`,
      "Person",
    ),
  }, {
    title: "Parent Organization",
    items: relationshipItem((record as Organization).parentOrganizationId, context.organizations, (id) => `/people/organizations/${encodeURIComponent(id)}`, "Organization"),
  }, {
    title: "Child Organizations",
    items: context.organizations.filter((organization) => organization.parentOrganizationId === record.id).map((organization) => ({
      id: organization.id, title: organization.name, href: `/people/organizations/${encodeURIComponent(organization.id)}`,
      meta: organization.organizationType, archived: organization.lifecycleStatus === "archived",
    })),
  }, {
    title: "People",
    items: context.people.filter((person) => person.organizationId === record.id).map((person) => ({
      id: person.id,
      title: person.displayName,
      href: `/people/workers/${encodeURIComponent(person.id)}`,
      meta: person.jobTitle || person.personType,
      archived: person.lifecycleStatus === "archived",
    })),
  }],
  siteFilterValues: () => [],
};

const personConfig: FoundationUiConfig = {
  kind: "people",
  recordType: "Person",
  basePath: "/people/workers",
  breadcrumbs: "People and Work",
  title: "People",
  recordLabel: "person",
  pluralRecordLabel: "people",
  summary: "Manage employees, contractors, and HSE-relevant contacts with typed organization and Site relationships.",
  emptyMessage: "Create the first person used by HSE assignments and reviews.",
  newActionLabel: "New person",
  titleOf: titleFor,
  records: (context) => context.people,
  get: (services, id) => services.people.get(id, true),
  create: (services, values) => services.people.create(personInput(values)),
  update: (services, id, values, revision) => services.people.update(id, personInput(values), revision),
  archive: (services, id, revision, reason) => services.people.archive(id, revision, reason),
  restore: (services, id, revision) => services.people.restore(id, revision),
  validate: (values) => issuesByField(validatePerson(personInput(values))),
  initialValues: (record) => {
    const person = record as Person | null;
    return {
      ...commonInitial(record),
      name: person?.displayName ?? "",
      personType: person?.personType ?? "Employee",
      organizationId: person?.organizationId ?? "",
      employeeIdentifier: person?.employeeIdentifier ?? "",
      jobTitle: person?.jobTitle ?? "",
      department: person?.department ?? "",
      supervisorPersonId: person?.supervisorPersonId ?? "",
      primarySiteId: person?.primarySiteId ?? "",
      email: person?.email ?? "",
      phone: person?.phone ?? "",
    };
  },
  fields: (context, _values, record) => [
    ...commonFields("personType", PERSON_TYPES, Boolean(record)).map((field) => field.name === "name" ? { ...field, label: "Display name" } : field),
    { name: "employeeIdentifier", label: "Employee / worker ID", type: "text" },
    { name: "jobTitle", label: "Job title", type: "text" },
    { name: "department", label: "Department", type: "text" },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      options: [blank, ...active(context.organizations).map((organization) => recordOption(organization, organization.name))],
    },
    {
      name: "supervisorPersonId",
      label: "Supervisor",
      type: "select",
      options: [blank, ...active(context.people).filter((person) => person.id !== record?.id).map((person) => recordOption(person, person.displayName))],
    },
    {
      name: "primarySiteId",
      label: "Primary Site",
      type: "select",
      options: [blank, ...active(context.locations).filter((location) => location.nodeType === "Site").map((site) => recordOption(site, site.name))],
    },
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
  ],
  columns: (context) => [
    ...commonColumns((record) => (record as Person).personType),
    {
      key: "organization",
      label: "Organization",
      accessor: (record) => context.organizations.find((organization) => organization.id === (record as Person).organizationId)?.name ?? "—",
      searchable: true,
      sortable: true,
    },
  ],
  detailSections: (record) => {
    const person = record as Person;
    return [...commonDetails(record), {
      title: "Person",
      fields: [
        { label: "Type", value: person.personType },
        { label: "Employee / worker ID", value: person.employeeIdentifier },
        { label: "Job title", value: person.jobTitle },
        { label: "Department", value: person.department },
        { label: "Email", value: person.email },
        { label: "Phone", value: person.phone },
      ],
    }];
  },
  relationshipSections: (record, context) => {
    const person = record as Person;
    return [{
      title: "Organization",
      items: relationshipItem(person.organizationId, context.organizations, (id) => `/people/organizations/${encodeURIComponent(id)}`, "Organization"),
    }, {
      title: "Supervisor",
      items: relationshipItem(person.supervisorPersonId, context.people, (id) => `/people/workers/${encodeURIComponent(id)}`, "Person"),
    }, {
      title: "Primary Site",
      items: relationshipItem(person.primarySiteId, context.locations, (id) => `/operations/locations/${encodeURIComponent(id)}`, "Location"),
    }];
  },
  siteFilterValues: (record) => [(record as Person).primarySiteId].filter(Boolean) as string[],
};

const locationConfig: FoundationUiConfig = {
  kind: "locations",
  recordType: "Location",
  basePath: "/operations/locations",
  breadcrumbs: "Operations",
  title: "Locations",
  recordLabel: "location",
  pluralRecordLabel: "locations",
  summary: "Manage geography and operational hierarchy with enforced parent rules and Site resolution.",
  emptyMessage: "Create a Country to begin the operational location hierarchy.",
  newActionLabel: "New location",
  titleOf: titleFor,
  records: (context) => context.locations,
  get: (services, id) => services.locations.get(id, true),
  create: (services, values) => services.locations.create(locationInput(values)),
  update: (services, id, values, revision) => services.locations.update(id, locationInput(values), revision),
  archive: (services, id, revision, reason) => services.locations.archive(id, revision, reason),
  restore: (services, id, revision) => services.locations.restore(id, revision),
  validate: (values) => issuesByField(validateLocation(locationInput(values))),
  initialValues: (record) => {
    const location = record as Location | null;
    return {
      ...commonInitial(record),
      name: location?.name ?? "",
      nodeType: location?.nodeType ?? "Country",
      parentId: location?.parentId ?? "",
      countryCode: location?.countryCode ?? "",
      stateOrProvinceCode: location?.stateOrProvinceCode ?? "",
      postalCode: location?.postalCode ?? "",
      latitude: location?.latitude?.toString() ?? "",
      longitude: location?.longitude?.toString() ?? "",
      addressLine1: location?.addressLine1 ?? "",
      addressLine2: location?.addressLine2 ?? "",
    };
  },
  fields: (context, values, record) => {
    const nodeType = values.nodeType as LocationNodeType;
    const blockedIds = record
      ? new Set([record.id, ...descendants(record.id, context.locations).map((location) => location.id)])
      : new Set<string>();
    const allowedParents = active(context.locations).filter(
      (location) => LOCATION_PARENT_TYPES[nodeType]?.includes(location.nodeType) && !blockedIds.has(location.id),
    );
    return [
      ...commonFields("nodeType", LOCATION_NODE_TYPES, Boolean(record)),
      {
        name: "parentId",
        label: "Parent location",
        type: "select",
        required: nodeType !== "Country",
        helperText: nodeType === "Country" ? "Countries are hierarchy roots." : `Valid parents: ${LOCATION_PARENT_TYPES[nodeType]?.join(", ") || "none"}.`,
        options: [blank, ...allowedParents.map((location) => recordOption(location, locationPath(location, context.locations)))],
      },
      { name: "countryCode", label: "Country code", type: "text" },
      { name: "stateOrProvinceCode", label: "State / Province code", type: "text" },
      { name: "postalCode", label: "Postal code", type: "text" },
      { name: "latitude", label: "Latitude", type: "text" },
      { name: "longitude", label: "Longitude", type: "text" },
      { name: "addressLine1", label: "Address line 1", type: "text" },
      { name: "addressLine2", label: "Address line 2", type: "text" },
    ];
  },
  columns: (context) => [
    ...commonColumns((record) => (record as Location).nodeType),
    {
      key: "path",
      label: "Hierarchy path",
      accessor: (record) => locationPath(record as Location, context.locations),
      searchable: true,
      sortable: true,
    },
    {
      key: "site",
      label: "Resolved Site",
      accessor: (record) => {
        const location = record as Location;
        return context.locations.find((candidate) => candidate.id === location.resolvedSiteId)?.name ?? "—";
      },
      searchable: true,
      sortable: true,
    },
  ],
  detailSections: (record, context) => {
    const location = record as Location;
    const children = context.locations.filter((candidate) => candidate.parentId === location.id);
    const allDescendants = descendants(location.id, context.locations);
    return [...commonDetails(record), {
      title: "Hierarchy",
      fields: [
        { label: "Node type", value: location.nodeType },
        { label: "Breadcrumb", value: locationPath(location, context.locations) },
        { label: "Resolved Site", value: context.locations.find((site) => site.id === location.resolvedSiteId)?.name ?? "Not applicable" },
        { label: "Resolved Country", value: context.locations.find((item) => item.id === location.resolvedCountryId)?.name ?? "Not applicable" },
        { label: "Resolved State / Province", value: context.locations.find((item) => item.id === location.resolvedStateOrProvinceId)?.name ?? "Not applicable" },
        { label: "Resolved County / District", value: context.locations.find((item) => item.id === location.resolvedCountyOrDistrictId)?.name ?? "Not applicable" },
        { label: "Resolved City / Municipality", value: context.locations.find((item) => item.id === location.resolvedCityOrMunicipalityId)?.name ?? "Not applicable" },
        { label: "Direct children", value: String(children.length) },
        { label: "All descendants", value: String(allDescendants.length) },
      ],
    }, {
      title: "Location workspace",
      fields: [
        { label: "Overview", value: location.description || "No description" },
        { label: "Parent and ancestry", value: locationPath(location, context.locations) },
        { label: "Resolved geography", value: [location.resolvedCountryId, location.resolvedStateOrProvinceId, location.resolvedCountyOrDistrictId, location.resolvedCityOrMunicipalityId].filter(Boolean).length + " resolved levels" },
        { label: "Owning or operating Organizations", value: String(context.organizationLocationAssignments.filter((item) => item.locationId === location.id).length) },
        { label: "Assigned Functions", value: String(context.locationFunctionAssignments.filter((item) => item.locationId === location.id).length) },
        { label: "Processes", value: String(context.processLocationAssignments.filter((item) => item.locationId === location.id).length) },
        { label: "Equipment", value: "Available in Equipment register" },
        { label: "Chemical Inventory", value: "Available in Site Chemical Inventory" },
        { label: "Chemical Uses", value: "Available in Chemical Uses" },
        { label: "People and SEGs", value: `${context.people.filter((item) => item.primarySiteId === location.resolvedSiteId).length} people in resolved Site` },
        { label: "Exposure Scenarios", value: "Available in Industrial Hygiene" },
        { label: "Findings and Actions", value: "Available in Field Work and Actions" },
        { label: "Record History", value: "Shown below with immutable revisions" },
        { label: "Data Quality", value: "Available in migration review" },
      ],
    }];
  },
  relationshipSections: (record, context) => {
    const location = record as Location;
    return [{
      title: "Parent",
      items: relationshipItem(location.parentId, context.locations, (id) => `/operations/locations/${encodeURIComponent(id)}`, "Location"),
    }, {
      title: "Children",
      items: context.locations.filter((candidate) => candidate.parentId === location.id).map((child) => ({
        id: child.id,
        title: child.name,
        href: `/operations/locations/${encodeURIComponent(child.id)}`,
        meta: child.nodeType,
        archived: child.lifecycleStatus === "archived",
      })),
    }, {
      title: "Assigned Functions",
      items: context.locationFunctionAssignments.filter((assignment) => assignment.locationId === location.id).map((assignment) => ({
        id: assignment.id,
        title: context.operationalFunctions.find((item) => item.id === assignment.operationalFunctionId)?.name ?? "Missing Function",
        meta: `${assignment.assignmentType}${assignment.isPrimary ? " · Primary" : ""}`,
        archived: assignment.lifecycleStatus === "archived",
      })),
    }, {
      title: "Organizations",
      items: context.organizationLocationAssignments.filter((assignment) => assignment.locationId === location.id).map((assignment) => ({
        id: assignment.id,
        title: context.organizations.find((item) => item.id === assignment.organizationId)?.name ?? "Missing Organization",
        meta: assignment.relationshipType,
        archived: assignment.lifecycleStatus === "archived",
      })),
    }];
  },
  siteFilterValues: (record) => [(record as Location).resolvedSiteId].filter(Boolean) as string[],
};

const processConfig: FoundationUiConfig = {
  kind: "processes",
  recordType: "Process",
  basePath: "/operations/processes",
  breadcrumbs: "Operations",
  title: "Processes",
  recordLabel: "process",
  pluralRecordLabel: "processes",
  summary: "Manage operational processes whose primary locations resolve to a valid Site.",
  emptyMessage: "Create the first Site-resolved process.",
  newActionLabel: "New process",
  titleOf: titleFor,
  records: (context) => context.processes,
  get: (services, id) => services.processes.get(id, true),
  create: async (services, values) => {
    await requireProcessLocationAtSelectedSite(services, values);
    return services.processes.create(processInput(values));
  },
  update: async (services, id, values, revision) => {
    await requireProcessLocationAtSelectedSite(services, values);
    return services.processes.update(id, processInput(values), revision);
  },
  archive: (services, id, revision, reason) => services.processes.archive(id, revision, reason),
  restore: (services, id, revision) => services.processes.restore(id, revision),
  validate: (values) => issuesByField(validateProcess(processInput(values))),
  initialValues: (record) => {
    const process = record as Process | null;
    return {
      ...commonInitial(record),
      name: process?.name ?? "",
      processType: process?.processType ?? "Production",
      siteId: process?.resolvedSiteId ?? "",
      primaryLocationId: process?.primaryLocationId ?? "",
      operationalFunctionId: process?.operationalFunctionId ?? "",
    };
  },
  fields: (context, values, record) => {
    const availableFunctionIds = new Set(context.locationFunctionAssignments
      .filter((assignment) => assignment.locationId === values.primaryLocationId && assignmentIsEffective(assignment))
      .map((assignment) => assignment.operationalFunctionId));
    return [
    ...commonFields("processType", PROCESS_TYPES, Boolean(record)),
    {
      name: "siteId",
      label: "Site",
      type: "select",
      required: true,
      helperText: "Select the Site first to scope eligible physical Locations.",
      options: [blank, ...active(context.locations)
        .filter((location) => location.nodeType === "Site")
        .map((location) => recordOption(location, locationPath(location, context.locations)))],
    },
    {
      name: "primaryLocationId",
      label: "Primary location",
      type: "select",
      required: true,
      helperText: values.siteId ? "Only physical Locations resolving to the selected Site are available." : "Select a Site first.",
      options: [blank, ...active(context.locations)
        .filter((location) => Boolean(values.siteId) && location.resolvedSiteId === values.siteId)
        .map((location) => recordOption(location, locationPath(location, context.locations)))],
    },
    {
      name: "operationalFunctionId", label: "Operational Function", type: "select", required: true,
      helperText: values.primaryLocationId ? "Only active Functions assigned to the selected Location are available." : "Select a Location first.",
      options: [blank, ...context.operationalFunctions.filter((item) => item.lifecycleStatus === "active" && item.status === "Active" && availableFunctionIds.has(item.id)).map((item) => ({
        value: item.id, label: `${item.name} (${item.businessId})`,
      }))],
    },
  ];
  },
  columns: (context) => [
    ...commonColumns((record) => (record as Process).processType),
    { key: "location", label: "Location", accessor: (record) => context.locations.find((location) => location.id === (record as Process).primaryLocationId)?.name ?? "Missing", searchable: true, sortable: true },
    { key: "function", label: "Function", accessor: (record) => context.operationalFunctions.find((item) => item.id === (record as Process).operationalFunctionId)?.name ?? "Missing", searchable: true, sortable: true },
    { key: "site", label: "Site", accessor: (record) => context.locations.find((location) => location.id === (record as Process).resolvedSiteId)?.name ?? "Missing", searchable: true, sortable: true },
  ],
  detailSections: (record, context) => {
    const process = record as Process;
    return [...commonDetails(record), {
      title: "Operational context",
      fields: [
        { label: "Process type", value: process.processType },
        { label: "Operational Function", value: context.operationalFunctions.find((item) => item.id === process.operationalFunctionId)?.name ?? "Missing relationship" },
        { label: "Location", value: context.locations.find((location) => location.id === process.primaryLocationId)?.name ?? "Missing relationship" },
        { label: "Site", value: context.locations.find((location) => location.id === process.resolvedSiteId)?.name ?? "Missing relationship" },
      ],
    }, {
      title: "Typed downstream relationship slots",
      fields: [
        { label: "Tasks", value: String(context.tasks.filter((task) => task.processId === process.id).length) },
        { label: "Equipment", value: "0 — foundation slot ready" },
        { label: "Chemical uses", value: "0 — foundation slot ready" },
        { label: "SEGs", value: "0 — foundation slot ready" },
        { label: "Exposure scenarios", value: "0 — foundation slot ready" },
        { label: "Open findings", value: "0 — foundation slot ready" },
        { label: "Open actions", value: "0 — foundation slot ready" },
      ],
    }];
  },
  relationshipSections: (record, context) => {
    const process = record as Process;
    return [{
      title: "Primary location",
      items: relationshipItem(process.primaryLocationId, context.locations, (id) => `/operations/locations/${encodeURIComponent(id)}`, "Location"),
    }, {
      title: "Tasks",
      items: context.tasks.filter((task) => task.processId === process.id).map((task) => ({
        id: task.id,
        title: task.name,
        href: `/operations/tasks/${encodeURIComponent(task.id)}`,
        meta: task.routineClassification,
        archived: task.lifecycleStatus === "archived",
      })),
    }];
  },
  siteFilterValues: (record) => [(record as Process).resolvedSiteId],
};

const taskConfig: FoundationUiConfig = {
  kind: "tasks",
  recordType: "Task",
  basePath: "/operations/tasks",
  breadcrumbs: "Operations",
  title: "Tasks",
  recordLabel: "task",
  pluralRecordLabel: "tasks",
  summary: "Manage reusable operational tasks with Process, Location, Site, and descriptive routine classification.",
  emptyMessage: "Create the first task under an active process.",
  newActionLabel: "New task",
  titleOf: titleFor,
  records: (context) => context.tasks,
  get: (services, id) => services.tasks.get(id, true),
  create: (services, values) => services.tasks.create(taskInput(values)),
  update: (services, id, values, revision) => services.tasks.update(id, taskInput(values), revision),
  archive: (services, id, revision, reason) => services.tasks.archive(id, revision, reason),
  restore: (services, id, revision) => services.tasks.restore(id, revision),
  validate: (values) => issuesByField(validateTask(taskInput(values))),
  initialValues: (record) => {
    const task = record as Task | null;
    return {
      ...commonInitial(record),
      name: task?.name ?? "",
      taskType: task?.taskType ?? "Routine Operation",
      processId: task?.processId ?? "",
      locationId: task?.locationId ?? "",
      routineClassification: task?.routineClassification ?? "Unknown",
    };
  },
  fields: (context, values, record) => {
    const process = context.processes.find((candidate) => candidate.id === values.processId);
    const locations = active(context.locations).filter(
      (location) => Boolean(location.resolvedSiteId) && (!process || location.resolvedSiteId === process.resolvedSiteId),
    );
    return [
      ...commonFields("taskType", TASK_TYPES, Boolean(record)),
      {
        name: "processId",
        label: "Process",
        type: "select",
        required: true,
        options: [blank, ...active(context.processes).map((candidate) => recordOption(candidate, candidate.name))],
      },
      {
        name: "locationId",
        label: "Location",
        type: "select",
        required: true,
        helperText: process ? "Only locations resolving to the Process Site are available." : "Select a Process to scope locations to its Site.",
        options: [blank, ...locations.map((location) => recordOption(location, locationPath(location, context.locations)))],
      },
      { name: "routineClassification", label: "Routine classification", type: "select", required: true, options: ROUTINE_CLASSIFICATIONS.map(option) },
    ];
  },
  columns: (context) => [
    ...commonColumns((record) => (record as Task).taskType),
    { key: "process", label: "Process", accessor: (record) => context.processes.find((process) => process.id === (record as Task).processId)?.name ?? "Missing", searchable: true, sortable: true },
    { key: "classification", label: "Routine classification", accessor: (record) => (record as Task).routineClassification, searchable: true, sortable: true },
    { key: "site", label: "Site", accessor: (record) => context.locations.find((location) => location.id === (record as Task).resolvedSiteId)?.name ?? "Missing", searchable: true, sortable: true },
  ],
  detailSections: (record, context) => {
    const task = record as Task;
    return [...commonDetails(record), {
      title: "Operational context",
      fields: [
        { label: "Task type", value: task.taskType },
        { label: "Routine classification", value: task.routineClassification },
        { label: "Process", value: context.processes.find((process) => process.id === task.processId)?.name ?? "Missing relationship" },
        { label: "Location", value: context.locations.find((location) => location.id === task.locationId)?.name ?? "Missing relationship" },
        { label: "Site", value: context.locations.find((location) => location.id === task.resolvedSiteId)?.name ?? "Missing relationship" },
      ],
    }, {
      title: "Typed downstream relationship slots",
      fields: [
        { label: "Equipment", value: "0 — foundation slot ready" },
        { label: "Chemical uses", value: "0 — foundation slot ready" },
        { label: "SEGs", value: "0 — foundation slot ready" },
        { label: "Exposure scenarios", value: "0 — foundation slot ready" },
        { label: "Hazards", value: "0 — foundation slot ready" },
        { label: "Controls", value: "0 — foundation slot ready" },
      ],
    }];
  },
  relationshipSections: (record, context) => {
    const task = record as Task;
    return [{
      title: "Parent Process",
      items: relationshipItem(task.processId, context.processes, (id) => `/operations/processes/${encodeURIComponent(id)}`, "Process"),
    }, {
      title: "Location",
      items: relationshipItem(task.locationId, context.locations, (id) => `/operations/locations/${encodeURIComponent(id)}`, "Location"),
    }];
  },
  siteFilterValues: (record) => [(record as Task).resolvedSiteId],
};

export function getFoundationUiConfig(kind: FoundationRouteKind) {
  switch (kind) {
    case "organizations": return organizationConfig;
    case "people": return personConfig;
    case "locations": return locationConfig;
    case "processes": return processConfig;
    case "tasks": return taskConfig;
  }
}

function organizationInput(values: FoundationFormValues): OrganizationFields {
  return {
    businessId: values.businessId,
    name: values.name,
    organizationType: values.organizationType as OrganizationType,
    parentOrganizationId: values.parentOrganizationId || null,
    organizationCode: values.organizationCode,
    legalEntityCode: values.legalEntityCode,
    countryCode: values.countryCode,
    status: values.status as FoundationRecordStatus,
    description: values.description,
    primaryContactPersonId: values.primaryContactPersonId || null,
  };
}

function personInput(values: FoundationFormValues): PersonFields {
  return {
    businessId: values.businessId,
    displayName: values.name,
    personType: values.personType as PersonType,
    organizationId: values.organizationId || null,
    employeeIdentifier: values.employeeIdentifier,
    jobTitle: values.jobTitle,
    department: values.department,
    supervisorPersonId: values.supervisorPersonId || null,
    primarySiteId: values.primarySiteId || null,
    email: values.email,
    phone: values.phone,
    description: values.description,
    status: values.status as FoundationRecordStatus,
  };
}

function locationInput(values: FoundationFormValues): LocationFields {
  return {
    businessId: values.businessId,
    name: values.name,
    nodeType: values.nodeType as LocationNodeType,
    parentId: values.parentId || null,
    countryCode: values.countryCode,
    stateOrProvinceCode: values.stateOrProvinceCode,
    postalCode: values.postalCode,
    latitude: values.latitude ? Number(values.latitude) : null,
    longitude: values.longitude ? Number(values.longitude) : null,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    description: values.description,
    status: values.status as FoundationRecordStatus,
  };
}

function processInput(values: FoundationFormValues): ProcessFields {
  return {
    businessId: values.businessId,
    name: values.name,
    processType: values.processType as ProcessType,
    operationalFunctionId: values.operationalFunctionId,
    primaryLocationId: values.primaryLocationId,
    description: values.description,
    status: values.status as FoundationRecordStatus,
  };
}

async function requireProcessLocationAtSelectedSite(
  services: FoundationServices,
  values: FoundationFormValues,
) {
  if (!values.siteId || !values.primaryLocationId) return;
  const location = await services.locations.get(values.primaryLocationId);
  if (location.resolvedSiteId !== values.siteId) {
    throw new ValidationError([{
      field: "primaryLocationId",
      message: "Primary Location must resolve to the selected Site.",
      code: "SITE_LOCATION_MISMATCH",
    }]);
  }
}

function taskInput(values: FoundationFormValues): TaskFields {
  return {
    businessId: values.businessId,
    name: values.name,
    taskType: values.taskType as TaskType,
    processId: values.processId,
    locationId: values.locationId,
    description: values.description,
    routineClassification: values.routineClassification as RoutineClassification,
    status: values.status as FoundationRecordStatus,
  };
}
