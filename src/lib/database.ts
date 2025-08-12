// 在静态导出模式下不导入better-sqlite3
let Database: any = null;
if (process.env.TAURI_BUILD !== 'true') {
  try {
    Database = require('better-sqlite3');
  } catch (error) {
    console.warn('better-sqlite3 not available in static export mode');
  }
}
import CryptoJS from 'crypto-js';
import path from 'path';
import fs from 'fs';

// 数据库配置
const DB_PATH = path.join(process.cwd(), 'data', 'assetwise.db');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库实例
let db: Database.Database | null = null;

// 初始化数据库
export function initDatabase() {
  // 在静态导出模式下返回null
  if (process.env.TAURI_BUILD === 'true' || !Database) {
    return null;
  }

  if (db) return db;

  db = new Database(DB_PATH);
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 创建表结构
  createTables();
  
  return db;
}

// 创建数据库表
function createTables() {
  if (!db) throw new Error('Database not initialized');

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      subscription_type TEXT DEFAULT 'free', -- free, pro, premium
      subscription_expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 账户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- stock, fund, cash, crypto
      broker TEXT, -- 券商名称
      account_number TEXT, -- 账户号码（加密存储）
      currency TEXT DEFAULT 'CNY',
      balance DECIMAL(15,4) DEFAULT 0, -- 账户余额
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 添加balance列到accounts表（如果不存在）
  try {
    db.exec(`ALTER TABLE accounts ADD COLUMN balance DECIMAL(15,4) DEFAULT 0`);
  } catch {
    // 列可能已经存在，忽略错误
  }

  // 资产表
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      symbol TEXT NOT NULL, -- 股票代码或基金代码
      name TEXT NOT NULL, -- 资产名称
      type TEXT NOT NULL, -- stock, fund, bond, cash
      quantity DECIMAL(15,4) DEFAULT 0,
      avg_cost DECIMAL(15,4) DEFAULT 0,
      current_price DECIMAL(15,4) DEFAULT 0,
      market_value DECIMAL(15,4) DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
    )
  `);

  // 交易记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      asset_id INTEGER,
      type TEXT NOT NULL, -- buy, sell, dividend, deposit, withdraw
      symbol TEXT,
      quantity DECIMAL(15,4),
      price DECIMAL(15,4),
      amount DECIMAL(15,4) NOT NULL,
      fee DECIMAL(15,4) DEFAULT 0,
      tax DECIMAL(15,4) DEFAULT 0,
      notes TEXT,
      transaction_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES assets (id) ON DELETE SET NULL
    )
  `);

  // 复盘日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT, -- 复盘内容（加密存储）
      emotion_score INTEGER, -- 情绪打分 1-10
      tags TEXT, -- JSON格式存储标签
      related_transactions TEXT, -- 关联的交易ID列表
      review_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 投资计划表
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_amount DECIMAL(15,4) NOT NULL,
      current_amount DECIMAL(15,4) DEFAULT 0,
      target_date DATE NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused', 'cancelled')),
      risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
      category TEXT CHECK(category IN ('stock', 'fund', 'crypto', 'cash', 'other')),
      expected_return DECIMAL(5,2) DEFAULT 0,
      actual_return DECIMAL(5,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // AI分析记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      analysis_type TEXT NOT NULL, -- portfolio_analysis, risk_assessment, recommendation
      input_data TEXT, -- 输入数据（加密存储）
      result TEXT, -- AI分析结果（加密存储）
      confidence_score DECIMAL(3,2), -- 置信度 0-1
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_assets_account_id ON assets(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON review_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_review_logs_date ON review_logs(review_date);
    CREATE INDEX IF NOT EXISTS idx_investment_plans_user_id ON investment_plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
  `);
}

// 数据加密函数
export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

// 数据解密函数
export function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// 获取数据库实例
export function getDatabase() {
  // 在静态导出模式下返回null
  if (process.env.TAURI_BUILD === 'true' || !Database) {
    return null;
  }

  if (!db) {
    return initDatabase();
  }
  return db;
}

// 导出数据库实例
export { db };

// 关闭数据库连接
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// 数据库操作类型定义
export interface User {
  id?: number;
  username: string;
  password_hash: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  subscription_type: 'free' | 'pro' | 'premium';
  subscription_expires_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface Account {
  id?: number;
  user_id: number;
  name: string;
  type: 'stock' | 'fund' | 'cash' | 'crypto';
  broker?: string;
  account_number?: string;
  currency: string;
  balance: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Asset {
  id?: number;
  account_id: number;
  symbol: string;
  name: string;
  type: 'stock' | 'fund' | 'bond' | 'cash';
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  updated_at?: Date;
}

export interface Transaction {
  id?: number;
  account_id: number;
  asset_id?: number;
  type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdraw';
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fee: number;
  tax: number;
  notes?: string;
  transaction_date: Date;
  created_at?: Date;
}

export interface ReviewLog {
  id?: number;
  user_id: number;
  title: string;
  content?: string;
  emotion_score?: number;
  tags?: string[];
  related_transactions?: number[];
  review_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface InvestmentPlan {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  target_amount?: number;
  current_amount: number;
  target_date?: Date;
  plan_type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIAnalysis {
  id?: number;
  user_id: number;
  analysis_type: 'portfolio_analysis' | 'risk_assessment' | 'recommendation';
  input_data: string;
  result: string;
  confidence_score?: number;
  created_at?: Date;
}
