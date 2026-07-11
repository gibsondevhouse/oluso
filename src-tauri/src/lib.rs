mod persistence;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            persistence::oluso_initialize_persistence,
            persistence::oluso_query_records,
            persistence::oluso_create_record,
            persistence::oluso_update_record,
            persistence::oluso_archive_record,
            persistence::oluso_restore_record,
            persistence::oluso_reset_persistence
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
