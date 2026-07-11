use chrono::Utc;
use rusqlite::types::Value as SqlValue;
use rusqlite::{params, params_from_iter, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const SCHEMA_VERSION: i64 = 6;
const DB_FILE_NAME: &str = "oluso.db";
const LOCAL_STORAGE_MIGRATION_KEY: &str = "local_storage_migration_complete";

type Result<T> = std::result::Result<T, PersistenceError>;

#[derive(Debug, thiserror::Error)]
pub enum PersistenceError {
    #[error("{0}")]
    Message(String),
    #[error("Database error: {0}")]
    Sql(#[from] rusqlite::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("File system error: {0}")]
    Io(#[from] std::io::Error),
}

impl From<PersistenceError> for String {
    fn from(error: PersistenceError) -> Self {
        error.to_string()
    }
}

#[derive(Clone, Copy)]
enum FieldKind {
    Text,
    JsonArray,
    NullableText,
    Boolean,
}

#[derive(Clone, Copy)]
struct FieldSpec {
    key: &'static str,
    column: &'static str,
    kind: FieldKind,
}

#[derive(Clone, Copy)]
struct Collection {
    api_name: &'static str,
    table: &'static str,
    snapshot_key: &'static str,
    primary_label: &'static str,
    fields: &'static [FieldSpec],
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryRequest {
    pub collection: String,
    pub include_archived: Option<bool>,
    pub query: Option<String>,
    pub filters: Option<BTreeMap<String, String>>,
    pub sort_by: Option<String>,
    pub sort_direction: Option<String>,
    pub page: Option<usize>,
    pub page_size: Option<usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryResult {
    pub records: Vec<Value>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistenceSnapshot {
    pub database: Value,
    pub diagnostics: Value,
}

const COMMON_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "createdAt",
        column: "createdAt",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "updatedAt",
        column: "updatedAt",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "lifecycleStatus",
        column: "lifecycleStatus",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "archivedAt",
        column: "archivedAt",
        kind: FieldKind::NullableText,
    },
    FieldSpec {
        key: "archivedReason",
        column: "archivedReason",
        kind: FieldKind::NullableText,
    },
];

const LOCATION_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "name",
        column: "name",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "type",
        column: "type",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const PROCESS_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "name",
        column: "name",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "locationId",
        column: "locationId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "category",
        column: "category",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const EQUIPMENT_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "name",
        column: "name",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "type",
        column: "type",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "locationId",
        column: "locationId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "processId",
        column: "processId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "notes",
        column: "notes",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const CHEMICAL_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "name",
        column: "name",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "casNumber",
        column: "casNumber",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "hazardClass",
        column: "hazardClass",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "processIds",
        column: "processIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "storageLocationId",
        column: "storageLocationId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sdsStatus",
        column: "sdsStatus",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sdsReference",
        column: "sdsReference",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sdsRevisionDate",
        column: "sdsRevisionDate",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sdsReviewDate",
        column: "sdsReviewDate",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "exposureLimitValue",
        column: "exposureLimitValue",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "exposureLimitUnit",
        column: "exposureLimitUnit",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "exposureLimitSource",
        column: "exposureLimitSource",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "exposureLimitAveragingPeriod",
        column: "exposureLimitAveragingPeriod",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "quantity",
        column: "quantity",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "unit",
        column: "unit",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "supplier",
        column: "supplier",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "notes",
        column: "notes",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const HAZARD_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "title",
        column: "title",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "category",
        column: "category",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "locationId",
        column: "locationId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "locationIds",
        column: "locationIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "processIds",
        column: "processIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "chemicalIds",
        column: "chemicalIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "severity",
        column: "severity",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "likelihood",
        column: "likelihood",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "controls",
        column: "controls",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const CONTROL_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "name",
        column: "name",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "type",
        column: "type",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "hazardIds",
        column: "hazardIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "owner",
        column: "owner",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "verificationMethod",
        column: "verificationMethod",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "verificationFrequency",
        column: "verificationFrequency",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "lastVerifiedAt",
        column: "lastVerifiedAt",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "notes",
        column: "notes",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const RISK_ASSESSMENT_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "title",
        column: "title",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "hazardId",
        column: "hazardId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "controlIds",
        column: "controlIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "inherentSeverity",
        column: "inherentSeverity",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "inherentLikelihood",
        column: "inherentLikelihood",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "residualSeverity",
        column: "residualSeverity",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "residualLikelihood",
        column: "residualLikelihood",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "assessor",
        column: "assessor",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "reviewStatus",
        column: "reviewStatus",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "nextReviewDate",
        column: "nextReviewDate",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "notes",
        column: "notes",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const SEG_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "name",
        column: "name",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "type",
        column: "type",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "locationId",
        column: "locationId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "processId",
        column: "processId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "chemicalIds",
        column: "chemicalIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "hazardIds",
        column: "hazardIds",
        kind: FieldKind::JsonArray,
    },
    FieldSpec {
        key: "agentType",
        column: "agentType",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "exposureLevel",
        column: "exposureLevel",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "workerCount",
        column: "workerCount",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "controls",
        column: "controls",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "monitoringFrequency",
        column: "monitoringFrequency",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const FINDING_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "title",
        column: "title",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "type",
        column: "type",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "locationId",
        column: "locationId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "processId",
        column: "processId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "hazardId",
        column: "hazardId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "severity",
        column: "severity",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "reportedBy",
        column: "reportedBy",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const CORRECTIVE_ACTION_FIELDS: &[FieldSpec] = &[
    FieldSpec {
        key: "id",
        column: "id",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "title",
        column: "title",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "type",
        column: "type",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "description",
        column: "description",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "findingId",
        column: "findingId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sourceType",
        column: "sourceType",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sourceId",
        column: "sourceId",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "sourceJustification",
        column: "sourceJustification",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "assignedTo",
        column: "assignedTo",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "priority",
        column: "priority",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "status",
        column: "status",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "dueDate",
        column: "dueDate",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "completionSummary",
        column: "completionSummary",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "completedAt",
        column: "completedAt",
        kind: FieldKind::NullableText,
    },
    FieldSpec {
        key: "verificationRequired",
        column: "verificationRequired",
        kind: FieldKind::Boolean,
    },
    FieldSpec {
        key: "verificationMethod",
        column: "verificationMethod",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "verificationResult",
        column: "verificationResult",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "evidenceReference",
        column: "evidenceReference",
        kind: FieldKind::Text,
    },
    FieldSpec {
        key: "verifiedAt",
        column: "verifiedAt",
        kind: FieldKind::NullableText,
    },
    FieldSpec {
        key: "closedAt",
        column: "closedAt",
        kind: FieldKind::NullableText,
    },
    FieldSpec {
        key: "closureNotes",
        column: "closureNotes",
        kind: FieldKind::Text,
    },
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
    COMMON_FIELDS[4],
];

const COLLECTIONS: &[Collection] = &[
    Collection {
        api_name: "locations",
        table: "locations",
        snapshot_key: "locations",
        primary_label: "name",
        fields: LOCATION_FIELDS,
    },
    Collection {
        api_name: "processes",
        table: "processes",
        snapshot_key: "processes",
        primary_label: "name",
        fields: PROCESS_FIELDS,
    },
    Collection {
        api_name: "equipment",
        table: "equipment",
        snapshot_key: "equipment",
        primary_label: "name",
        fields: EQUIPMENT_FIELDS,
    },
    Collection {
        api_name: "chemicals",
        table: "chemicals",
        snapshot_key: "chemicals",
        primary_label: "name",
        fields: CHEMICAL_FIELDS,
    },
    Collection {
        api_name: "hazards",
        table: "hazards",
        snapshot_key: "hazards",
        primary_label: "title",
        fields: HAZARD_FIELDS,
    },
    Collection {
        api_name: "controls",
        table: "controls",
        snapshot_key: "controls",
        primary_label: "name",
        fields: CONTROL_FIELDS,
    },
    Collection {
        api_name: "riskAssessments",
        table: "risk_assessments",
        snapshot_key: "riskAssessments",
        primary_label: "title",
        fields: RISK_ASSESSMENT_FIELDS,
    },
    Collection {
        api_name: "segs",
        table: "segs",
        snapshot_key: "segs",
        primary_label: "name",
        fields: SEG_FIELDS,
    },
    Collection {
        api_name: "findings",
        table: "findings",
        snapshot_key: "findings",
        primary_label: "title",
        fields: FINDING_FIELDS,
    },
    Collection {
        api_name: "correctiveActions",
        table: "corrective_actions",
        snapshot_key: "correctiveActions",
        primary_label: "title",
        fields: CORRECTIVE_ACTION_FIELDS,
    },
];

pub struct ConnectionManager {
    path: PathBuf,
}

impl ConnectionManager {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn connect(&self) -> Result<Connection> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(&self.path)?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "busy_timeout", 5000)?;
        Ok(conn)
    }
}

pub struct SchemaVersionManager;

impl SchemaVersionManager {
    fn ensure_tables(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
              );
              CREATE TABLE IF NOT EXISTS migration_log (
                id TEXT PRIMARY KEY,
                version INTEGER NOT NULL,
                name TEXT NOT NULL,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                status TEXT NOT NULL,
                error TEXT
              );
              CREATE TABLE IF NOT EXISTS persistence_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
              );",
        )?;
        Ok(())
    }

    fn current_version(conn: &Connection) -> Result<i64> {
        Self::ensure_tables(conn)?;
        Ok(conn.query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )?)
    }
}

