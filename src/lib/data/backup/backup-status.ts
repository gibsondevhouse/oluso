export interface BackupStatusInput {
  datasetRevision: number;
  lastBackupRevision?: number;
  lastBackupAt?: string;
  now?: Date;
  maxAgeDays?: number;
  maxRevisionDelta?: number;
}

export interface BackupStatus {
  status: "current" | "due" | "overdue" | "never";
  revisionsSinceBackup: number;
  ageDays: number | null;
  reason: string;
}

export function calculateBackupStatus(input: BackupStatusInput): BackupStatus {
  if (input.lastBackupRevision === undefined || !input.lastBackupAt) {
    return {
      status: "never",
      revisionsSinceBackup: input.datasetRevision,
      ageDays: null,
      reason: "No verified backup has been recorded.",
    };
  }

  const now = input.now ?? new Date();
  const timestamp = new Date(input.lastBackupAt);
  const ageDays = Number.isNaN(timestamp.getTime())
    ? Number.POSITIVE_INFINITY
    : Math.max(0, (now.getTime() - timestamp.getTime()) / 86_400_000);
  const revisionsSinceBackup = Math.max(0, input.datasetRevision - input.lastBackupRevision);
  const maxAgeDays = input.maxAgeDays ?? 7;
  const maxRevisionDelta = input.maxRevisionDelta ?? 25;

  if (ageDays >= maxAgeDays * 2 || revisionsSinceBackup >= maxRevisionDelta * 2) {
    return {
      status: "overdue",
      revisionsSinceBackup,
      ageDays,
      reason: "Backup age or dataset changes exceed the overdue threshold.",
    };
  }
  if (ageDays >= maxAgeDays || revisionsSinceBackup >= maxRevisionDelta) {
    return {
      status: "due",
      revisionsSinceBackup,
      ageDays,
      reason: "A new backup is due based on time or dataset changes.",
    };
  }
  return {
    status: "current",
    revisionsSinceBackup,
    ageDays,
    reason: "The last verified backup is within configured thresholds.",
  };
}
