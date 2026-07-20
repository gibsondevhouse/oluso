import type { SidebarConfig } from "./sidebar.types";

export function getActiveSidebarItemId(
  pathname: string,
  config: SidebarConfig,
): string | null {
  const cleanPathname = pathname.replace(/\/$/, "");
  
  if (cleanPathname === "" || cleanPathname === "/" || cleanPathname === "/dashboard") {
    return "home";
  }

  let bestMatchItem: { id: string; route: string } | null = null;

  for (const section of config.sections) {
    for (const item of section.children) {
      const itemRoute = item.route.replace(/\/$/, "");
      
      // Exact match
      if (cleanPathname === itemRoute) {
        return item.id;
      }

      // Subpath match (e.g. /operations/locations/new starts with /operations/locations)
      if (cleanPathname.startsWith(itemRoute + "/")) {
        if (!bestMatchItem || itemRoute.length > bestMatchItem.route.length) {
          bestMatchItem = { id: item.id, route: itemRoute };
        }
      }
    }
  }

  return bestMatchItem ? bestMatchItem.id : null;
}

export function getExpandedSectionIds(
  pathname: string,
  config: SidebarConfig,
  userExpandedState: Record<string, boolean>,
): string[] {
  const activeItemId = getActiveSidebarItemId(pathname, config);
  const expandedSections = new Set<string>();

  for (const section of config.sections) {
    // If it contains the active item, it must be expanded
    const hasActiveChild = section.children.some(item => item.id === activeItemId);
    if (hasActiveChild) {
      expandedSections.add(section.id);
      continue;
    }

    // Otherwise, check user expanded state or default
    const userPref = userExpandedState[section.id];
    if (userPref !== undefined) {
      if (userPref) {
        expandedSections.add(section.id);
      }
    } else if (section.defaultExpanded) {
      expandedSections.add(section.id);
    }
  }

  return Array.from(expandedSections);
}

export function validateSidebarConfig(config: SidebarConfig): void {
  const sectionIds = new Set<string>();
  const itemIds = new Set<string>();

  for (const section of config.sections) {
    if (!section.id) {
      throw new Error("Section is missing id");
    }
    if (!section.title) {
      throw new Error(`Section with ID "${section.id}" is missing title`);
    }
    if (sectionIds.has(section.id)) {
      throw new Error(`Duplicate section ID found: ${section.id}`);
    }
    sectionIds.add(section.id);

    if (!Array.isArray(section.children)) {
      throw new Error(`Section "${section.id}" children must be an array`);
    }

    for (const item of section.children) {
      if (!item.id) {
        throw new Error(`Item in section "${section.id}" is missing id`);
      }
      if (!item.title) {
        throw new Error(`Item with ID "${item.id}" is missing title`);
      }
      if (!item.route) {
        throw new Error(`Item with ID "${item.id}" is missing route`);
      }
      if (!item.routeType) {
        throw new Error(`Item with ID "${item.id}" is missing routeType`);
      }
      if (itemIds.has(item.id)) {
        throw new Error(`Duplicate item ID found: ${item.id}`);
      }
      itemIds.add(item.id);
    }
  }
}