pub struct MigrationRunner {
    migrations: Vec<Migration>,
}

struct Migration {
    version: i64,
    name: &'static str,
    sql: &'static str,
}

impl MigrationRunner {
    pub fn new() -> Self {
        Self {
            migrations: vec![
                Migration {
                    version: 1,
                    name: "001_initial",
                    sql: include_str!("../migrations/001_initial.sql"),
                },
                Migration {
                    version: 2,
                    name: "002_corrective_actions_workflow",
                    sql: include_str!("../migrations/002_corrective_actions_workflow.sql"),
                },
                Migration {
                    version: 3,
                    name: "003_corrective_actions_evidence_reference",
                    sql: include_str!("../migrations/003_corrective_actions_evidence_reference.sql"),
                },
                Migration {
                    version: 4,
                    name: "004_equipment_register",
                    sql: include_str!("../migrations/004_equipment_register.sql"),
                },
                Migration {
                    version: 5,
                    name: "005_chemical_sds_exposure_fields",
                    sql: include_str!("../migrations/005_chemical_sds_exposure_fields.sql"),
                },
                Migration {
                    version: 6,
                    name: "006_controls_risk_assessments",
                    sql: include_str!("../migrations/006_controls_risk_assessments.sql"),
                },
            ],
        }
    }

    pub fn run(&self, conn: &mut Connection) -> Result<String> {
        SchemaVersionManager::ensure_tables(conn)?;
        let current_version = SchemaVersionManager::current_version(conn)?;
        let pending: Vec<&Migration> = self
            .migrations
            .iter()
            .filter(|migration| migration.version > current_version)
            .collect();

        if pending.is_empty() {
            return Ok(format!("Schema v{} is ready.", current_version));
        }

        for migration in pending {
            let started_at = now_iso();
            let log_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO migration_log (id, version, name, started_at, status)
                 VALUES (?1, ?2, ?3, ?4, 'running')",
                params![log_id, migration.version, migration.name, started_at],
            )?;

            let migration_result = (|| -> Result<()> {
                let tx = conn.transaction()?;
                tx.execute_batch(migration.sql)?;
                tx.execute(
                    "INSERT INTO schema_version (version, applied_at) VALUES (?1, ?2)",
                    params![migration.version, now_iso()],
                )?;
                tx.execute(
                    "UPDATE migration_log
                     SET finished_at = ?1, status = 'applied', error = NULL
                     WHERE id = ?2",
                    params![now_iso(), log_id],
                )?;
                tx.commit()?;
                Ok(())
            })();

            if let Err(error) = migration_result {
                conn.execute(
                    "UPDATE migration_log
                     SET finished_at = ?1, status = 'failed', error = ?2
                     WHERE id = ?3",
                    params![now_iso(), error.to_string(), log_id],
                )?;
                return Err(error);
            }
        }

        Ok(format!("Migrated to schema v{}.", SCHEMA_VERSION))
    }
}

pub struct DatabaseManager {
    connection_manager: ConnectionManager,
}

impl DatabaseManager {
    pub fn new(path: PathBuf) -> Self {
        Self {
            connection_manager: ConnectionManager::new(path),
        }
    }

    pub fn database_path_for_app(app: &AppHandle) -> Result<PathBuf> {
        let data_dir = app
            .path()
            .app_local_data_dir()
            .map_err(|error| PersistenceError::Message(error.to_string()))?;
        Ok(data_dir.join(DB_FILE_NAME))
    }

    pub fn initialize(
        &self,
        local_storage_snapshot: Option<String>,
    ) -> Result<PersistenceSnapshot> {
        let mut conn = self.connection_manager.connect()?;
        let migration_status = MigrationRunner::new().run(&mut conn)?;
        let initialization_status =
            self.ensure_data_initialized(&mut conn, local_storage_snapshot)?;
        self.snapshot_with_status(&conn, &initialization_status, &migration_status, None)
    }

    pub fn query(&self, request: QueryRequest) -> Result<QueryResult> {
        let conn = self.connection_manager.connect()?;
        let collection = collection_by_name(&request.collection)?;
        let include_archived = request.include_archived.unwrap_or(false);
        let page = request.page.unwrap_or(1).max(1);
        let page_size = request.page_size.unwrap_or(50).clamp(1, 500);
        let mut records = SqliteRepository::new(&conn).list(collection, include_archived)?;

        if let Some(query) = request
            .query
            .as_deref()
            .map(str::trim)
            .filter(|q| !q.is_empty())
        {
            let query = query.to_lowercase();
            records.retain(|record| searchable_text(record).to_lowercase().contains(&query));
        }

        if let Some(filters) = request.filters.as_ref() {
            records.retain(|record| {
                filters.iter().all(|(key, expected)| {
                    record.get(key).and_then(Value::as_str).unwrap_or("") == expected
                })
            });
        }

        if let Some(sort_by) = request.sort_by.as_deref() {
            records.sort_by(|a, b| {
                let left = a.get(sort_by).and_then(Value::as_str).unwrap_or("");
                let right = b.get(sort_by).and_then(Value::as_str).unwrap_or("");
                left.cmp(right)
            });
            if matches!(
                request.sort_direction.as_deref(),
                Some("desc" | "descending")
            ) {
                records.reverse();
            }
        } else {
            records.sort_by(|a, b| {
                let left = a
                    .get(collection.primary_label)
                    .and_then(Value::as_str)
                    .unwrap_or("");
                let right = b
                    .get(collection.primary_label)
                    .and_then(Value::as_str)
                    .unwrap_or("");
                left.cmp(right)
            });
        }

        let total = records.len();
        let start = (page - 1) * page_size;
        let paged_records = records.into_iter().skip(start).take(page_size).collect();

        Ok(QueryResult {
            records: paged_records,
            total,
            page,
            page_size,
        })
    }

    pub fn create_record(
        &self,
        collection_name: &str,
        input: Value,
    ) -> Result<PersistenceSnapshot> {
        let mut conn = self.connection_manager.connect()?;
        let collection = collection_by_name(collection_name)?;
        let migration_status = latest_migration_status(&conn)?;
        let record = build_created_record(collection, input)?;
        run_in_transaction(&mut conn, |tx| {
            SqliteRepository::new(tx).create(collection, &record)?;
            set_meta(tx, "database_updated_at", &now_iso())?;
            Ok(())
        })?;
        self.snapshot_with_status(&conn, "Record created.", &migration_status, None)
    }

    pub fn update_record(
        &self,
        collection_name: &str,
        id: &str,
        input: Value,
    ) -> Result<PersistenceSnapshot> {
        let mut conn = self.connection_manager.connect()?;
        let collection = collection_by_name(collection_name)?;
        let migration_status = latest_migration_status(&conn)?;
        run_in_transaction(&mut conn, |tx| {
            let existing = SqliteRepository::new(tx)
                .get(collection, id)?
                .ok_or_else(|| PersistenceError::Message("Record was not found.".to_string()))?;
            let record = build_updated_record(collection, existing, input)?;
            SqliteRepository::new(tx).update(collection, id, &record)?;
            set_meta(tx, "database_updated_at", &now_iso())?;
            Ok(())
        })?;
        self.snapshot_with_status(&conn, "Record updated.", &migration_status, None)
    }

    pub fn archive_record(
        &self,
        collection_name: &str,
        id: &str,
        reason: Option<String>,
    ) -> Result<PersistenceSnapshot> {
        let mut conn = self.connection_manager.connect()?;
        let collection = collection_by_name(collection_name)?;
        let migration_status = latest_migration_status(&conn)?;
        run_in_transaction(&mut conn, |tx| {
            let mut record = SqliteRepository::new(tx)
                .get(collection, id)?
                .ok_or_else(|| PersistenceError::Message("Record was not found.".to_string()))?;
            let timestamp = now_iso();
            object_mut(&mut record)?
                .insert("lifecycleStatus".into(), Value::String("archived".into()));
            object_mut(&mut record)?.insert("archivedAt".into(), Value::String(timestamp.clone()));
            object_mut(&mut record)?.insert(
                "archivedReason".into(),
                reason
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(|value| Value::String(value.to_string()))
                    .unwrap_or(Value::Null),
            );
            object_mut(&mut record)?.insert("updatedAt".into(), Value::String(timestamp));
            SqliteRepository::new(tx).update(collection, id, &record)?;
            set_meta(tx, "database_updated_at", &now_iso())?;
            Ok(())
        })?;
        self.snapshot_with_status(&conn, "Record archived.", &migration_status, None)
    }

    pub fn restore_record(&self, collection_name: &str, id: &str) -> Result<PersistenceSnapshot> {
        let mut conn = self.connection_manager.connect()?;
        let collection = collection_by_name(collection_name)?;
        let migration_status = latest_migration_status(&conn)?;
        run_in_transaction(&mut conn, |tx| {
            let mut record = SqliteRepository::new(tx)
                .get(collection, id)?
                .ok_or_else(|| PersistenceError::Message("Record was not found.".to_string()))?;
            object_mut(&mut record)?
                .insert("lifecycleStatus".into(), Value::String("active".into()));
            object_mut(&mut record)?.insert("archivedAt".into(), Value::Null);
            object_mut(&mut record)?.insert("archivedReason".into(), Value::Null);
            object_mut(&mut record)?.insert("updatedAt".into(), Value::String(now_iso()));
            SqliteRepository::new(tx).update(collection, id, &record)?;
            set_meta(tx, "database_updated_at", &now_iso())?;
            Ok(())
        })?;
        self.snapshot_with_status(&conn, "Record restored.", &migration_status, None)
    }

