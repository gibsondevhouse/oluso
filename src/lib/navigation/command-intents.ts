import { SIDEBAR_CONFIG } from "./sidebar.config";

export type CommandGroup =
  | "Navigate"
  | "Recent"
  | "Search records"
  | "Create / start"
  | "Current context"
  | "Help / shortcuts";

export interface CommandIntent {
  id: string;
  title: string;
  description: string;
  group: CommandGroup;
  href: string;
  keywords: string[];
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

const createIntents: CommandIntent[] = [
  {
    id: "create-finding",
    title: "Add finding",
    description: "Capture an observation, inspection finding, or field issue.",
    group: "Create / start",
    href: "/field/findings/new",
    keywords: ["observation", "inspection", "field", "finding"],
  },
  {
    id: "create-action",
    title: "Add corrective action",
    description: "Create an action with owner, priority, due date, and verification needs.",
    group: "Create / start",
    href: "/actions/corrective-actions/new",
    keywords: ["action", "corrective", "follow up", "owner"],
  },
  {
    id: "create-location",
    title: "Add Location",
    description: "Create a Site, Facility, Unit, Zone, or other operational Location.",
    group: "Create / start",
    href: "/operations/locations/new",
    keywords: ["site", "plant", "unit", "context"],
  },
  {
    id: "create-chemical-product",
    title: "Add chemical Product",
    description: "Start a typed chemical Product and SDS workflow.",
    group: "Create / start",
    href: "/master/products/new",
    keywords: ["chemical", "product", "sds"],
  },
];

const helpIntents: CommandIntent[] = [
  {
    id: "shortcut-help",
    title: "Keyboard shortcuts",
    description: "Cmd/Ctrl+K opens commands; / opens search when focus is not in a field.",
    group: "Help / shortcuts",
    href: "/home",
    keywords: ["help", "shortcut", "keyboard"],
  },
];

export function getNavigationCommandIntents(): CommandIntent[] {
  return SIDEBAR_CONFIG.sections.flatMap((section) =>
    section.children
      .filter((item) => item.status !== "deferred")
      .map((item) => ({
        id: `navigate-${item.id}`,
        title: item.title,
        description: item.description ?? `${section.title} destination`,
        group: "Navigate" as const,
        href: item.route,
        keywords: [section.title, item.title, item.route],
      })),
  );
}

export function getCommandIntents(): CommandIntent[] {
  return [...getNavigationCommandIntents(), ...createIntents, ...helpIntents];
}

export function filterCommandIntents(intents: CommandIntent[], query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return intents.slice(0, 8);
  }

  return intents
    .map((intent) => {
      const title = normalize(intent.title);
      const haystack = normalize([intent.title, intent.description, ...intent.keywords].join(" "));
      const score =
        title === normalizedQuery
          ? 100
          : title.startsWith(normalizedQuery)
            ? 80
            : haystack.includes(normalizedQuery)
              ? 50
              : 0;

      return { intent, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.intent.title.localeCompare(right.intent.title))
    .map((item) => item.intent)
    .slice(0, 8);
}
