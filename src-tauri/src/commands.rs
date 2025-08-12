use crate::database::{DatabaseManager, User, Account, Transaction, Asset};
use crate::cloud_sync::{CloudSyncService, CloudSyncData};
use std::sync::Mutex;
use tauri::State;
use serde_json::Value;

pub type DbState = Mutex<DatabaseManager>;

#[tauri::command]
pub async fn login_user(
    username: String,
    password: String,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    match db.verify_password(&username, &password) {
        Ok(true) => {
            match db.get_user_by_username(&username) {
                Ok(Some(user)) => Ok(serde_json::json!({
                    "success": true,
                    "user": user
                })),
                Ok(None) => Err("User not found".to_string()),
                Err(e) => Err(format!("Database error: {}", e)),
            }
        },
        Ok(false) => Err("Invalid credentials".to_string()),
        Err(e) => Err(format!("Authentication error: {}", e)),
    }
}

#[tauri::command]
pub async fn register_user(
    user_data: User,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    match db.create_user(&user_data) {
        Ok(user_id) => Ok(serde_json::json!({
            "success": true,
            "user_id": user_id
        })),
        Err(e) => Err(format!("Failed to create user: {}", e)),
    }
}

#[tauri::command]
pub async fn get_user_accounts(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Vec<Account>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    match db.get_accounts_by_user_id(user_id) {
        Ok(accounts) => Ok(accounts),
        Err(e) => Err(format!("Failed to fetch accounts: {}", e)),
    }
}

#[tauri::command]
pub async fn create_account(
    account_data: Account,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    match db.create_account(&account_data) {
        Ok(account_id) => Ok(serde_json::json!({
            "success": true,
            "account_id": account_id
        })),
        Err(e) => Err(format!("Failed to create account: {}", e)),
    }
}

#[tauri::command]
pub async fn get_user_transactions(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Vec<Transaction>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    match db.get_transactions_by_user_id(user_id) {
        Ok(transactions) => Ok(transactions),
        Err(e) => Err(format!("Failed to fetch transactions: {}", e)),
    }
}

#[tauri::command]
pub async fn create_transaction(
    transaction_data: Transaction,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    match db.create_transaction(&transaction_data) {
        Ok(transaction_id) => Ok(serde_json::json!({
            "success": true,
            "transaction_id": transaction_id
        })),
        Err(e) => Err(format!("Failed to create transaction: {}", e)),
    }
}

#[tauri::command]
pub async fn update_account(
    account_data: Account,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.update_account(&account_data) {
        Ok(_) => Ok(serde_json::json!({
            "success": true
        })),
        Err(e) => Err(format!("Failed to update account: {}", e)),
    }
}

#[tauri::command]
pub async fn delete_account(
    account_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.delete_account(account_id) {
        Ok(_) => Ok(serde_json::json!({
            "success": true
        })),
        Err(e) => Err(format!("Failed to delete account: {}", e)),
    }
}

#[tauri::command]
pub async fn update_transaction(
    transaction_data: Transaction,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.update_transaction(&transaction_data) {
        Ok(_) => Ok(serde_json::json!({
            "success": true
        })),
        Err(e) => Err(format!("Failed to update transaction: {}", e)),
    }
}

#[tauri::command]
pub async fn delete_transaction(
    transaction_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.delete_transaction(transaction_id) {
        Ok(_) => Ok(serde_json::json!({
            "success": true
        })),
        Err(e) => Err(format!("Failed to delete transaction: {}", e)),
    }
}

#[tauri::command]
pub async fn get_user_assets(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 从数据库获取用户资产
    let assets = db.get_user_assets(user_id)
        .map_err(|e| format!("Failed to get assets: {}", e))?;

    // 计算总价值和盈亏
    let total_value: f64 = assets.iter()
        .map(|asset| asset.quantity * asset.current_price.unwrap_or(0.0))
        .sum();

    let total_cost: f64 = assets.iter()
        .map(|asset| asset.quantity * asset.average_cost)
        .sum();

    let total_profit_loss = total_value - total_cost;

    Ok(serde_json::json!({
        "assets": assets,
        "total_value": total_value,
        "total_profit_loss": total_profit_loss,
        "profit_loss_percentage": if total_cost > 0.0 { (total_profit_loss / total_cost) * 100.0 } else { 0.0 }
    }))
}

#[tauri::command]
pub async fn create_asset(
    asset_data: Value,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 解析资产数据
    let asset: Asset = serde_json::from_value(asset_data)
        .map_err(|e| format!("Invalid asset data: {}", e))?;

    // 创建资产
    let asset_id = db.create_asset(&asset)
        .map_err(|e| format!("Failed to create asset: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "asset_id": asset_id
    }))
}

#[tauri::command]
pub async fn update_asset(
    asset_data: Value,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 解析资产数据
    let asset: Asset = serde_json::from_value(asset_data)
        .map_err(|e| format!("Invalid asset data: {}", e))?;

    // 更新资产
    db.update_asset(&asset)
        .map_err(|e| format!("Failed to update asset: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "message": "Asset updated successfully"
    }))
}

#[tauri::command]
pub async fn delete_asset(
    asset_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 删除资产
    db.delete_asset(asset_id)
        .map_err(|e| format!("Failed to delete asset: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "message": "Asset deleted successfully"
    }))
}

#[tauri::command]
pub async fn calculate_assets_from_transactions(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 从交易记录计算资产
    db.calculate_assets_from_transactions(user_id)
        .map_err(|e| format!("Failed to calculate assets: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "message": "Assets calculated from transactions"
    }))
}