    pub fn reset(&self) -> Result<PersistenceSnapshot> {
        let mut conn = self.connection_manager.connect()?;
        run_in_transaction(&mut conn, |tx| {
            recreate_schema(tx)?;
            seed_demo_data(tx)?;
            set_meta(tx, "initialized_at", &now_iso())?;
            set_meta(tx, "database_updated_at", &now_iso())?;
            set_meta(tx, LOCAL_STORAGE_MIGRATION_KEY, "true")?;
            set_meta(tx, "local_storage_migration_status", "Skipped after reset.")?;
            Ok(())
        })?;
        self.snapshot_with_status(
            &conn,
            "SQLite schema recreated and re-seeded.",
            &format!("Schema v{} is ready.", SCHEMA_VERSION),
            None,
        )
    }

    fn ensure_data_initialized(
        &self,
        conn: &mut Connection,
        local_storage_snapshot: Option<String>,
    ) -> Result<String> {
        if get_meta(conn, "initialized_at")?.is_none() {
            set_meta(conn, "initialized_at", &now_iso())?;
        }

        let local_migration_complete =
            get_meta(conn, LOCAL_STORAGE_MIGRATION_KEY)?.as_deref() == Some("true");

        if !local_migration_complete {
            if let Some(raw) = local_storage_snapshot
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
            {
                let imported = parse_local_storage_database(raw)?;
                let imported_count = count_records_in_database(&imported);

                if imported_count > 0 && count_all_records(conn)? == 0 {
                    run_in_transaction(conn, |tx| {
                        import_database(tx, &imported)?;
                        set_meta(tx, LOCAL_STORAGE_MIGRATION_KEY, "true")?;
                        set_meta(
                            tx,
                            "local_storage_migration_status",
                            &format!("Imported {imported_count} records from localStorage."),
                        )?;
                        set_meta(tx, "database_updated_at", &now_iso())?;
                        Ok(())
                    })?;
                    return Ok("SQLite initialized from migrated localStorage data.".into());
                }

                set_meta(conn, LOCAL_STORAGE_MIGRATION_KEY, "true")?;
                set_meta(
                    conn,
                    "local_storage_migration_status",
                    if imported_count > 0 {
                        "Skipped localStorage import because SQLite already contained data."
                    } else {
                        "No localStorage records were found."
                    },
                )?;
            } else {
                set_meta(conn, LOCAL_STORAGE_MIGRATION_KEY, "true")?;
                set_meta(
                    conn,
                    "local_storage_migration_status",
                    "No localStorage data found.",
                )?;
            }
        }

        if count_all_records(conn)? == 0 {
            run_in_transaction(conn, |tx| {
                seed_demo_data(tx)?;
                set_meta(tx, "database_updated_at", &now_iso())?;
                Ok(())
            })?;
            return Ok("SQLite initialized and seeded with demo data.".into());
        }

        Ok("SQLite persistence initialized.".into())
    }

    fn snapshot_with_status(
        &self,
        conn: &Connection,
        initialization_status: &str,
        migration_status: &str,
        last_error: Option<&str>,
    ) -> Result<PersistenceSnapshot> {
        Ok(PersistenceSnapshot {
            database: load_database(conn)?,
            diagnostics: diagnostics_for(
                conn,
                &self.connection_manager.path,
                initialization_status,
                migration_status,
                last_error,
            )?,
        })
    }
}

pub struct SqliteRepository<'a> {
    conn: &'a Connection,
}

impl<'a> SqliteRepository<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    fn list(&self, collection: Collection, include_archived: bool) -> Result<Vec<Value>> {
        let mut sql = format!(
            "SELECT {} FROM {}",
            select_columns(collection),
            collection.table
        );
        if !include_archived {
            sql.push_str(" WHERE lifecycleStatus != 'archived'");
        }
        let mut stmt = self.conn.prepare(&sql)?;
        let rows = stmt.query_map([], |row| row_to_record(collection, row))?;
        rows.collect::<std::result::Result<Vec<_>, _>>()
            .map_err(Into::into)
    }

    fn get(&self, collection: Collection, id: &str) -> Result<Option<Value>> {
        let sql = format!(
            "SELECT {} FROM {} WHERE id = ?1",
            select_columns(collection),
            collection.table
        );
        self.conn
            .query_row(&sql, params![id], |row| row_to_record(collection, row))
            .optional()
            .map_err(Into::into)
    }

    fn create(&self, collection: Collection, record: &Value) -> Result<()> {
        validate_record(self.conn, collection, record, None)?;
        insert_record(self.conn, collection, record)
    }

    fn update(&self, collection: Collection, id: &str, record: &Value) -> Result<()> {
        if id.trim().is_empty() {
            return Err(PersistenceError::Message("Record ID is required.".into()));
        }
        validate_record(self.conn, collection, record, Some(id))?;
        update_record(self.conn, collection, id, record)
    }
}

fn run_in_transaction<F>(conn: &mut Connection, operation: F) -> Result<()>
where
    F: FnOnce(&Connection) -> Result<()>,
{
    let tx = conn.transaction()?;
    operation(&tx)?;
    tx.commit()?;
    Ok(())
}

fn collection_by_name(name: &str) -> Result<Collection> {
    COLLECTIONS
        .iter()
        .copied()
        .find(|collection| collection.api_name == name || collection.table == name)
        .ok_or_else(|| PersistenceError::Message(format!("Unknown register collection: {name}.")))
}

fn select_columns(collection: Collection) -> String {
    collection
        .fields
        .iter()
        .map(|field| field.column)
        .collect::<Vec<_>>()
        .join(", ")
}

fn row_to_record(collection: Collection, row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    let mut map = Map::new();

    for (index, field) in collection.fields.iter().enumerate() {
        match field.kind {
            FieldKind::Text => {
                let value: String = row.get(index)?;
                map.insert(field.key.to_string(), Value::String(value));
            }
            FieldKind::NullableText => {
                let value: Option<String> = row.get(index)?;
                map.insert(
                    field.key.to_string(),
                    value.map(Value::String).unwrap_or(Value::Null),
                );
            }
            FieldKind::Boolean => {
                let value: i64 = row.get(index)?;
                map.insert(field.key.to_string(), Value::Bool(value != 0));
            }
            FieldKind::JsonArray => {
                let value: String = row.get(index)?;
                let parsed = serde_json::from_str::<Value>(&value).unwrap_or_else(|_| json!([]));
                map.insert(field.key.to_string(), parsed);
            }
        }
    }

    Ok(Value::Object(map))
}

fn insert_record(conn: &Connection, collection: Collection, record: &Value) -> Result<()> {
    let columns = collection
        .fields
        .iter()
        .map(|field| field.column)
        .collect::<Vec<_>>();
    let placeholders = (1..=columns.len())
        .map(|index| format!("?{index}"))
        .collect::<Vec<_>>();
    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        collection.table,
        columns.join(", "),
        placeholders.join(", ")
    );
    let params = sql_values_for(collection, record)?;
    conn.execute(&sql, params_from_iter(params))?;
    Ok(())
}

fn update_record(
    conn: &Connection,
    collection: Collection,
    id: &str,
    record: &Value,
) -> Result<()> {
    let assignments = collection
        .fields
        .iter()
        .filter(|field| field.key != "id")
        .enumerate()
        .map(|(index, field)| format!("{} = ?{}", field.column, index + 1))
        .collect::<Vec<_>>();
    let sql = format!(
        "UPDATE {} SET {} WHERE id = ?{}",
        collection.table,
        assignments.join(", "),
        assignments.len() + 1
    );
    let mut params = sql_values_for(collection, record)?
        .into_iter()
        .enumerate()
        .filter_map(|(index, value)| {
            let field = collection.fields[index];
            (field.key != "id").then_some(value)
        })
        .collect::<Vec<_>>();
    params.push(SqlValue::Text(id.to_string()));
    let changed = conn.execute(&sql, params_from_iter(params))?;
    if changed == 0 {
        return Err(PersistenceError::Message("Record was not found.".into()));
    }
    Ok(())
}

fn sql_values_for(collection: Collection, record: &Value) -> Result<Vec<SqlValue>> {
    let mut values = Vec::with_capacity(collection.fields.len());

    for field in collection.fields {
        match field.kind {
            FieldKind::Text => values.push(SqlValue::Text(string_field(record, field.key)?)),
            FieldKind::NullableText => {
                let value = nullable_string_field(record, field.key);
                values.push(value.map(SqlValue::Text).unwrap_or(SqlValue::Null));
            }
            FieldKind::Boolean => {
                let value = record
                    .get(field.key)
                    .and_then(Value::as_bool)
                    .unwrap_or(false);
                values.push(SqlValue::Integer(if value { 1 } else { 0 }));
            }
            FieldKind::JsonArray => {
                values.push(SqlValue::Text(array_field_json(record, field.key)?))
            }
        }
    }

    Ok(values)
}

