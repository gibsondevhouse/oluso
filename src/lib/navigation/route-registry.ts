import {
  CAMPAIGN_REGISTER_DEFINITIONS,
  isCampaignRegisterKind,
  type CampaignRegisterKind,
} from "$lib/persistence/campaign-register.types";

export type RouteKind =
  | "dashboard"
  | "global-search"
  | "locations"
  | "findings"
  | "processes"
  | "equipment"
  | "exposure-monitoring"
  | "chemicals"
  | "hazards"
  | "controls"
  | "risk-assessments"
  | "segs"
  | "incidents"
  | "compliance-items"
  | "corrective-actions"
  | "exports"
  | "settings"
  | "profile"
  | "installation"
  | "chemical-substances"
  | "chemical-products"
  | "chemical-inventory"
  | "chemical-uses"
  | "chemical-migration"
  | "placeholder"
  | "not-found"
  | "error"
  | CampaignRegisterKind;

export type RegisterRouteKind = Extract<
  RouteKind,
  | "locations"
  | "findings"
  | "processes"
  | "equipment"
  | "exposure-monitoring"
  | "chemicals"
  | "hazards"
  | "controls"
  | "risk-assessments"
  | "segs"
  | "incidents"
  | "compliance-items"
  | "corrective-actions"
  | CampaignRegisterKind
>;

export type RouteMode = "list" | "new" | "detail" | "edit" | "sds-new" | "sds-detail" | "sds-edit";

export interface AppRoute {
  path: string;
  title: string;
  summary: string;
  section?: string;
  kind: RouteKind;
  mode?: RouteMode;
  basePath?: string;
  recordId?: string;
  parentRecordId?: string;
}

export interface ParentRedirect {
  path: string;
  redirectTo: string;
}

export const APP_ROUTES: AppRoute[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    summary: "Resume field work, review open actions, and jump back into core HSE registers.",
    section: "Dashboard",
    kind: "dashboard",
  },
  {
    path: "/search",
    title: "Global Search",
    summary: "Search active and archived records across all registers.",
    section: "Dashboard",
    kind: "global-search",
  },
  {
    path: "/master/substances",
    title: "Chemical Substances",
    summary: "Manage global canonical chemical identity independently of Products and Sites.",
    section: "Chemical Master Data",
    kind: "chemical-substances",
    mode: "list",
    basePath: "/master/substances",
  },
  {
    path: "/master/products",
    title: "Chemical Products",
    summary: "Manage global commercial Product identity, composition, and SDS history.",
    section: "Chemical Master Data",
    kind: "chemical-products",
    mode: "list",
    basePath: "/master/products",
  },
  {
    path: "/master/inventory",
    title: "Site Chemical Inventory",
    summary: "Record Product presence and quantity at Site-resolvable storage Locations.",
    section: "Chemical Master Data",
    kind: "chemical-inventory",
    mode: "list",
    basePath: "/master/inventory",
  },
  {
    path: "/master/chemical-uses",
    title: "Chemical Uses",
    summary: "Document how Products are used in compatible Sites, Locations, Processes, and Tasks.",
    section: "Chemical Master Data",
    kind: "chemical-uses",
    mode: "list",
    basePath: "/master/chemical-uses",
  },
  {
    path: "/migration/chemicals",
    title: "Chemical Migration Review",
    summary: "Review legacy Chemical evidence, canonical mappings, and unresolved data-quality findings.",
    section: "Chemical Master Data",
    kind: "chemical-migration",
  },
  {
    path: "/operations/locations",
    title: "Locations",
    summary: "Manage persisted operational locations used by HSE workflows.",
    section: "Operations",
    kind: "locations",
    mode: "list",
    basePath: "/operations/locations",
  },
  {
    path: "/operations/processes",
    title: "Processes",
    summary: "Document and manage operational processes linked to locations and HSE controls.",
    section: "Operations",
    kind: "processes",
    mode: "list",
    basePath: "/operations/processes",
  },
  {
    path: "/operations/equipment",
    title: "Equipment",
    summary: "Track HSE-relevant equipment linked to locations and operational processes.",
    section: "Operations",
    kind: "equipment",
    mode: "list",
    basePath: "/operations/equipment",
  },
  {
    path: "/hse/hazards",
    title: "Hazards",
    summary: "Identify, assess, and control workplace hazards across all locations.",
    section: "HSE Registers",
    kind: "hazards",
    mode: "list",
    basePath: "/hse/hazards",
  },
  {
    path: "/risk/controls",
    title: "Controls",
    summary: "Track controls linked to hazards with verification expectations.",
    section: "Risk Management",
    kind: "controls",
    mode: "list",
    basePath: "/risk/controls",
  },
  {
    path: "/risk/assessments",
    title: "Risk Assessments",
    summary: "Assess hazards with linked controls, residual risk, and review state.",
    section: "Risk Management",
    kind: "risk-assessments",
    mode: "list",
    basePath: "/risk/assessments",
  },
  {
    path: "/hse/segs",
    title: "SEGs",
    summary: "Define Similar Exposure Groups for occupational hygiene monitoring and control.",
    section: "HSE Registers",
    kind: "segs",
    mode: "list",
    basePath: "/hse/segs",
  },
  {
    path: "/hse/exposure-monitoring",
    title: "Exposure Monitoring",
    summary: "Record basic exposure samples linked to SEGs, contaminants, and operational context.",
    section: "HSE Registers",
    kind: "exposure-monitoring",
    mode: "list",
    basePath: "/hse/exposure-monitoring",
  },
  {
    path: "/field/findings",
    title: "Findings",
    summary: "Record and track HSE findings from observations, inspections, audits, and field work.",
    section: "Field Work",
    kind: "findings",
    mode: "list",
    basePath: "/field/findings",
  },
  {
    path: "/actions/corrective-actions",
    title: "Corrective Actions",
    summary: "Manage corrective actions linked to findings, track status and due dates.",
    section: "Actions",
    kind: "corrective-actions",
    mode: "list",
    basePath: "/actions/corrective-actions",
  },
  {
    path: "/incidents/log",
    title: "Incidents & Near Misses",
    summary: "Track scoped incident and near-miss records without making legal determinations.",
    section: "Incidents",
    kind: "incidents",
    mode: "list",
    basePath: "/incidents/log",
  },
  {
    path: "/compliance/items",
    title: "Compliance Support",
    summary: "Track obligations, permits, training status, controlled documents, owners, and evidence.",
    section: "Compliance",
    kind: "compliance-items",
    mode: "list",
    basePath: "/compliance/items",
  },
  ...CAMPAIGN_REGISTER_DEFINITIONS.map((definition) => ({
    path: definition.basePath,
    title: definition.title,
    summary: definition.summary,
    section: definition.sidebarTitle,
    kind: definition.kind as CampaignRegisterKind,
    mode: "list" as const,
    basePath: definition.basePath,
  })),
  {
    path: "/reports/exports",
    title: "Reports & Exports",
    summary: "Generate CSV or JSON exports from local register data.",
    section: "Reports",
    kind: "exports",
  },
  {
    path: "/system/settings",
    title: "Settings",
    summary: "Review persistence diagnostics for the local desktop app.",
    section: "System",
    kind: "settings",
  },
  {
    path: "/settings/profile",
    title: "Local User Profile",
    summary: "Configure the named local actor used for mutation attribution.",
    section: "System",
    kind: "profile",
  },
  {
    path: "/settings/installation",
    title: "Installation Identity",
    summary: "Configure the durable label for this browser installation.",
    section: "System",
    kind: "installation",
  },
  {
    path: "/not-found",
    title: "Page Not Found",
    summary: "The requested page does not exist.",
    kind: "not-found",
  },
  {
    path: "/error",
    title: "Something Went Wrong",
    summary: "The application encountered an unexpected error.",
    kind: "error",
  },
];

