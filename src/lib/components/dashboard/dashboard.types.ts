export type DashboardCardSize = "span-1" | "span-2" | "span-4";

export type GlassCardTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "cyan";

export interface DashboardGridItem {
  id: string;
  size?: DashboardCardSize;
}