fn build_created_record(collection: Collection, input: Value) -> Result<Value> {
    let mut record = object_from_value(input)?;
    let timestamp = now_iso();
    record.insert("id".into(), Value::String(Uuid::new_v4().to_string()));
    record.insert("createdAt".into(), Value::String(timestamp.clone()));
    record.insert("updatedAt".into(), Value::String(timestamp));
    record.insert("lifecycleStatus".into(), Value::String("active".into()));
    record.insert("archivedAt".into(), Value::Null);
    record.insert("archivedReason".into(), Value::Null);
    if collection.api_name == "correctiveActions" {
        let status = normalize_corrective_action_status(
            record.get("status").and_then(Value::as_str).unwrap_or("Created"),
        );
        let transition_at = record.get("updatedAt").cloned().unwrap_or(Value::Null);
        record.insert(
            "completedAt".into(),
            if action_has_completion(&status) {
                transition_at.clone()
            } else {
                Value::Null
            },
        );
        record.insert(
            "verifiedAt".into(),
            if action_has_verification(&status) {
                transition_at.clone()
            } else {
                Value::Null
            },
        );
        record.insert(
            "closedAt".into(),
            if status == "Closed" {
                transition_at
            } else {
                Value::Null
            },
        );
    }
    normalize_record(collection, Value::Object(record))
}

fn build_updated_record(collection: Collection, existing: Value, input: Value) -> Result<Value> {
    let mut record = object_from_value(existing)?;
    let input = object_from_value(input)?;
    let timestamp = now_iso();
    let previous_status = normalize_corrective_action_status(
        record.get("status").and_then(Value::as_str).unwrap_or("Created"),
    );

    for (key, value) in input {
        record.insert(key, value);
    }

    record.insert("updatedAt".into(), Value::String(timestamp.clone()));

    if collection.api_name == "correctiveActions" {
        let next_status = normalize_corrective_action_status(
            record.get("status").and_then(Value::as_str).unwrap_or("Created"),
        );
        let existing_completed_at = record.get("completedAt").cloned().unwrap_or(Value::Null);
        let existing_verified_at = record.get("verifiedAt").cloned().unwrap_or(Value::Null);
        let existing_closed_at = record.get("closedAt").cloned().unwrap_or(Value::Null);
        record.insert(
            "completedAt".into(),
            if action_has_completion(&next_status) && !action_has_completion(&previous_status) {
                Value::String(timestamp.clone())
            } else {
                existing_completed_at
            },
        );
        record.insert(
            "verifiedAt".into(),
            if action_has_verification(&next_status) && !action_has_verification(&previous_status)
            {
                Value::String(timestamp.clone())
            } else {
                existing_verified_at
            },
        );
        record.insert(
            "closedAt".into(),
            if next_status == "Closed" && previous_status != "Closed" {
                Value::String(timestamp)
            } else {
                existing_closed_at
            },
        );
    }

    normalize_record(collection, Value::Object(record))
}

fn normalize_record(collection: Collection, record: Value) -> Result<Value> {
    let mut map = object_from_value(record)?;

    for field in collection.fields {
        if !map.contains_key(field.key) {
            let default = match field.kind {
                FieldKind::Text => Value::String(String::new()),
                FieldKind::NullableText => Value::Null,
                FieldKind::JsonArray => json!([]),
                FieldKind::Boolean => Value::Bool(true),
            };
            map.insert(field.key.to_string(), default);
        }
    }

    trim_text_fields(&mut map, collection);

    match collection.api_name {
        "chemicals" => normalize_chemical_record(&mut map),
        "hazards" => {
            let location_id = map
                .get("locationId")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();
            let mut ids = string_array_value(map.get("locationIds"));
            if !location_id.is_empty() {
                ids.insert(0, location_id);
            }
            let deduped = ids
                .into_iter()
                .filter(|id| !id.is_empty())
                .collect::<BTreeSet<_>>();
            map.insert(
                "locationIds".into(),
                Value::Array(deduped.into_iter().map(Value::String).collect()),
            );
        }
        "correctiveActions" => normalize_corrective_action_record(&mut map),
        _ => {}
    }

    Ok(Value::Object(map))
}

fn normalize_chemical_record(map: &mut Map<String, Value>) {
    if !matches!(
        map.get("sdsStatus").and_then(Value::as_str),
        Some("Current" | "Missing" | "Needs Review" | "Not Required")
    ) {
        map.insert("sdsStatus".into(), Value::String("Missing".into()));
    }
}

fn trim_text_fields(map: &mut Map<String, Value>, collection: Collection) {
    for field in collection.fields {
        if matches!(field.kind, FieldKind::Text | FieldKind::NullableText) {
            if let Some(Value::String(value)) = map.get_mut(field.key) {
                *value = value.trim().to_string();
            }
        }
    }
}

fn normalize_corrective_action_status(status: &str) -> String {
    match status {
        "Open" => "Created".into(),
        "Created" | "Assigned" | "In Progress" | "Completed" | "Verified" | "Closed"
        | "Canceled" | "Deferred" | "Reopened" | "Blocked" => status.into(),
        _ => "Created".into(),
    }
}

fn action_has_completion(status: &str) -> bool {
    matches!(status, "Completed" | "Verified" | "Closed")
}

fn action_has_verification(status: &str) -> bool {
    matches!(status, "Verified" | "Closed")
}

fn normalize_corrective_action_record(map: &mut Map<String, Value>) {
    let status = normalize_corrective_action_status(
        map.get("status").and_then(Value::as_str).unwrap_or("Created"),
    );
    map.insert("status".into(), Value::String(status.clone()));

    let finding_id = map
        .get("findingId")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let source_type = map
        .get("sourceType")
        .and_then(Value::as_str)
        .filter(|value| {
            matches!(
                *value,
                "Finding" | "Hazard" | "Incident" | "Compliance Item" | "Manual"
            )
        })
        .unwrap_or("Finding")
        .to_string();
    let source_id = map
        .get("sourceId")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| {
            if source_type == "Finding" {
                finding_id.clone()
            } else {
                String::new()
            }
        });

    map.insert("sourceType".into(), Value::String(source_type.clone()));
    map.insert("sourceId".into(), Value::String(source_id.clone()));
    if source_type == "Finding" && finding_id.is_empty() {
        map.insert("findingId".into(), Value::String(source_id));
    }

    if !map
        .get("verificationRequired")
        .map(Value::is_boolean)
        .unwrap_or(false)
    {
        map.insert("verificationRequired".into(), Value::Bool(true));
    }

    let fallback_transition_at = map
        .get("updatedAt")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    if matches!(status.as_str(), "Completed" | "Verified" | "Closed")
        && map.get("completedAt").and_then(Value::as_str).is_none()
    {
        map.insert(
            "completedAt".into(),
            if fallback_transition_at.is_empty() {
                Value::Null
            } else {
                Value::String(fallback_transition_at.clone())
            },
        );
    }
    if matches!(status.as_str(), "Verified" | "Closed")
        && map.get("verifiedAt").and_then(Value::as_str).is_none()
    {
        map.insert(
            "verifiedAt".into(),
            if fallback_transition_at.is_empty() {
                Value::Null
            } else {
                Value::String(fallback_transition_at.clone())
            },
        );
    }
    if status == "Closed" && map.get("closedAt").and_then(Value::as_str).is_none() {
        map.insert(
            "closedAt".into(),
            if fallback_transition_at.is_empty() {
                Value::Null
            } else {
                Value::String(fallback_transition_at)
            },
        );
    }
}

