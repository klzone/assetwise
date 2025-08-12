mod database;
mod commands;
mod cloud_sync;

use database::DatabaseManager;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // 初始化数据库
      let app_dir = app.path()
        .app_data_dir()
        .expect("Failed to get app data directory");

      std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

      let db_path = app_dir.join("assetwise.db");
      let db_manager = DatabaseManager::new(db_path)
        .expect("Failed to initialize database");

      // 将数据库管理器添加到应用状态
      app.manage(Mutex::new(db_manager));

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::login_user,
      commands::register_user,
      commands::get_user_accounts,
      commands::create_account,
      commands::update_account,
      commands::delete_account,
      commands::get_user_transactions,
      commands::create_transaction,
      commands::update_transaction,
      commands::delete_transaction,
      commands::get_user_reviews,
      commands::create_review,
      commands::update_review,
      commands::delete_review,
      commands::get_dashboard_data,
      commands::sync_data_to_cloud,
      commands::sync_data_from_cloud,
      commands::get_user_assets,
      commands::create_asset,
      commands::update_asset,
      commands::delete_asset,
      commands::calculate_assets_from_transactions
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
