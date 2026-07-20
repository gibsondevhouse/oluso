import type { SidebarConfig } from "./sidebar.types";

export const SIDEBAR_CONFIG: SidebarConfig = {
  appTitle: "ADAMA HSE",
  sections: [
    {
      id: "home",
      title: "Home",
      icon: "Home",
      collapsible: false,
      defaultExpanded: true,
      children: [
        { id: "dashboard-home", title: "Home", route: "/dashboard", icon: "Home", routeType: "landing" },
      ],
    },
    {
      id: "enterprise",
      title: "Enterprise",
      icon: "Building2",
      collapsible: true,
      defaultExpanded: true,
      children: [
        { id: "enterprise-navigator", title: "Navigator", route: "/enterprise/navigator", icon: "Network", routeType: "landing" },
        { id: "organizations", title: "Organizations", route: "/people/organizations", icon: "Building2", routeType: "register" },
        { id: "locations", title: "Locations", route: "/operations/locations", icon: "MapPinned", routeType: "register" },
        { id: "functions-processes", title: "Functions & Processes", route: "/enterprise/functions", icon: "Workflow", routeType: "landing" },
        { id: "people", title: "People", route: "/people/workers", icon: "UsersRound", routeType: "register" },
      ],
    },
    {
      id: "chemicals",
      title: "Chemicals",
      icon: "FlaskConical",
      collapsible: true,
      defaultExpanded: false,
      children: [
        { id: "chemical-products", title: "Products", route: "/master/products", icon: "FlaskConical", routeType: "register" },
        { id: "chemical-inventory", title: "Site Inventory", route: "/master/inventory", icon: "Warehouse", routeType: "register" },
        { id: "chemical-uses", title: "Chemical Uses", route: "/master/chemical-uses", icon: "Workflow", routeType: "register" },
        { id: "sds-review", title: "SDS Review", route: "/chemicals/sds-review", icon: "FileCheck2", routeType: "landing" },
      ],
    },
    {
      id: "exposure",
      title: "Exposure",
      icon: "Activity",
      collapsible: true,
      defaultExpanded: false,
      children: [
        { id: "segs", title: "SEGs", route: "/hse/segs", icon: "UsersRound", routeType: "register" },
        { id: "exposure-scenarios", title: "Exposure Scenarios", route: "/exposure/scenarios", icon: "Waypoints", routeType: "landing" },
        { id: "exposure-assessments", title: "Assessments", route: "/ih/exposure-assessments", icon: "ClipboardCheck", routeType: "register" },
        { id: "exposure-monitoring", title: "Monitoring", route: "/hse/exposure-monitoring", icon: "Activity", routeType: "register" },
      ],
    },
    {
      id: "field-assurance",
      title: "Field & Assurance",
      icon: "ShieldCheck",
      collapsible: true,
      defaultExpanded: false,
      children: [
        { id: "observations", title: "Observations", route: "/field/inspections", icon: "ClipboardList", routeType: "register" },
        { id: "findings", title: "Findings", route: "/field/findings", icon: "TriangleAlert", routeType: "register" },
        { id: "incidents", title: "Incidents", route: "/incidents/log", icon: "Siren", routeType: "register" },
        { id: "corrective-actions", title: "Corrective Actions", route: "/actions/corrective-actions", icon: "ListChecks", routeType: "register" },
      ],
    },
    {
      id: "review",
      title: "Review",
      icon: "ListTodo",
      collapsible: true,
      defaultExpanded: false,
      children: [
        { id: "review-queue", title: "Review Queue", route: "/review/queue", icon: "ListTodo", routeType: "landing" },
        { id: "data-quality", title: "Data Quality", route: "/reports/data-quality", icon: "BadgeAlert", routeType: "register" },
        { id: "imports", title: "Imports", route: "/reports/import-runs", icon: "FileInput", routeType: "register" },
        { id: "exchange-packages", title: "Exchange Packages", route: "/reports/migration-bundles", icon: "PackageOpen", routeType: "register" },
      ],
    },
    {
      id: "reports",
      title: "Reports",
      icon: "FileBarChart",
      collapsible: false,
      defaultExpanded: true,
      children: [
        { id: "exports", title: "Reports", route: "/reports/exports", icon: "FileBarChart", routeType: "report" },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      icon: "Settings",
      collapsible: false,
      defaultExpanded: true,
      children: [
        { id: "settings", title: "Settings", route: "/system/settings", icon: "Settings", routeType: "system" },
      ],
    },
  ],
};
