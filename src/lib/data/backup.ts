import type { PersistedDatabase } from "$lib/persistence/local-persistence";

export interface DatabaseBackupFile {
  content: string;
  fileName: string;
  href: string;
  mimeType: "application/json";
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function createBackupFileName(createdAt: Date) {
  return [
    "oluso-backup-",
    createdAt.getFullYear(),
    pad(createdAt.getMonth() + 1),
    pad(createdAt.getDate()),
    "-",
    pad(createdAt.getHours()),
    pad(createdAt.getMinutes()),
    pad(createdAt.getSeconds()),
    ".json",
  ].join("");
}

export function buildDatabaseBackup(
  database: PersistedDatabase,
  createdAt = new Date(),
): DatabaseBackupFile {
  const content = JSON.stringify(database, null, 2);

  return {
    content,
    fileName: createBackupFileName(createdAt),
    href: `data:application/json;charset=utf-8,${encodeURIComponent(content)}`,
    mimeType: "application/json",
  };
}

export function parseBackupJson(content: string): unknown {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("The selected backup file does not contain valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The selected backup file must contain a database object.");
  }

  return parsed;
}

function readWithFileReader(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("The selected backup file could not be read."));
    reader.readAsText(file);
  });
}

export async function readBackupFile(file: File): Promise<unknown> {
  const content =
    typeof file.text === "function" ? await file.text() : await readWithFileReader(file);
  return parseBackupJson(content);
}

export function downloadDatabaseBackup(file: DatabaseBackupFile) {
  if (typeof document === "undefined") {
    return;
  }

  const link = document.createElement("a");
  link.href = file.href;
  link.download = file.fileName;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