fn validate_record(
    conn: &Connection,
    collection: Collection,
    record: &Value,
    updating_id: Option<&str>,
) -> Result<()> {
    let id = string_field(record, "id")?;
    if id.trim().is_empty() {
        return Err(PersistenceError::Message("Record ID is required.".into()));
    }
    if updating_id.is_none() && record_exists(conn, collection, &id)? {
        return Err(PersistenceError::Message(format!(
            "Record ID {id} already exists."
        )));
    }

    match collection.api_name {
        "locations" => {
            require_text(record, "name", "Name is required.")?;
            require_enum(
                record,
                "type",
                &[
                    "Facility",
                    "Production Area",
                    "Storage",
                    "Lab",
                    "Office",
                    "Utility Area",
                    "Outdoor Area",
                ],
                "Type",
            )?;
            require_enum(record, "status", &["active", "inactive"], "Status")?;
        }
        "processes" => {
            require_text(record, "name", "Name is required.")?;
            require_enum(
                record,
                "category",
                &[
                    "Formulation",
                    "Packaging",
                    "Storage",
                    "Transfer",
                    "Cleaning",
                    "Maintenance",
                    "Waste Handling",
                ],
                "Category",
            )?;
            require_enum(
                record,
                "status",
                &["active", "inactive", "under-review"],
                "Status",
            )?;
            ensure_optional_ref(
                conn,
                "locations",
                string_field(record, "locationId")?,
                "Selected location",
            )?;
        }
        "equipment" => {
            require_text(record, "name", "Name is required.")?;
            require_enum(
                record,
                "type",
                &[
                    "Tank",
                    "Pump",
                    "Mixer",
                    "Conveyor",
                    "Forklift",
                    "Ventilation",
                    "Dust Collector",
                    "Emergency Equipment",
                    "Tooling",
                    "Other",
                ],
                "Equipment type",
            )?;
            require_text(record, "locationId", "Location is required.")?;
            require_enum(
                record,
                "status",
                &["active", "inactive", "under-review"],
                "Status",
            )?;
            ensure_required_ref(
                conn,
                "locations",
                string_field(record, "locationId")?,
                "Selected location",
            )?;
            ensure_optional_ref(
                conn,
                "processes",
                string_field(record, "processId")?,
                "Selected process",
            )?;
        }
        "chemicals" => {
            require_text(record, "name", "Chemical name is required.")?;
            require_enum(
                record,
                "hazardClass",
                &[
                    "Solvent",
                    "Active Ingredient",
                    "Surfactant",
                    "Dust/Formulated Solid",
                    "Corrosive",
                    "Flammable",
                    "Toxic",
                    "Unknown",
                ],
                "Classification",
            )?;
            require_text(record, "storageLocationId", "Storage location is required.")?;
            require_enum(
                record,
                "sdsStatus",
                &["Current", "Missing", "Needs Review", "Not Required"],
                "SDS status",
            )?;
            require_enum(
                record,
                "status",
                &["active", "inactive", "restricted"],
                "Status",
            )?;
            ensure_required_ref(
                conn,
                "locations",
                string_field(record, "storageLocationId")?,
                "Selected storage location",
            )?;
            ensure_array_refs(
                conn,
                "processes",
                string_array_value(record.get("processIds")),
                "Selected process",
            )?;
        }
        "hazards" => {
            require_text(record, "title", "Title is required.")?;
            require_enum(
                record,
                "category",
                &[
                    "Chemical",
                    "Physical",
                    "Biological",
                    "Ergonomic",
                    "Environmental",
                    "Fire/Explosion",
                    "Confined Space",
                    "Equipment",
                ],
                "Category",
            )?;
            require_text(record, "locationId", "Location is required.")?;
            require_enum(
                record,
                "severity",
                &["Low", "Medium", "High", "Critical"],
                "Severity",
            )?;
            require_enum(
                record,
                "likelihood",
                &["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"],
                "Likelihood",
            )?;
            require_enum(
                record,
                "status",
                &["active", "mitigated", "closed"],
                "Status",
            )?;
            ensure_required_ref(
                conn,
                "locations",
                string_field(record, "locationId")?,
                "Selected location",
            )?;
            ensure_array_refs(
                conn,
                "locations",
                string_array_value(record.get("locationIds")),
                "Selected location",
            )?;
            ensure_array_refs(
                conn,
                "processes",
                string_array_value(record.get("processIds")),
                "Selected process",
            )?;
            ensure_array_refs(
                conn,
                "chemicals",
                string_array_value(record.get("chemicalIds")),
                "Selected chemical",
            )?;
        }
        "controls" => {
            require_text(record, "name", "Name is required.")?;
            require_enum(
                record,
                "type",
                &[
                    "Engineering",
                    "Administrative",
                    "PPE",
                    "Training",
                    "Housekeeping",
                    "Emergency",
                    "Other",
                ],
                "Control type",
            )?;
            let hazard_ids = string_array_value(record.get("hazardIds"));
            if hazard_ids.is_empty() {
                return Err(PersistenceError::Message(
                    "At least one related hazard is required.".into(),
                ));
            }
            require_enum(
                record,
                "status",
                &["active", "needs-review", "ineffective", "retired"],
                "Status",
            )?;
            ensure_array_refs(conn, "hazards", hazard_ids, "Selected hazard")?;
        }
        "riskAssessments" => {
            require_text(record, "title", "Title is required.")?;
            require_text(record, "hazardId", "Related hazard is required.")?;
            require_enum(
                record,
                "inherentSeverity",
                &["Low", "Medium", "High", "Critical"],
                "Inherent severity",
            )?;
            require_enum(
                record,
                "inherentLikelihood",
                &["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"],
                "Inherent likelihood",
            )?;
            require_enum(
                record,
                "residualSeverity",
                &["Low", "Medium", "High", "Critical"],
                "Residual severity",
            )?;
            require_enum(
                record,
                "residualLikelihood",
                &["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"],
                "Residual likelihood",
            )?;
            require_enum(
                record,
                "reviewStatus",
                &["Draft", "In Review", "Approved", "Needs Review"],
                "Review status",
            )?;
            ensure_required_ref(
                conn,
                "hazards",
                string_field(record, "hazardId")?,
                "Selected hazard",
            )?;
            ensure_array_refs(
                conn,
                "controls",
                string_array_value(record.get("controlIds")),
                "Selected control",
            )?;
        }
        "segs" => {
            require_text(record, "name", "Name is required.")?;
            require_enum(
                record,
                "type",
                &[
                    "Similar Exposure Group",
                    "Task-Based Group",
                    "Area-Based Group",
                    "Role-Based Group",
                ],
                "SEG type",
            )?;
            require_text(record, "locationId", "Location is required.")?;
            require_text(record, "agentType", "Agent type is required.")?;
            require_enum(
                record,
                "exposureLevel",
                &["Low", "Medium", "High", "Critical"],
                "Exposure level",
            )?;
            require_enum(
                record,
                "status",
                &["active", "inactive", "under-review"],
                "Status",
            )?;
            ensure_required_ref(
                conn,
                "locations",
                string_field(record, "locationId")?,
                "Selected location",
            )?;
            ensure_optional_ref(
                conn,
                "processes",
                string_field(record, "processId")?,
                "Selected process",
            )?;
            ensure_array_refs(
                conn,
                "chemicals",
                string_array_value(record.get("chemicalIds")),
                "Selected chemical",
            )?;
            ensure_array_refs(
                conn,
                "hazards",
                string_array_value(record.get("hazardIds")),
                "Selected hazard",
            )?;
        }
        "findings" => {
            require_text(record, "title", "Title is required.")?;
            require_enum(
                record,
                "type",
                &[
                    "Inspection Finding",
                    "Observation",
                    "Near Miss",
                    "Environmental Finding",
                    "IH Observation",
                    "Unsafe Condition",
                    "Unsafe Behavior",
                ],
                "Finding type",
            )?;
            require_text(record, "locationId", "Location is required.")?;
            require_enum(
                record,
                "severity",
                &["Low", "Medium", "High", "Critical"],
                "Severity",
            )?;
            require_enum(
                record,
                "status",
                &["Open", "In Progress", "Closed"],
                "Status",
            )?;
            ensure_required_ref(
                conn,
                "locations",
                string_field(record, "locationId")?,
                "Selected location",
            )?;
            ensure_optional_ref(
                conn,
                "processes",
                string_field(record, "processId")?,
                "Selected process",
            )?;
            ensure_optional_ref(
                conn,
                "hazards",
                string_field(record, "hazardId")?,
                "Selected hazard",
            )?;
        }
        "correctiveActions" => {
            require_text(record, "title", "Title is required.")?;
            require_enum(
                record,
                "type",
                &[
                    "Engineering Control",
                    "Administrative Control",
                    "PPE",
                    "Training",
                    "Housekeeping",
                    "Maintenance",
                    "Investigation",
                    "Other",
                ],
                "Corrective action type",
            )?;
            require_enum(
                record,
                "sourceType",
                &["Finding", "Hazard", "Incident", "Compliance Item", "Manual"],
                "Source type",
            )?;
            let source_type = string_field(record, "sourceType")?;
            if source_type == "Manual" {
                require_text(
                    record,
                    "sourceJustification",
                    "Manual source justification is required.",
                )?;
            } else {
                require_text(record, "sourceId", "Source record is required.")?;
            }
            if matches!(source_type.as_str(), "Incident" | "Compliance Item") {
                require_text(
                    record,
                    "sourceJustification",
                    "External source note is required.",
                )?;
            }
            require_text(record, "assignedTo", "Assigned to is required.")?;
            require_enum(
                record,
                "priority",
                &["Low", "Medium", "High", "Critical"],
                "Priority",
            )?;
            require_enum(
                record,
                "status",
                &[
                    "Created",
                    "Assigned",
                    "In Progress",
                    "Completed",
                    "Verified",
                    "Closed",
                    "Canceled",
                    "Deferred",
                    "Reopened",
                    "Blocked",
                ],
                "Status",
            )?;
            require_text(record, "dueDate", "Due date is required.")?;
            let status = string_field(record, "status")?;
            if action_has_completion(&status) {
                require_text(
                    record,
                    "completionSummary",
                    "Completion summary is required before completion, verification, or closure.",
                )?;
            }
            if record
                .get("verificationRequired")
                .and_then(Value::as_bool)
                .unwrap_or(true)
                && action_has_verification(&status)
            {
                require_text(
                    record,
                    "verificationMethod",
                    "Verification method is required before verification or closure.",
                )?;
                require_text(
                    record,
                    "verificationResult",
                    "Verification result is required before verification or closure.",
                )?;
            }
            if status == "Closed" {
                require_text(
                    record,
                    "closureNotes",
                    "Closure summary is required when closing a corrective action.",
                )?;
            }
            match source_type.as_str() {
                "Finding" => ensure_required_ref(
                    conn,
                    "findings",
                    string_field(record, "sourceId")?,
                    "Selected finding",
                )?,
                "Hazard" => ensure_required_ref(
                    conn,
                    "hazards",
                    string_field(record, "sourceId")?,
                    "Selected hazard",
                )?,
                _ => {}
            }
        }
        _ => {}
    }

    Ok(())
}

fn record_exists(conn: &Connection, collection: Collection, id: &str) -> Result<bool> {
    let sql = format!(
        "SELECT EXISTS(SELECT 1 FROM {} WHERE id = ?1)",
        collection.table
    );
    Ok(conn.query_row(&sql, params![id], |row| row.get::<_, bool>(0))?)
}