export const PARENT_REDIRECTS: ParentRedirect[] = [
  { path: "/", redirectTo: "/dashboard" },
  { path: "/operations", redirectTo: "/operations/locations" },
  { path: "/hse", redirectTo: "/master/products" },
  { path: "/master", redirectTo: "/master/products" },
  { path: "/risk", redirectTo: "/risk/controls" },
  { path: "/field", redirectTo: "/field/findings" },
  { path: "/actions", redirectTo: "/actions/corrective-actions" },
  { path: "/incidents", redirectTo: "/incidents/log" },
  { path: "/compliance", redirectTo: "/compliance/items" },
  { path: "/people", redirectTo: "/people/organizations" },
  { path: "/training", redirectTo: "/training/courses" },
  { path: "/change", redirectTo: "/change/moc" },
  { path: "/environment", redirectTo: "/environment/requirements" },
  { path: "/ih", redirectTo: "/ih/exposure-agents" },
  { path: "/reports", redirectTo: "/reports/exports" },
  { path: "/system", redirectTo: "/system/settings" },
  { path: "/settings", redirectTo: "/settings/profile" },
];

export function normalizePath(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function isRegisterRouteKind(kind: RouteKind): kind is RegisterRouteKind {
  return [
    "locations",
    "findings",
    "processes",
    "equipment",
    "exposure-monitoring",
    "chemicals",
    "hazards",
    "controls",
    "risk-assessments",
    "segs",
    "incidents",
    "compliance-items",
    "corrective-actions",
  ].includes(kind) || isCampaignRegisterKind(kind);
}

function getRegisterRoutes(): Array<AppRoute & { kind: RegisterRouteKind; basePath: string }> {
  return APP_ROUTES.filter(
    (route): route is AppRoute & { kind: RegisterRouteKind; basePath: string } =>
      isRegisterRouteKind(route.kind) && Boolean(route.basePath),
  );
}

function createRegisterRoute(
  route: AppRoute & { kind: RegisterRouteKind; basePath: string },
  pathname: string,
  mode: RouteMode,
  recordId?: string,
): AppRoute {
  const modeTitle =
    mode === "new" ? `New ${route.title}` : mode === "edit" ? `Edit ${route.title}` : route.title;

  return {
    ...route,
    path: pathname,
    title: modeTitle,
    mode,
    basePath: route.basePath,
    recordId,
  };
}

function findDynamicRegisterRoute(pathname: string): AppRoute | undefined {
  for (const route of getRegisterRoutes()) {
    const prefix = `${route.basePath}/`;

    if (!pathname.startsWith(prefix)) {
      continue;
    }

    const suffix = pathname.slice(prefix.length);
    const parts = suffix.split("/").filter(Boolean);

    if (parts.length === 1 && parts[0] === "new") {
      return createRegisterRoute(route, pathname, "new");
    }

    if (parts.length === 1) {
      return createRegisterRoute(route, pathname, "detail", decodeURIComponent(parts[0]));
    }

    if (parts.length === 2 && parts[1] === "edit") {
      return createRegisterRoute(route, pathname, "edit", decodeURIComponent(parts[0]));
    }
  }

  return undefined;
}

const CHEMICAL_ROUTE_KINDS = [
  "chemical-substances", "chemical-products", "chemical-inventory", "chemical-uses",
] as const;

export function isChemicalRouteKind(kind: RouteKind): kind is (typeof CHEMICAL_ROUTE_KINDS)[number] {
  return CHEMICAL_ROUTE_KINDS.includes(kind as (typeof CHEMICAL_ROUTE_KINDS)[number]);
}

function findDynamicChemicalRoute(pathname: string): AppRoute | undefined {
  const routes = APP_ROUTES.filter((route) => isChemicalRouteKind(route.kind) && route.basePath);
  for (const route of routes) {
    const prefix = `${route.basePath}/`;
    if (!pathname.startsWith(prefix)) continue;
    const parts = pathname.slice(prefix.length).split("/").filter(Boolean).map(decodeURIComponent);
    if (parts.length === 1 && parts[0] === "new") return { ...route, path: pathname, mode: "new" };
    if (parts.length === 1) return { ...route, path: pathname, mode: "detail", recordId: parts[0] };
    if (parts.length === 2 && parts[1] === "edit") return { ...route, path: pathname, mode: "edit", recordId: parts[0] };
    if (route.kind === "chemical-products" && parts.length >= 3 && parts[1] === "sds") {
      if (parts.length === 3 && parts[2] === "new") return { ...route, path: pathname, mode: "sds-new", parentRecordId: parts[0] };
      if (parts.length === 3) return { ...route, path: pathname, mode: "sds-detail", parentRecordId: parts[0], recordId: parts[2] };
      if (parts.length === 4 && parts[3] === "edit") return { ...route, path: pathname, mode: "sds-edit", parentRecordId: parts[0], recordId: parts[2] };
    }
  }
  return undefined;
}

export function findRoute(pathname: string): AppRoute | undefined {
  const normalizedPathname = normalizePath(pathname);
  return (
    APP_ROUTES.find((route) => route.path === normalizedPathname) ??
    findDynamicChemicalRoute(normalizedPathname) ??
    findDynamicRegisterRoute(normalizedPathname)
  );
}

export function findParentRedirect(pathname: string): ParentRedirect | undefined {
  const normalizedPathname = normalizePath(pathname);
  return PARENT_REDIRECTS.find((redirect) => redirect.path === normalizedPathname);
}

export function getRegisteredRoutePaths(): string[] {
  return APP_ROUTES.map((route) => route.path);
}

export function getRegisteredRoutePatterns(): string[] {
  const registerPatterns = getRegisterRoutes().flatMap((route) => [
    route.basePath,
    `${route.basePath}/new`,
    `${route.basePath}/:id`,
    `${route.basePath}/:id/edit`,
  ]);
  const chemicalPatterns = APP_ROUTES.filter((route) => isChemicalRouteKind(route.kind) && route.basePath).flatMap((route) => [
    route.basePath!,
    `${route.basePath}/new`,
    `${route.basePath}/:id`,
    `${route.basePath}/:id/edit`,
    ...(route.kind === "chemical-products" ? [
      `${route.basePath}/:productId/sds/new`,
      `${route.basePath}/:productId/sds/:sdsId`,
      `${route.basePath}/:productId/sds/:sdsId/edit`,
    ] : []),
  ]);

  return [
    ...APP_ROUTES.filter((route) => !isRegisterRouteKind(route.kind)).map((route) => route.path),
    ...registerPatterns,
    ...chemicalPatterns,
  ];
}
