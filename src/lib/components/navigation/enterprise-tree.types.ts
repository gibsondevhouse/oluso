export type EnterpriseTreeNodeType = "organization" | "country" | "geography" | "site" | "location" | "function";

export interface EnterpriseTreeNode {
  id: string;
  recordId: string;
  type: EnterpriseTreeNodeType;
  name: string;
  subtitle?: string;
  href?: string;
  dataQuality?: "verified" | "needs-review" | "unknown";
  pinned?: boolean;
  children: EnterpriseTreeNode[];
}