fn ensure_required_ref(conn: &Connection, table: &str, id: String, label: &str) -> Result<()> {
    if id.trim().is_empty() {
        return Err(PersistenceError::Message(format!("{label} is required.")));
    }
    ensure_optional_ref(conn, table, id, label)
}

fn ensure_optional_ref(conn: &Connection, table: &str, id: String, label: &str) -> Result<()> {
    if id.trim().is_empty() {
        return Ok(());
    }
    let sql = format!("SELECT EXISTS(SELECT 1 FROM {table} WHERE id = ?1)");
    let exists = conn.query_row(&sql, params![id], |row| row.get::<_, bool>(0))?;
    if exists {
        Ok(())
    } else {
        Err(PersistenceError::Message(format!("{label} was not found.")))
    }
}

fn ensure_array_refs(conn: &Connection, table: &str, ids: Vec<String>, label: &str) -> Result<()> {
    for id in ids.into_iter().filter(|id| !id.trim().is_empty()) {
        ensure_optional_ref(conn, table, id, label)?;
    }
    Ok(())
}

fn require_text(record: &Value, key: &str, message: &str) -> Result<()> {
    if string_field(record, key)?.trim().is_empty() {
        return Err(PersistenceError::Message(message.into()));
    }
    Ok(())
}

fn require_enum(record: &Value, key: &str, allowed: &[&str], label: &str) -> Result<()> {
    let value = string_field(record, key)?;
    if allowed.contains(&value.as_str()) {
        Ok(())
    } else {
        Err(PersistenceError::Message(format!(
            "{label} must be one of: {}.",
            allowed.join(", ")
        )))
    }
}

fn object_from_value(value: Value) -> Result<Map<String, Value>> {
    value
        .as_object()
        .cloned()
        .ok_or_else(|| PersistenceError::Message("Expected a record object.".into()))
}

fn object_mut(value: &mut Value) -> Result<&mut Map<String, Value>> {
    value
        .as_object_mut()
        .ok_or_else(|| PersistenceError::Message("Expected a record object.".into()))
}

fn string_field(record: &Value, key: &str) -> Result<String> {
    Ok(record
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or("")
        .trim()
        .to_string())
}

fn nullable_string_field(record: &Value, key: &str) -> Option<String> {
    record
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn array_field_json(record: &Value, key: &str) -> Result<String> {
    serde_json::to_string(&Value::Array(
        string_array_value(record.get(key))
            .into_iter()
            .map(Value::String)
            .collect(),
    ))
    .map_err(Into::into)
}

fn string_array_value(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
            .collect(),
        Some(Value::String(value)) => value
            .split('|')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
            .collect(),
        _ => Vec::new(),
    }
}

fn load_database(conn: &Connection) -> Result<Value> {
    let mut database = Map::new();
    database.insert("schemaVersion".into(), Value::Number(SCHEMA_VERSION.into()));
    database.insert(
        "initializedAt".into(),
        Value::String(get_meta(conn, "initialized_at")?.unwrap_or_else(now_iso)),
    );
    database.insert(
        "updatedAt".into(),
        Value::String(get_meta(conn, "database_updated_at")?.unwrap_or_else(now_iso)),
    );

    for collection in COLLECTIONS {
        let records = SqliteRepository::new(conn).list(*collection, true)?;
        database.insert(collection.snapshot_key.to_string(), Value::Array(records));
    }

    Ok(Value::Object(database))
}

fn diagnostics_for(
    conn: &Connection,
    db_path: &Path,
    initialization_status: &str,
    migration_status: &str,
    last_error: Option<&str>,
) -> Result<Value> {
    let record_counts = record_counts(conn)?;
    let size_bytes = fs::metadata(db_path)
        .map(|metadata| metadata.len())
        .unwrap_or(0);

    Ok(json!({
        "status": if last_error.is_some() { "error" } else { "ready" },
        "backend": "sqlite",
        "connectionState": if last_error.is_some() { "error" } else { "connected" },
        "dataPath": db_path.to_string_lossy(),
        "databaseSizeBytes": size_bytes,
        "schemaVersion": SCHEMA_VERSION,
        "recordCounts": record_counts,
        "initializedAt": get_meta(conn, "initialized_at")?,
        "lastInitializationStatus": initialization_status,
        "lastMigrationStatus": migration_status,
        "localStorageMigrationStatus": get_meta(conn, "local_storage_migration_status")?.unwrap_or_else(|| "Not run.".into()),
        "lastError": last_error,
    }))
}

fn record_counts(conn: &Connection) -> Result<Value> {
    let mut counts = Map::new();
    for collection in COLLECTIONS {
        let sql = format!(
            "SELECT COUNT(*) FROM {} WHERE lifecycleStatus != 'archived'",
            collection.table
        );
        let count: i64 = conn.query_row(&sql, [], |row| row.get(0))?;
        counts.insert(
            collection.snapshot_key.to_string(),
            Value::Number(count.into()),
        );
    }
    Ok(Value::Object(counts))
}

fn count_all_records(conn: &Connection) -> Result<i64> {
    let mut total = 0;
    for collection in COLLECTIONS {
        let sql = format!("SELECT COUNT(*) FROM {}", collection.table);
        total += conn.query_row(&sql, [], |row| row.get::<_, i64>(0))?;
    }
    Ok(total)
}

fn count_records_in_database(database: &Value) -> usize {
    COLLECTIONS
        .iter()
        .map(|collection| {
            database
                .get(collection.snapshot_key)
                .and_then(Value::as_array)
                .map(Vec::len)
                .unwrap_or(0)
        })
        .sum()
}

fn clear_domain_tables(conn: &Connection) -> Result<()> {
    for collection in COLLECTIONS.iter().rev() {
        let sql = format!("DELETE FROM {}", collection.table);
        conn.execute(&sql, [])?;
    }
    Ok(())
}

fn recreate_schema(conn: &Connection) -> Result<()> {
    for table in [
        "corrective_actions",
        "findings",
        "segs",
        "risk_assessments",
        "controls",
        "hazards",
        "chemicals",
        "equipment",
        "processes",
        "locations",
        "persistence_meta",
        "migration_log",
        "schema_version",
    ] {
        conn.execute(&format!("DROP TABLE IF EXISTS {table}"), [])?;
    }

    conn.execute_batch(include_str!("../migrations/001_initial.sql"))?;
    conn.execute_batch(include_str!("../migrations/002_corrective_actions_workflow.sql"))?;
    conn.execute_batch(include_str!(
        "../migrations/003_corrective_actions_evidence_reference.sql"
    ))?;
    conn.execute_batch(include_str!("../migrations/004_equipment_register.sql"))?;
    conn.execute_batch(include_str!(
        "../migrations/005_chemical_sds_exposure_fields.sql"
    ))?;
    conn.execute_batch(include_str!("../migrations/006_controls_risk_assessments.sql"))?;
    conn.execute(
        "INSERT INTO schema_version (version, applied_at) VALUES (?1, ?2)",
        params![SCHEMA_VERSION, now_iso()],
    )?;
    conn.execute(
        "INSERT INTO migration_log (id, version, name, started_at, finished_at, status)
         VALUES (?1, ?2, 'recreate_schema', ?3, ?4, 'applied')",
        params![
            Uuid::new_v4().to_string(),
            SCHEMA_VERSION,
            now_iso(),
            now_iso()
        ],
    )?;
    Ok(())
}

fn import_database(conn: &Connection, database: &Value) -> Result<()> {
    clear_domain_tables(conn)?;
    for collection in COLLECTIONS {
        let records = database
            .get(collection.snapshot_key)
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();

        for record in records {
            let normalized = normalize_import_record(*collection, record)?;
            insert_record(conn, *collection, &normalized)?;
        }
    }
    Ok(())
}

fn parse_local_storage_database(raw: &str) -> Result<Value> {
    let parsed: Value = serde_json::from_str(raw)?;
    let mut database = Map::new();
    database.insert("schemaVersion".into(), Value::Number(SCHEMA_VERSION.into()));
    database.insert(
        "initializedAt".into(),
        parsed
            .get("initializedAt")
            .and_then(Value::as_str)
            .map(|value| Value::String(value.to_string()))
            .unwrap_or_else(|| Value::String(now_iso())),
    );
    database.insert("updatedAt".into(), Value::String(now_iso()));

    for collection in COLLECTIONS {
        database.insert(
            collection.snapshot_key.into(),
            parsed
                .get(collection.snapshot_key)
                .and_then(Value::as_array)
                .cloned()
                .map(Value::Array)
                .unwrap_or_else(|| Value::Array(Vec::new())),
        );
    }

    Ok(Value::Object(database))
}

fn normalize_import_record(collection: Collection, record: Value) -> Result<Value> {
    let mut map = object_from_value(record)?;
    let timestamp = now_iso();
    let id = map
        .get("id")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "imported-record");
    map.insert("id".into(), Value::String(id.to_string()));
    map.entry("createdAt")
        .or_insert_with(|| Value::String(timestamp.clone()));
    map.entry("updatedAt")
        .or_insert_with(|| Value::String(timestamp.clone()));
    map.entry("lifecycleStatus")
        .or_insert_with(|| Value::String("active".into()));
    map.entry("archivedAt").or_insert(Value::Null);
    map.entry("archivedReason").or_insert(Value::Null);
    normalize_record(collection, Value::Object(map))
}

fn seed_demo_data(conn: &Connection) -> Result<()> {
    for collection in COLLECTIONS {
        for record in seed_records_for(*collection)? {
            insert_record(conn, *collection, &normalize_record(*collection, record)?)?;
        }
    }
    Ok(())
}

