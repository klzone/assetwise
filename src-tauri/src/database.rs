use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use anyhow::Error;
// use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Option<i64>,
    pub username: String,
    pub password_hash: String,
    pub email: Option<String>,
    pub subscription_type: String,
    pub subscription_expires_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Account {
    pub id: Option<i64>,
    pub user_id: i64,
    pub name: String,
    pub account_type: String,
    pub broker: Option<String>,
    pub account_number: Option<String>,
    pub currency: Option<String>,
    pub balance: f64,
    pub is_active: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Option<i64>,
    pub account_id: i64,
    pub user_id: i64,
    pub transaction_type: String,
    pub symbol: Option<String>,
    pub quantity: Option<f64>,
    pub price: Option<f64>,
    pub amount: f64,
    pub fee: Option<f64>,
    pub transaction_date: String,
    pub description: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Asset {
    pub id: Option<i64>,
    pub user_id: i64,
    pub symbol: String,
    pub name: String,
    pub asset_type: String,
    pub quantity: f64,
    pub average_cost: f64,
    pub current_price: Option<f64>,
    pub total_value: f64,
    pub profit_loss: f64,
    pub profit_loss_percentage: f64,
    pub last_updated: Option<String>,
}

pub struct DatabaseManager {
    conn: Connection,
}

impl DatabaseManager {
    pub fn new(db_path: PathBuf) -> Result<Self, Error> {
        // 确保数据库目录存在
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)?;
        
        // 启用外键约束
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        let db_manager = DatabaseManager { conn };
        db_manager.create_tables()?;
        
        Ok(db_manager)
    }

    fn create_tables(&self) -> Result<(), Error> {
        // 用户表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                subscription_type TEXT DEFAULT 'free',
                subscription_expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 账户表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                broker TEXT,
                account_number TEXT,
                currency TEXT DEFAULT 'CNY',
                balance DECIMAL(15,4) DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 交易记录表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                symbol TEXT,
                quantity DECIMAL(15,8),
                price DECIMAL(15,4),
                amount DECIMAL(15,4) NOT NULL,
                fee DECIMAL(15,4),
                transaction_date DATE NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 复盘日志表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS review_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT,
                content TEXT,
                emotion_score INTEGER,
                tags TEXT,
                related_transactions TEXT,
                review_date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 投资计划表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS investment_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                target_amount DECIMAL(15,4),
                current_amount DECIMAL(15,4) DEFAULT 0,
                target_date DATE,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建索引
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)", [])?;
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)", [])?;
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)", [])?;
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)", [])?;
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON review_logs(user_id)", [])?;
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_investment_plans_user_id ON investment_plans(user_id)", [])?;

        Ok(())
    }

    // 用户相关方法
    pub fn create_user(&self, user: &User) -> Result<i64, Error> {
        let hashed_password = bcrypt::hash(&user.password_hash, bcrypt::DEFAULT_COST)?;
        
        let mut stmt = self.conn.prepare(
            "INSERT INTO users (username, password_hash, email, subscription_type, subscription_expires_at)
             VALUES (?1, ?2, ?3, ?4, ?5)"
        )?;
        
        stmt.execute(params![
            user.username,
            hashed_password,
            user.email,
            user.subscription_type,
            user.subscription_expires_at
        ])?;
        
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_user_by_username(&self, username: &str) -> Result<Option<User>, Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, password_hash, email, subscription_type, subscription_expires_at, created_at, updated_at
             FROM users WHERE username = ?1"
        )?;
        
        let user_iter = stmt.query_map([username], |row| {
            Ok(User {
                id: Some(row.get(0)?),
                username: row.get(1)?,
                password_hash: row.get(2)?,
                email: row.get(3)?,
                subscription_type: row.get(4)?,
                subscription_expires_at: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        for user in user_iter {
            return Ok(Some(user?));
        }
        
        Ok(None)
    }

    pub fn verify_password(&self, username: &str, password: &str) -> Result<bool, Error> {
        if let Some(user) = self.get_user_by_username(username)? {
            Ok(bcrypt::verify(password, &user.password_hash)?)
        } else {
            Ok(false)
        }
    }

    // 账户相关方法
    pub fn create_account(&self, account: &Account) -> Result<i64, Error> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO accounts (user_id, name, type, broker, account_number, currency, balance, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )?;
        
        stmt.execute(params![
            account.user_id,
            account.name,
            account.account_type,
            account.broker,
            account.account_number,
            account.currency,
            account.balance,
            account.is_active
        ])?;
        
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_accounts_by_user_id(&self, user_id: i64) -> Result<Vec<Account>, Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, user_id, name, type, broker, account_number, currency, balance, is_active, created_at, updated_at
             FROM accounts WHERE user_id = ?1 ORDER BY created_at DESC"
        )?;
        
        let account_iter = stmt.query_map([user_id], |row| {
            Ok(Account {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                name: row.get(2)?,
                account_type: row.get(3)?,
                broker: row.get(4)?,
                account_number: row.get(5)?,
                currency: row.get(6)?,
                balance: row.get(7)?,
                is_active: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;

        let mut accounts = Vec::new();
        for account in account_iter {
            accounts.push(account?);
        }
        
        Ok(accounts)
    }

    // 交易记录相关方法
    pub fn create_transaction(&self, transaction: &Transaction) -> Result<i64, Error> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO transactions (account_id, user_id, type, symbol, quantity, price, amount, fee, transaction_date, description)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
        )?;
        
        stmt.execute(params![
            transaction.account_id,
            transaction.user_id,
            transaction.transaction_type,
            transaction.symbol,
            transaction.quantity,
            transaction.price,
            transaction.amount,
            transaction.fee,
            transaction.transaction_date,
            transaction.description
        ])?;
        
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_transactions_by_user_id(&self, user_id: i64) -> Result<Vec<Transaction>, Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, account_id, user_id, type, symbol, quantity, price, amount, fee, transaction_date, description, created_at
             FROM transactions WHERE user_id = ?1 ORDER BY transaction_date DESC"
        )?;
        
        let transaction_iter = stmt.query_map([user_id], |row| {
            Ok(Transaction {
                id: Some(row.get(0)?),
                account_id: row.get(1)?,
                user_id: row.get(2)?,
                transaction_type: row.get(3)?,
                symbol: row.get(4)?,
                quantity: row.get(5)?,
                price: row.get(6)?,
                amount: row.get(7)?,
                fee: row.get(8)?,
                transaction_date: row.get(9)?,
                description: row.get(10)?,
                created_at: row.get(11)?,
            })
        })?;

        let mut transactions = Vec::new();
        for transaction in transaction_iter {
            transactions.push(transaction?);
        }
        
        Ok(transactions)
    }

    pub fn update_account(&self, account: &Account) -> Result<(), Error> {
        self.conn.execute(
            "UPDATE accounts SET name = ?1, account_type = ?2, broker = ?3, account_number = ?4,
             currency = ?5, balance = ?6, is_active = ?7, updated_at = datetime('now')
             WHERE id = ?8",
            params![
                account.name,
                account.account_type,
                account.broker,
                account.account_number,
                account.currency,
                account.balance,
                account.is_active,
                account.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_account(&self, account_id: i64) -> Result<(), Error> {
        // 先删除相关的交易记录
        self.conn.execute(
            "DELETE FROM transactions WHERE account_id = ?1",
            params![account_id],
        )?;

        // 然后删除账户
        self.conn.execute(
            "DELETE FROM accounts WHERE id = ?1",
            params![account_id],
        )?;
        Ok(())
    }

    pub fn update_transaction(&self, transaction: &Transaction) -> Result<(), Error> {
        self.conn.execute(
            "UPDATE transactions SET account_id = ?1, type = ?2, symbol = ?3, quantity = ?4,
             price = ?5, amount = ?6, fee = ?7, transaction_date = ?8, description = ?9
             WHERE id = ?10",
            params![
                transaction.account_id,
                transaction.transaction_type,
                transaction.symbol,
                transaction.quantity,
                transaction.price,
                transaction.amount,
                transaction.fee,
                transaction.transaction_date,
                transaction.description,
                transaction.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_transaction(&self, transaction_id: i64) -> Result<(), Error> {
        self.conn.execute(
            "DELETE FROM transactions WHERE id = ?1",
            params![transaction_id],
        )?;
        Ok(())
    }

    pub fn clear_all_data(&self) -> Result<(), Error> {
        // 删除所有交易记录
        self.conn.execute("DELETE FROM transactions", [])?;

        // 删除所有账户
        self.conn.execute("DELETE FROM accounts", [])?;

        // 删除所有用户（除了管理员）
        self.conn.execute("DELETE FROM users WHERE username != 'admin'", [])?;

        Ok(())
    }

    pub fn update_user_password(&self, username: &str, new_password: &str) -> Result<(), Error> {
        let password_hash = bcrypt::hash(new_password, bcrypt::DEFAULT_COST)
            .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?;

        self.conn.execute(
            "UPDATE users SET password_hash = ?1, updated_at = datetime('now') WHERE username = ?2",
            params![password_hash, username],
        )?;
        Ok(())
    }

    pub fn get_all_users(&self) -> Result<Vec<User>, Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, username, password_hash, email, subscription_type, subscription_expires_at, created_at, updated_at
             FROM users ORDER BY created_at DESC"
        )?;

        let user_iter = stmt.query_map([], |row| {
            Ok(User {
                id: Some(row.get(0)?),
                username: row.get(1)?,
                password_hash: row.get(2)?,
                email: row.get(3)?,
                subscription_type: row.get(4)?,
                subscription_expires_at: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut users = Vec::new();
        for user in user_iter {
            users.push(user?);
        }

        Ok(users)
    }

    // 资产相关方法
    pub fn get_user_assets(&self, user_id: i64) -> Result<Vec<Asset>, Error> {
        // 首先创建资产表（如果不存在）
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                average_cost REAL NOT NULL,
                current_price REAL,
                total_value REAL NOT NULL,
                profit_loss REAL NOT NULL,
                profit_loss_percentage REAL NOT NULL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )",
            [],
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, user_id, symbol, name, asset_type, quantity, average_cost,
                    current_price, total_value, profit_loss, profit_loss_percentage, last_updated
             FROM assets WHERE user_id = ?1"
        )?;

        let asset_iter = stmt.query_map([user_id], |row| {
            Ok(Asset {
                id: Some(row.get(0)?),
                user_id: row.get(1)?,
                symbol: row.get(2)?,
                name: row.get(3)?,
                asset_type: row.get(4)?,
                quantity: row.get(5)?,
                average_cost: row.get(6)?,
                current_price: row.get(7)?,
                total_value: row.get(8)?,
                profit_loss: row.get(9)?,
                profit_loss_percentage: row.get(10)?,
                last_updated: row.get(11)?,
            })
        })?;

        let mut assets = Vec::new();
        for asset in asset_iter {
            assets.push(asset?);
        }

        Ok(assets)
    }

    pub fn create_asset(&self, asset: &Asset) -> Result<i64, Error> {
        let mut stmt = self.conn.prepare(
            "INSERT INTO assets (user_id, symbol, name, asset_type, quantity, average_cost,
                               current_price, total_value, profit_loss, profit_loss_percentage)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
        )?;

        stmt.execute(params![
            asset.user_id,
            asset.symbol,
            asset.name,
            asset.asset_type,
            asset.quantity,
            asset.average_cost,
            asset.current_price,
            asset.total_value,
            asset.profit_loss,
            asset.profit_loss_percentage
        ])?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn update_asset(&self, asset: &Asset) -> Result<(), Error> {
        let mut stmt = self.conn.prepare(
            "UPDATE assets SET symbol = ?2, name = ?3, asset_type = ?4, quantity = ?5,
                             average_cost = ?6, current_price = ?7, total_value = ?8,
                             profit_loss = ?9, profit_loss_percentage = ?10,
                             last_updated = CURRENT_TIMESTAMP
             WHERE id = ?1"
        )?;

        stmt.execute(params![
            asset.id,
            asset.symbol,
            asset.name,
            asset.asset_type,
            asset.quantity,
            asset.average_cost,
            asset.current_price,
            asset.total_value,
            asset.profit_loss,
            asset.profit_loss_percentage
        ])?;

        Ok(())
    }

    pub fn delete_asset(&self, asset_id: i64) -> Result<(), Error> {
        let mut stmt = self.conn.prepare("DELETE FROM assets WHERE id = ?1")?;
        stmt.execute([asset_id])?;
        Ok(())
    }

    // 从交易记录计算并更新资产
    pub fn calculate_assets_from_transactions(&self, user_id: i64) -> Result<(), Error> {
        // 获取用户所有交易记录
        let transactions = self.get_transactions_by_user_id(user_id)?;

        // 按股票代码分组计算
        let mut asset_map: std::collections::HashMap<String, (f64, f64, String)> = std::collections::HashMap::new();

        for transaction in transactions {
            if let Some(symbol) = &transaction.symbol {
                let quantity = transaction.quantity.unwrap_or(0.0);
                let price = transaction.price.unwrap_or(0.0);

                let entry = asset_map.entry(symbol.clone()).or_insert((0.0, 0.0, "stock".to_string()));

                if transaction.transaction_type == "buy" {
                    entry.0 += quantity;
                    if entry.0 > 0.0 {
                        entry.1 = (entry.1 * (entry.0 - quantity) + price * quantity) / entry.0;
                    }
                } else if transaction.transaction_type == "sell" {
                    entry.0 -= quantity;
                }
            }
        }

        // 清除现有资产
        self.conn.execute("DELETE FROM assets WHERE user_id = ?1", [user_id])?;

        // 插入计算后的资产
        for (symbol, (quantity, avg_cost, asset_type)) in asset_map {
            if quantity > 0.0 {
                let current_price = avg_cost; // 简化处理，实际应该获取实时价格
                let total_value = quantity * current_price;
                let cost_basis = quantity * avg_cost;
                let profit_loss = total_value - cost_basis;
                let profit_loss_percentage = if cost_basis > 0.0 { (profit_loss / cost_basis) * 100.0 } else { 0.0 };

                let asset = Asset {
                    id: None,
                    user_id,
                    symbol: symbol.clone(),
                    name: symbol.clone(), // 简化处理
                    asset_type,
                    quantity,
                    average_cost: avg_cost,
                    current_price: Some(current_price),
                    total_value,
                    profit_loss,
                    profit_loss_percentage,
                    last_updated: None,
                };

                self.create_asset(&asset)?;
            }
        }

        Ok(())
    }
}
