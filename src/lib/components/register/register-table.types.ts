export type RegisterSortDirection = "asc" | "desc";

export type RegisterCellKind = "text" | "status";

export interface RegisterRecord {
  id: string;
}

export type RegisterCellValue = string | number | Date | null | undefined;

export interface RegisterTableColumn<TRecord extends RegisterRecord> {
  key: string;
  label: string;
  accessor: (record: TRecord) => RegisterCellValue;
  sortAccessor?: (record: TRecord) => RegisterCellValue;
  descriptionAccessor?: (record: TRecord) => string | null | undefined;
  toneAccessor?: (record: TRecord) => string;
  cellKind?: RegisterCellKind;
  primary?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  width?: string;
}

export interface RegisterStatusOption {
  value: string;
  label: string;
}

export interface RegisterTableAction<TRecord extends RegisterRecord> {
  label: string;
  onSelect: (record: TRecord) => void;
  variant?: "primary" | "secondary" | "danger";
}