fn seed_records_for(collection: Collection) -> Result<Vec<Value>> {
    let timestamp = "2026-07-09T00:00:00.000Z";
    let lifecycle = |mut value: Value| -> Value {
        let map = value.as_object_mut().expect("seed record object");
        map.insert("createdAt".into(), Value::String(timestamp.into()));
        map.insert("updatedAt".into(), Value::String(timestamp.into()));
        map.insert("lifecycleStatus".into(), Value::String("active".into()));
        map.insert("archivedAt".into(), Value::Null);
        map.insert("archivedReason".into(), Value::Null);
        value
    };

    let records = match collection.api_name {
        "locations" => vec![
            lifecycle(
                json!({"id":"loc-demo-main-facility","name":"Main Facility","type":"Facility","description":"Primary operating location seeded for the MVP Locations workflow.","status":"active"}),
            ),
            lifecycle(
                json!({"id":"loc-demo-chemical-storage","name":"Chemical Storage Room","type":"Storage","description":"Controlled storage area seeded so persistence can be verified immediately.","status":"active"}),
            ),
            lifecycle(
                json!({"id":"loc-demo-workshop","name":"Workshop","type":"Production Area","description":"Maintenance and fabrication workshop area.","status":"active"}),
            ),
        ],
        "processes" => vec![
            lifecycle(
                json!({"id":"process-demo-chemical-receipt","name":"Chemical Receipt and Inspection","locationId":"loc-demo-main-facility","category":"Transfer","description":"Procedure for receiving, inspecting, and logging incoming chemical deliveries.","status":"active"}),
            ),
            lifecycle(
                json!({"id":"process-demo-equipment-maint","name":"Preventive Equipment Maintenance","locationId":"loc-demo-workshop","category":"Maintenance","description":"Scheduled maintenance checks and records for all production equipment.","status":"active"}),
            ),
        ],
        "equipment" => vec![
            lifecycle(
                json!({"id":"equipment-demo-dust-collector","name":"Workshop Dust Collector","type":"Dust Collector","locationId":"loc-demo-workshop","processId":"process-demo-equipment-maint","description":"Local exhaust equipment used during grinding and fabrication tasks.","status":"active","notes":"Track as HSE-relevant ventilation equipment, not a maintenance asset ledger."}),
            ),
            lifecycle(
                json!({"id":"equipment-demo-flammable-cabinet","name":"Flammable Storage Cabinet","type":"Emergency Equipment","locationId":"loc-demo-chemical-storage","processId":"process-demo-chemical-receipt","description":"Approved cabinet used for storing flammable chemicals before transfer to use areas.","status":"active","notes":"Relevant to chemical storage controls and inspection findings."}),
            ),
        ],
        "chemicals" => vec![
            lifecycle(
                json!({"id":"chem-demo-acetone","name":"Acetone","casNumber":"67-64-1","hazardClass":"Flammable","processIds":["process-demo-chemical-receipt"],"storageLocationId":"loc-demo-chemical-storage","sdsStatus":"Current","sdsReference":"SDS-ACETONE-2026","sdsRevisionDate":"2026-01-15","sdsReviewDate":"2027-01-15","exposureLimitValue":"250","exposureLimitUnit":"ppm","exposureLimitSource":"ACGIH TLV","exposureLimitAveragingPeriod":"8-hour TWA","quantity":"50","unit":"L","supplier":"ChemSupply Ltd.","status":"active","notes":"Keep away from ignition sources. Store in approved flammable cabinet."}),
            ),
            lifecycle(
                json!({"id":"chem-demo-sodium-hydroxide","name":"Sodium Hydroxide","casNumber":"1310-73-2","hazardClass":"Corrosive","processIds":["process-demo-chemical-receipt"],"storageLocationId":"loc-demo-chemical-storage","sdsStatus":"Missing","sdsReference":"","sdsRevisionDate":"","sdsReviewDate":"","exposureLimitValue":"2","exposureLimitUnit":"mg/m3","exposureLimitSource":"OSHA PEL","exposureLimitAveragingPeriod":"Ceiling","quantity":"25","unit":"kg","supplier":"Industrial Chem Co.","status":"active","notes":"Use full PPE: gloves, face shield, and chemical-resistant apron."}),
            ),
        ],
        "hazards" => vec![
            lifecycle(
                json!({"id":"hazard-demo-slips","title":"Slip hazard near chemical storage entry","category":"Physical","locationId":"loc-demo-main-facility","locationIds":["loc-demo-main-facility"],"processIds":["process-demo-chemical-receipt"],"chemicalIds":["chem-demo-acetone","chem-demo-sodium-hydroxide"],"severity":"Medium","likelihood":"Possible","description":"Wet floors near the storage room entrance create slip risk for personnel accessing chemicals.","controls":"Non-slip matting installed. Spill kit accessible. Signage posted.","status":"active"}),
            ),
            lifecycle(
                json!({"id":"hazard-demo-noise","title":"Elevated noise levels in workshop","category":"Physical","locationId":"loc-demo-workshop","locationIds":["loc-demo-workshop"],"processIds":["process-demo-equipment-maint"],"chemicalIds":[],"severity":"High","likelihood":"Likely","description":"Grinding and fabrication activities produce noise levels above 85dB.","controls":"Mandatory hearing protection. Signage at entry points. Noise monitoring scheduled.","status":"mitigated"}),
            ),
        ],
        "controls" => vec![
            lifecycle(
                json!({"id":"control-demo-slip-matting","name":"Non-slip matting and spill signage","type":"Engineering","hazardIds":["hazard-demo-slips"],"description":"Floor matting, spill kit access, and posted signage for the chemical storage entry.","owner":"Facilities Lead","verificationMethod":"Monthly field inspection","verificationFrequency":"Monthly","lastVerifiedAt":"","status":"needs-review","notes":"Verify mat condition and signage placement during walkthroughs."}),
            ),
            lifecycle(
                json!({"id":"control-demo-hearing-protection","name":"Workshop hearing protection zone","type":"PPE","hazardIds":["hazard-demo-noise"],"description":"Mandatory hearing protection and entry signage for high-noise workshop tasks.","owner":"HSE Officer","verificationMethod":"Field observation","verificationFrequency":"Quarterly","lastVerifiedAt":"","status":"active","notes":"Pair with noise monitoring review."}),
            ),
        ],
        "riskAssessments" => vec![
            lifecycle(
                json!({"id":"risk-demo-slip-storage-entry","title":"Chemical storage entry slip risk","hazardId":"hazard-demo-slips","controlIds":["control-demo-slip-matting"],"inherentSeverity":"Medium","inherentLikelihood":"Likely","residualSeverity":"Medium","residualLikelihood":"Possible","assessor":"Demo HSE Lead","reviewStatus":"Needs Review","nextReviewDate":"2026-10-01","notes":"Review after confirming matting condition and housekeeping controls."}),
            ),
        ],
        "segs" => vec![
            lifecycle(
                json!({"id":"seg-demo-chemical-handlers","name":"Chemical Handlers","type":"Similar Exposure Group","description":"Personnel who regularly handle, transfer, or work in proximity to stored chemicals.","locationId":"loc-demo-main-facility","processId":"process-demo-chemical-receipt","chemicalIds":["chem-demo-acetone","chem-demo-sodium-hydroxide"],"hazardIds":["hazard-demo-slips"],"agentType":"Chemical","exposureLevel":"Medium","workerCount":"8","controls":"PPE provision, ventilation, training, SDS access.","monitoringFrequency":"Monthly","status":"active"}),
            ),
            lifecycle(
                json!({"id":"seg-demo-welders","name":"Welders and Fabricators","type":"Task-Based Group","description":"Workshop personnel performing welding, cutting, and grinding tasks.","locationId":"loc-demo-workshop","processId":"process-demo-equipment-maint","chemicalIds":[],"hazardIds":["hazard-demo-noise"],"agentType":"Chemical / Physical","exposureLevel":"High","workerCount":"5","controls":"Welding screens, respiratory protection, LEV system, hearing protection.","monitoringFrequency":"Quarterly","status":"active"}),
            ),
        ],
        "findings" => vec![
            lifecycle(
                json!({"id":"finding-demo-egress","title":"Blocked emergency egress path","type":"Inspection Finding","description":"Materials were staged in front of a marked egress path during field review.","locationId":"loc-demo-main-facility","processId":"process-demo-equipment-maint","hazardId":"hazard-demo-slips","severity":"High","status":"Open","reportedBy":"Demo HSE Lead"}),
            ),
            lifecycle(
                json!({"id":"finding-demo-labeling","title":"Secondary container label needs update","type":"Observation","description":"A secondary chemical container label was partially unreadable.","locationId":"loc-demo-chemical-storage","processId":"process-demo-chemical-receipt","hazardId":"","severity":"Medium","status":"In Progress","reportedBy":"Demo Observer"}),
            ),
        ],
        "correctiveActions" => vec![
            lifecycle(
                json!({"id":"ca-demo-clear-egress","title":"Clear and re-mark emergency egress path","type":"Housekeeping","description":"Remove all materials staged in front of the egress route and repaint floor markings.","findingId":"finding-demo-egress","sourceType":"Finding","sourceId":"finding-demo-egress","sourceJustification":"","assignedTo":"Site Supervisor","priority":"High","status":"In Progress","dueDate":"2026-07-31","completionSummary":"","completedAt":null,"verificationRequired":true,"verificationMethod":"Field verification","verificationResult":"","evidenceReference":"","verifiedAt":null,"closedAt":null,"closureNotes":""}),
            ),
            lifecycle(
                json!({"id":"ca-demo-relabel","title":"Relabel secondary chemical container","type":"Administrative Control","description":"Print and apply a new GHS-compliant label to the identified container.","findingId":"finding-demo-labeling","sourceType":"Finding","sourceId":"finding-demo-labeling","sourceJustification":"","assignedTo":"HSE Officer","priority":"Medium","status":"Created","dueDate":"2026-07-20","completionSummary":"","completedAt":null,"verificationRequired":true,"verificationMethod":"Label review","verificationResult":"","evidenceReference":"","verifiedAt":null,"closedAt":null,"closureNotes":""}),
            ),
        ],
        _ => Vec::new(),
    };

    Ok(records)
}