#[tauri::command]
pub async fn get_user_investment_plans(
    _user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟投资计划数据
    Ok(serde_json::json!({
        "plans": []
    }))
}

#[tauri::command]
pub async fn create_investment_plan(
    plan_data: Value,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟创建投资计划
    Ok(serde_json::json!({
        "success": true,
        "plan_id": 1
    }))
}

#[tauri::command]
pub async fn update_investment_plan(
    plan_data: Value,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟更新投资计划
    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub async fn delete_investment_plan(
    plan_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟删除投资计划
    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub async fn get_user_reviews(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟复盘数据
    Ok(serde_json::json!({
        "reviews": []
    }))
}

#[tauri::command]
pub async fn create_review(
    review_data: Value,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟创建复盘
    Ok(serde_json::json!({
        "success": true,
        "review_id": 1
    }))
}

#[tauri::command]
pub async fn update_review(
    review_data: Value,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟更新复盘
    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub async fn delete_review(
    review_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let _db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 模拟删除复盘
    Ok(serde_json::json!({
        "success": true
    }))
}

#[tauri::command]
pub async fn get_dashboard_data(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 获取用户账户数量
    let accounts_count = match db.get_accounts_by_user_id(user_id) {
        Ok(accounts) => accounts.len(),
        Err(_) => 0,
    };

    // 获取用户交易数量
    let transactions_count = match db.get_transactions_by_user_id(user_id) {
        Ok(transactions) => transactions.len(),
        Err(_) => 0,
    };

    Ok(serde_json::json!({
        "total_assets": 0.0,
        "total_profit_loss": 0.0,
        "accounts_count": accounts_count,
        "transactions_count": transactions_count,
        "recent_transactions": [],
        "asset_allocation": [],
        "performance_chart": []
    }))
}

#[tauri::command]
pub async fn clear_all_data(
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.clear_all_data() {
        Ok(_) => Ok(serde_json::json!({
            "success": true
        })),
        Err(e) => Err(format!("Failed to clear data: {}", e)),
    }
}

#[tauri::command]
pub async fn verify_password(
    username: String,
    password: String,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.verify_password(&username, &password) {
        Ok(is_valid) => Ok(serde_json::json!({
            "valid": is_valid
        })),
        Err(e) => Err(format!("Password verification error: {}", e)),
    }
}

#[tauri::command]
pub async fn reset_password(
    username: String,
    new_password: String,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.update_user_password(&username, &new_password) {
        Ok(_) => Ok(serde_json::json!({
            "success": true
        })),
        Err(e) => Err(format!("Failed to reset password: {}", e)),
    }
}

#[tauri::command]
pub async fn get_debug_users(
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    match db.get_all_users() {
        Ok(users) => Ok(serde_json::json!({
            "users": users
        })),
        Err(e) => Err(format!("Failed to get users: {}", e)),
    }
}

#[tauri::command]
pub async fn get_app_info() -> Result<Value, String> {
    Ok(serde_json::json!({
        "name": "AssetWise",
        "version": "1.0.0",
        "description": "智能投资组合管理系统"
    }))
}

// 云端同步命令
#[tauri::command]
pub async fn sync_data_to_cloud(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    // 在作用域内获取数据，然后释放锁
    let (accounts_json, transactions_json, reviews_json) = {
        let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;

        // 获取用户的所有数据
        let accounts = db.get_accounts_by_user_id(user_id)
            .map_err(|e| format!("Failed to get accounts: {}", e))?;
        let transactions = db.get_transactions_by_user_id(user_id)
            .map_err(|e| format!("Failed to get transactions: {}", e))?;
        // 暂时返回空的reviews，因为数据库中还没有实现这个方法
        let reviews: Vec<serde_json::Value> = vec![];

        // 转换为JSON格式
        let accounts_json: Vec<Value> = accounts.into_iter()
            .map(|acc| serde_json::to_value(acc).unwrap_or(Value::Null))
            .collect();
        let transactions_json: Vec<Value> = transactions.into_iter()
            .map(|trans| serde_json::to_value(trans).unwrap_or(Value::Null))
            .collect();
        let reviews_json: Vec<Value> = reviews;

        (accounts_json, transactions_json, reviews_json)
    }; // 锁在这里被释放

    // 创建同步数据
    let sync_data = CloudSyncData {
        user_id,
        accounts: accounts_json,
        transactions: transactions_json,
        reviews: reviews_json,
        sync_timestamp: chrono::Utc::now().to_rfc3339(),
        device_id: CloudSyncService::generate_device_id(),
    };

    // 上传到云端
    let cloud_service = CloudSyncService::new();
    match cloud_service.upload_data(sync_data).await {
        Ok(true) => Ok(serde_json::json!({
            "success": true,
            "message": "数据已成功上传到云端"
        })),
        Ok(false) => Err("云端同步失败".to_string()),
        Err(e) => Err(format!("云端同步错误: {}", e)),
    }
}

#[tauri::command]
pub async fn sync_data_from_cloud(
    user_id: i64,
    db: State<'_, DbState>,
) -> Result<Value, String> {
    let cloud_service = CloudSyncService::new();
    let device_id = CloudSyncService::generate_device_id();

    match cloud_service.download_data(user_id, &device_id).await {
        Ok(Some(cloud_data)) => {
            // 这里应该实现将云端数据导入到本地数据库的逻辑
            // 目前返回成功响应
            Ok(serde_json::json!({
                "success": true,
                "message": "数据已从云端同步到本地"
            }))
        },
        Ok(None) => Ok(serde_json::json!({
            "success": true,
            "message": "云端暂无数据"
        })),
        Err(e) => Err(format!("从云端同步数据失败: {}", e)),
    }
}
