export type SidebarRouteType =
  | "landing"
  | "register"
  | "report"
  | "system";

export type SidebarItemStatus =
  | "active"
  | "available"
  | "disabled"
  | "deferred";

export interface SidebarItem {
  id: string;
  title: string;
  route: string;
  icon?: string;
  routeType: SidebarRouteType;
  status?: SidebarItemStatus;
  badge?: number;
  description?: string;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: string;
  collapsible: boolean;
  defaultExpanded: boolean;
  children: SidebarItem[];
}

export interface SidebarConfig {
  appTitle: string;
  sections: SidebarSection[];
}
