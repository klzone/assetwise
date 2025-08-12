import { getDatabase, encryptData, decryptData, User, Account, Asset, Transaction, ReviewLog } from '../database';
import bcrypt from 'bcryptjs';

export class DatabaseService {
  private db = getDatabase();

  // 用户相关操作
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password_hash, 10);

    const stmt = this.db.prepare(`
      INSERT INTO users (username, password_hash, email, subscription_type, subscription_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    // 确保 subscription_expires_at 是字符串或 null
    const expiresAt = userData.subscription_expires_at
      ? (typeof userData.subscription_expires_at === 'string'
          ? userData.subscription_expires_at
          : userData.subscription_expires_at.toISOString())
      : null;

    const result = stmt.run(
      userData.username,
      hashedPassword,
      userData.email || null,
      userData.subscription_type,
      expiresAt
    );

    return this.getUserById(result.lastInsertRowid as number);
  }

  async getUserById(id: number): Promise<User> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User;
    if (!user) throw new Error('User not found');
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username) as User | null;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  async updateUserSubscription(userId: number, subscriptionType: string, expiresAt?: Date): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET subscription_type = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(subscriptionType, expiresAt, userId);
  }

  // 账户相关操作
  async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const encryptedAccountNumber = accountData.account_number
      ? encryptData(accountData.account_number)
      : null;

    const stmt = this.db.prepare(`
      INSERT INTO accounts (user_id, name, type, broker, account_number, currency, balance, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      accountData.user_id,
      accountData.name,
      accountData.type,
      accountData.broker || null,
      encryptedAccountNumber,
      accountData.currency || null,
      accountData.balance || 0,
      accountData.is_active ? 1 : 0
    );

    return this.getAccountById(result.lastInsertRowid as number);
  }

  async getAccountById(id: number): Promise<Account> {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE id = ?');
    const account = stmt.get(id) as Account;
    if (!account) throw new Error('Account not found');
    
    // 解密账户号码
    if (account.account_number) {
      account.account_number = decryptData(account.account_number);
    }
    
    return account;
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    const stmt = this.db.prepare('SELECT * FROM accounts WHERE user_id = ? AND is_active = 1');
    const accounts = stmt.all(userId) as Account[];
    
    // 解密账户号码
    return accounts.map(account => ({
      ...account,
      account_number: account.account_number ? decryptData(account.account_number) : undefined
    }));
  }

  async updateAccount(id: number, accountData: Partial<Account>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    
    if (accountData.name) {
      fields.push('name = ?');
      values.push(accountData.name);
    }
    if (accountData.type) {
      fields.push('type = ?');
      values.push(accountData.type);
    }
    if (accountData.broker) {
      fields.push('broker = ?');
      values.push(accountData.broker);
    }
    if (accountData.account_number) {
      fields.push('account_number = ?');
      values.push(encryptData(accountData.account_number));
    }
    if (accountData.currency) {
      fields.push('currency = ?');
      values.push(accountData.currency);
    }
    if (accountData.balance !== undefined) {
      fields.push('balance = ?');
      values.push(accountData.balance);
    }
    if (accountData.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(accountData.is_active);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async deleteAccount(id: number): Promise<void> {
    const stmt = this.db.prepare('UPDATE accounts SET is_active = 0 WHERE id = ?');
    stmt.run(id);
  }

  // 资产相关操作
  async createAsset(assetData: Omit<Asset, 'id' | 'updated_at'>): Promise<Asset> {
    const stmt = this.db.prepare(`
      INSERT INTO assets (account_id, symbol, name, type, quantity, avg_cost, current_price, market_value)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      assetData.account_id,
      assetData.symbol,
      assetData.name,
      assetData.type,
      assetData.quantity,
      assetData.avg_cost,
      assetData.current_price,
      assetData.market_value
    );
    
    return this.getAssetById(result.lastInsertRowid as number);
  }

  async getAssetById(id: number): Promise<Asset> {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE id = ?');
    const asset = stmt.get(id) as Asset;
    if (!asset) throw new Error('Asset not found');
    return asset;
  }

  async getAssetsByAccountId(accountId: number): Promise<Asset[]> {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE account_id = ?');
    return stmt.all(accountId) as Asset[];
  }

  async updateAsset(id: number, assetData: Partial<Asset>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    Object.entries(assetData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async deleteAsset(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM assets WHERE id = ?');
    stmt.run(id);
  }

  // 交易记录相关操作
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (account_id, asset_id, type, symbol, quantity, price, amount, fee, tax, notes, transaction_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 确保 transaction_date 是字符串
    const transactionDate = typeof transactionData.transaction_date === 'string'
      ? transactionData.transaction_date
      : transactionData.transaction_date?.toISOString() || null;

    const result = stmt.run(
      transactionData.account_id,
      transactionData.asset_id || null,
      transactionData.type,
      transactionData.symbol,
      transactionData.quantity,
      transactionData.price,
      transactionData.amount,
      transactionData.fee || 0,
      transactionData.tax || 0,
      transactionData.notes || null,
      transactionDate
    );

    return this.getTransactionById(result.lastInsertRowid as number);
  }

  async getTransactionById(id: number): Promise<Transaction> {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
    const transaction = stmt.get(id) as Transaction;
    if (!transaction) throw new Error('Transaction not found');
    return transaction;
  }

  async getTransactionsByAccountId(accountId: number, limit?: number): Promise<Transaction[]> {
    const sql = limit 
      ? 'SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_date DESC LIMIT ?'
      : 'SELECT * FROM transactions WHERE account_id = ? ORDER BY transaction_date DESC';
    
    const stmt = this.db.prepare(sql);
    return limit ? stmt.all(accountId, limit) as Transaction[] : stmt.all(accountId) as Transaction[];
  }

  async getTransactionsByDateRange(accountId: number, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE account_id = ? AND transaction_date BETWEEN ? AND ?
      ORDER BY transaction_date DESC
    `);
    return stmt.all(accountId, startDate.toISOString(), endDate.toISOString()) as Transaction[];
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    // 只允许更新实际存在的数据库列
    const allowedFields = [
      'account_id', 'asset_id', 'type', 'symbol', 'quantity',
      'price', 'amount', 'fee', 'tax', 'notes', 'transaction_date'
    ];

    Object.entries(transactionData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        // 确保 transaction_date 是字符串
        if (key === 'transaction_date') {
          const dateValue = typeof value === 'string' ? value : (value as Date)?.toISOString() || null;
          values.push(dateValue);
        } else {
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      return; // 没有有效字段需要更新
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async deleteTransaction(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
    stmt.run(id);
  }

  // 复盘日志相关操作
  async createReviewLog(logData: Omit<ReviewLog, 'id' | 'created_at' | 'updated_at'>): Promise<ReviewLog> {
    const encryptedContent = logData.content ? encryptData(logData.content) : null;
    const tagsJson = logData.tags ? JSON.stringify(logData.tags) : null;
    const relatedTransactionsJson = logData.related_transactions ? JSON.stringify(logData.related_transactions) : null;

    // 确保 review_date 是字符串
    const reviewDate = typeof logData.review_date === 'string'
      ? logData.review_date
      : logData.review_date?.toISOString() || null;

    const stmt = this.db.prepare(`
      INSERT INTO review_logs (user_id, title, content, emotion_score, tags, related_transactions, review_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      logData.user_id,
      logData.title || null,
      encryptedContent,
      logData.emotion_score || null,
      tagsJson,
      relatedTransactionsJson,
      reviewDate
    );

    return this.getReviewLogById(result.lastInsertRowid as number);
  }

  async getReviewLogById(id: number): Promise<ReviewLog> {
    const stmt = this.db.prepare('SELECT * FROM review_logs WHERE id = ?');
    const log = stmt.get(id) as ReviewLog & { tags?: string; related_transactions?: string };
    if (!log) throw new Error('Review log not found');
    
    // 解密内容和解析JSON
    return {
      ...log,
      content: log.content ? decryptData(log.content) : undefined,
      tags: log.tags ? JSON.parse(log.tags) : undefined,
      related_transactions: log.related_transactions ? JSON.parse(log.related_transactions) : undefined,
    };
  }

  async getReviewLogsByUserId(userId: number): Promise<ReviewLog[]> {
    const stmt = this.db.prepare('SELECT * FROM review_logs WHERE user_id = ? ORDER BY review_date DESC');
    const logs = stmt.all(userId) as (ReviewLog & { tags?: string; related_transactions?: string })[];

    return logs.map(log => ({
      ...log,
      content: log.content ? decryptData(log.content) : undefined,
      tags: log.tags ? JSON.parse(log.tags) : undefined,
      related_transactions: log.related_transactions ? JSON.parse(log.related_transactions) : undefined,
    }));
  }

  async updateReviewLog(id: number, logData: Partial<ReviewLog>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    Object.entries(logData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        if (key === 'content' && value) {
          fields.push('content = ?');
          values.push(encryptData(value as string));
        } else if (key === 'tags' && value) {
          fields.push('tags = ?');
          values.push(JSON.stringify(value));
        } else if (key === 'related_transactions' && value) {
          fields.push('related_transactions = ?');
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`UPDATE review_logs SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async deleteReviewLog(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM review_logs WHERE id = ?');
    stmt.run(id);
  }

  async getAssetsByUserId(userId: number): Promise<Asset[]> {
    const stmt = this.db.prepare(`
      SELECT DISTINCT
        t.symbol,
        SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
        AVG(CASE WHEN t.type = 'buy' THEN t.price ELSE NULL END) as avg_cost,
        SUM(CASE WHEN t.type = 'buy' THEN t.amount ELSE -t.amount END) as total_cost
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ? AND t.symbol IS NOT NULL
      GROUP BY t.symbol
      HAVING quantity > 0
    `);

    const assets = stmt.all(userId) as any[];

    return assets.map(asset => ({
      id: 0, // 临时ID，因为这是聚合数据
      account_id: 1, // 默认账户ID
      symbol: asset.symbol,
      name: asset.symbol, // 使用symbol作为name
      type: 'stock' as const, // 默认类型
      quantity: asset.quantity || 0,
      avg_cost: asset.avg_cost || 0,
      current_price: asset.avg_cost || 0, // 使用平均成本作为当前价格
      market_value: (asset.quantity || 0) * (asset.avg_cost || 0),
      updated_at: new Date()
    }));
  }

  async getReviewsByUserId(userId: number): Promise<ReviewLog[]> {
    return this.getReviewLogsByUserId(userId);
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    const stmt = this.db.prepare(`
      SELECT t.*, a.name as account_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.user_id = ?
      ORDER BY t.transaction_date DESC
    `);
    return stmt.all(userId) as Transaction[];
  }

  // 投资计划相关操作
  async createInvestmentPlan(planData: {
    user_id: number;
    title: string;
    description?: string;
    target_amount: number;
    target_date: string;
    risk_level: string;
    category: string;
    expected_return?: number;
  }): Promise<{
    id: number;
    user_id: number;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    status: string;
    risk_level: string;
    category: string;
    expected_return: number;
    actual_return: number;
    created_at: string;
    updated_at: string;
  }> {
    const stmt = this.db.prepare(`
      INSERT INTO investment_plans (
        user_id, title, description, target_amount, current_amount,
        target_date, status, risk_level, category, expected_return, actual_return
      ) VALUES (?, ?, ?, ?, 0, ?, 'active', ?, ?, ?, 0)
    `);

    const result = stmt.run(
      planData.user_id,
      planData.title,
      planData.description,
      planData.target_amount,
      planData.target_date,
      planData.risk_level,
      planData.category,
      planData.expected_return || 0
    );

    return this.getInvestmentPlanById(result.lastInsertRowid as number);
  }

  async getInvestmentPlanById(id: number): Promise<{
    id: number;
    user_id: number;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    status: string;
    risk_level: string;
    category: string;
    expected_return: number;
    actual_return: number;
    created_at: string;
    updated_at: string;
  }> {
    const stmt = this.db.prepare('SELECT * FROM investment_plans WHERE id = ?');
    const plan = stmt.get(id) as {
      id: number;
      user_id: number;
      title: string;
      description?: string;
      target_amount: number;
      current_amount: number;
      target_date: string;
      status: string;
      risk_level: string;
      category: string;
      expected_return: number;
      actual_return: number;
      created_at: string;
      updated_at: string;
    } | undefined;
    if (!plan) throw new Error('Investment plan not found');
    return plan;
  }

  async getInvestmentPlansByUserId(userId: number): Promise<{
    id: number;
    user_id: number;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    status: string;
    risk_level: string;
    category: string;
    expected_return: number;
    actual_return: number;
    created_at: string;
    updated_at: string;
  }[]> {
    const stmt = this.db.prepare('SELECT * FROM investment_plans WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as {
      id: number;
      user_id: number;
      title: string;
      description?: string;
      target_amount: number;
      current_amount: number;
      target_date: string;
      status: string;
      risk_level: string;
      category: string;
      expected_return: number;
      actual_return: number;
      created_at: string;
      updated_at: string;
    }[];
  }

  async updateInvestmentPlan(id: number, updates: {
    title?: string;
    description?: string;
    target_amount?: number;
    current_amount?: number;
    target_date?: string;
    status?: string;
    risk_level?: string;
    category?: string;
    expected_return?: number;
    actual_return?: number;
  }): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const stmt = this.db.prepare(`
      UPDATE investment_plans
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(...values, id);
  }

  async deleteInvestmentPlan(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM investment_plans WHERE id = ?');
    stmt.run(id);
  }

  // 导入导出相关方法
  async getTransactionByDetails(accountId: number, type: string, amount: number, date: string): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT * FROM transactions
      WHERE account_id = ? AND type = ? AND amount = ? AND transaction_date = ?
    `);
    return stmt.get(accountId, type, amount, date);
  }

  async getAccountByName(userId: number, name: string): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT * FROM accounts
      WHERE user_id = ? AND name = ?
    `);
    return stmt.get(userId, name);
  }

  async getReviewByDate(userId: number, date: string): Promise<any> {
    const stmt = this.db.prepare(`
      SELECT * FROM review_logs
      WHERE user_id = ? AND review_date = ?
    `);
    return stmt.get(userId, date);
  }










}

// 导出单例实例
export const databaseService = new DatabaseService();