fn set_meta(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO persistence_meta (key, value, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value, now_iso()],
    )?;
    Ok(())
}

fn get_meta(conn: &Connection, key: &str) -> Result<Option<String>> {
    conn.query_row(
        "SELECT value FROM persistence_meta WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .optional()
    .map_err(Into::into)
}

fn latest_migration_status(conn: &Connection) -> Result<String> {
    let status = conn
        .query_row(
            "SELECT 'Schema v' || version || ' is ready.' FROM schema_version ORDER BY version DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .optional()?
        .unwrap_or_else(|| "No migration has run.".into());
    Ok(status)
}

fn searchable_text(record: &Value) -> String {
    record
        .as_object()
        .map(|map| {
            map.values()
                .filter_map(Value::as_str)
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default()
}

fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

#[tauri::command]
pub fn oluso_initialize_persistence(
    app: AppHandle,
    local_storage_snapshot: Option<String>,
) -> std::result::Result<PersistenceSnapshot, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path)
        .initialize(local_storage_snapshot)
        .map_err(Into::into)
}

#[tauri::command]
pub fn oluso_query_records(
    app: AppHandle,
    request: QueryRequest,
) -> std::result::Result<QueryResult, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path)
        .query(request)
        .map_err(Into::into)
}

#[tauri::command]
pub fn oluso_create_record(
    app: AppHandle,
    collection: String,
    input: Value,
) -> std::result::Result<PersistenceSnapshot, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path)
        .create_record(&collection, input)
        .map_err(Into::into)
}

#[tauri::command]
pub fn oluso_update_record(
    app: AppHandle,
    collection: String,
    id: String,
    input: Value,
) -> std::result::Result<PersistenceSnapshot, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path)
        .update_record(&collection, &id, input)
        .map_err(Into::into)
}

#[tauri::command]
pub fn oluso_archive_record(
    app: AppHandle,
    collection: String,
    id: String,
    reason: Option<String>,
) -> std::result::Result<PersistenceSnapshot, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path)
        .archive_record(&collection, &id, reason)
        .map_err(Into::into)
}

#[tauri::command]
pub fn oluso_restore_record(
    app: AppHandle,
    collection: String,
    id: String,
) -> std::result::Result<PersistenceSnapshot, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path)
        .restore_record(&collection, &id)
        .map_err(Into::into)
}

#[tauri::command]
pub fn oluso_reset_persistence(app: AppHandle) -> std::result::Result<PersistenceSnapshot, String> {
    let path = DatabaseManager::database_path_for_app(&app)?;
    DatabaseManager::new(path).reset().map_err(Into::into)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn test_manager() -> (tempfile::TempDir, DatabaseManager) {
        let dir = tempdir().expect("temp dir");
        let path = dir.path().join("oluso-test.db");
        (dir, DatabaseManager::new(path))
    }

    #[test]
    fn initializes_schema_and_seed_data() {
        let (_dir, manager) = test_manager();
        let snapshot = manager.initialize(None).expect("initialize");

        assert_eq!(snapshot.diagnostics["schemaVersion"], json!(6));
        assert_eq!(snapshot.diagnostics["recordCounts"]["locations"], json!(3));
        assert_eq!(snapshot.diagnostics["recordCounts"]["equipment"], json!(2));
        assert_eq!(snapshot.diagnostics["recordCounts"]["controls"], json!(2));
        assert_eq!(snapshot.diagnostics["recordCounts"]["riskAssessments"], json!(1));
        assert!(snapshot.database["chemicals"]
            .as_array()
            .unwrap()
            .iter()
            .any(|record| record["sdsStatus"] == json!("Missing")));
        assert_eq!(
            snapshot.database["locations"][0]["id"],
            json!("loc-demo-main-facility")
        );
    }

    #[test]
    fn migrates_local_storage_once() {
        let (_dir, manager) = test_manager();
        let local_storage = json!({
            "schemaVersion": 6,
            "locations": [{
                "id": "loc-imported",
                "name": "Imported Facility",
                "type": "Facility",
                "description": "From localStorage",
                "status": "active",
                "createdAt": "2026-07-08T00:00:00.000Z",
                "updatedAt": "2026-07-08T00:00:00.000Z",
                "lifecycleStatus": "active",
                "archivedAt": null,
                "archivedReason": null
            }]
        })
        .to_string();

        let first = manager.initialize(Some(local_storage)).expect("initialize");
        assert_eq!(first.database["locations"][0]["id"], json!("loc-imported"));
        assert_eq!(
            first.diagnostics["localStorageMigrationStatus"],
            json!("Imported 1 records from localStorage.")
        );

        let second = manager
            .initialize(Some(
                json!({"locations":[{"id":"loc-should-not-import"}]}).to_string(),
            ))
            .expect("initialize again");
        assert!(second.database["locations"]
            .as_array()
            .unwrap()
            .iter()
            .all(|record| record["id"] != json!("loc-should-not-import")));
    }

    #[test]
    fn creates_updates_archives_and_restores_records_transactionally() {
        let (_dir, manager) = test_manager();
        manager.initialize(None).expect("initialize");

        let created_equipment = manager
            .create_record(
                "equipment",
                json!({
                    "name": "LEV Hood",
                    "type": "Ventilation",
                    "locationId": "loc-demo-workshop",
                    "processId": "process-demo-equipment-maint",
                    "description": "Local exhaust ventilation hood.",
                    "status": "active",
                    "notes": "Exposure control equipment."
                }),
            )
            .expect("create equipment");
        assert!(created_equipment.database["equipment"]
            .as_array()
            .unwrap()
            .iter()
            .any(|record| record["name"] == json!("LEV Hood")));

        let created = manager
            .create_record(
                "locations",
                json!({
                    "name": "North Yard",
                    "type": "Outdoor Area",
                    "description": "Outdoor staging",
                    "status": "active"
                }),
            )
            .expect("create");
        let created_record = created.database["locations"]
            .as_array()
            .unwrap()
            .iter()
            .find(|record| record["name"] == json!("North Yard"))
            .unwrap();
        let id = created_record["id"].as_str().unwrap().to_string();

        let updated = manager
            .update_record(
                "locations",
                &id,
                json!({
                    "name": "North Yard Updated",
                    "type": "Outdoor Area",
                    "description": "Updated",
                    "status": "inactive"
                }),
            )
            .expect("update");
        assert!(updated.database["locations"]
            .as_array()
            .unwrap()
            .iter()
            .any(|record| record["name"] == json!("North Yard Updated")));

        let archived = manager
            .archive_record("locations", &id, Some("Closed".into()))
            .expect("archive");
        let archived_record = archived.database["locations"]
            .as_array()
            .unwrap()
            .iter()
            .find(|record| record["id"] == json!(id))
            .unwrap();
        assert_eq!(archived_record["lifecycleStatus"], json!("archived"));

        let restored = manager.restore_record("locations", &id).expect("restore");
        let restored_record = restored.database["locations"]
            .as_array()
            .unwrap()
            .iter()
            .find(|record| record["id"] == json!(id))
            .unwrap();
        assert_eq!(restored_record["lifecycleStatus"], json!("active"));
    }

    #[test]
    fn rolls_back_invalid_write() {
        let (_dir, manager) = test_manager();
        let before = manager.initialize(None).expect("initialize");
        let before_count = before.database["findings"].as_array().unwrap().len();

        let error = manager
            .create_record(
                "findings",
                json!({
                    "title": "Invalid finding",
                    "type": "Observation",
                    "description": "",
                    "locationId": "missing-location",
                    "processId": "",
                    "hazardId": "",
                    "severity": "Low",
                    "status": "Open",
                    "reportedBy": "Tester"
                }),
            )
            .expect_err("invalid reference rejected");
        assert!(error
            .to_string()
            .contains("Selected location was not found"));

        let after = manager.initialize(None).expect("reload");
        assert_eq!(
            after.database["findings"].as_array().unwrap().len(),
            before_count
        );
    }

    #[test]
    fn resets_database_atomically() {
        let (_dir, manager) = test_manager();
        manager.initialize(None).expect("initialize");
        manager
            .archive_record("locations", "loc-demo-workshop", Some("test".into()))
            .expect("archive");

        let reset = manager.reset().expect("reset");
        assert_eq!(reset.diagnostics["recordCounts"]["locations"], json!(3));
        assert!(reset.database["locations"]
            .as_array()
            .unwrap()
            .iter()
            .all(|record| record["lifecycleStatus"] == json!("active")));
    }
}
