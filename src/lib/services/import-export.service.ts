import { DatabaseService } from './database.service';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

export interface ExportData {
  accounts?: any[];
  transactions?: any[];
  reviews?: any[];
  plans?: any[];
}

export class ImportExportService {
  private dbService = new DatabaseService();

  // CSV解析工具
  private parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  }

  // 生成CSV文本
  private generateCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // 处理包含逗号的值
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  // 导入交易记录
  async importTransactions(csvText: string, userId: number): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      duplicates: 0
    };

    try {
      const data = this.parseCSV(csvText);
      
      if (data.length === 0) {
        result.errors.push('CSV文件为空或格式不正确');
        return result;
      }

      // 验证必需字段
      const requiredFields = ['account_id', 'type', 'amount', 'transaction_date'];
      const firstRow = data[0];
      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        result.errors.push(`缺少必需字段: ${missingFields.join(', ')}`);
        return result;
      }

      // 获取用户账户列表验证
      const userAccounts = await this.dbService.getAccountsByUserId(userId);
      const validAccountIds = userAccounts.map(acc => acc.id);

      for (const row of data) {
        try {
          // 验证账户ID
          const accountId = parseInt(row.account_id);
          if (!validAccountIds.includes(accountId)) {
            result.errors.push(`无效的账户ID: ${row.account_id}`);
            continue;
          }

          // 验证交易类型
          const validTypes = ['buy', 'sell', 'dividend', 'deposit', 'withdraw'];
          if (!validTypes.includes(row.type)) {
            result.errors.push(`无效的交易类型: ${row.type}`);
            continue;
          }

          // 验证金额
          const amount = parseFloat(row.amount);
          if (isNaN(amount)) {
            result.errors.push(`无效的金额: ${row.amount}`);
            continue;
          }

          // 检查重复记录
          const existingTransaction = await this.dbService.getTransactionByDetails(
            accountId,
            row.type,
            amount,
            row.transaction_date
          );

          if (existingTransaction) {
            result.duplicates++;
            continue;
          }

          // 创建交易记录
          await this.dbService.createTransaction({
            account_id: accountId,
            type: row.type,
            symbol: row.symbol || '',
            quantity: row.quantity ? parseFloat(row.quantity) : 0,
            price: row.price ? parseFloat(row.price) : 0,
            amount: amount,
            fee: row.fee ? parseFloat(row.fee) : 0,
            tax: row.tax ? parseFloat(row.tax) : 0,
            notes: row.notes || '',
            transaction_date: row.transaction_date
          });

          result.imported++;
        } catch (error) {
          result.errors.push(`处理行数据时出错: ${error}`);
        }
      }

      result.success = result.imported > 0;
      return result;

    } catch (error) {
      result.errors.push(`导入失败: ${error}`);
      return result;
    }
  }

  // 导入账户信息
  async importAccounts(csvText: string, userId: number): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      duplicates: 0
    };

    try {
      const data = this.parseCSV(csvText);
      
      if (data.length === 0) {
        result.errors.push('CSV文件为空或格式不正确');
        return result;
      }

      // 验证必需字段
      const requiredFields = ['name', 'type'];
      const firstRow = data[0];
      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        result.errors.push(`缺少必需字段: ${missingFields.join(', ')}`);
        return result;
      }

      for (const row of data) {
        try {
          // 验证账户类型
          const validTypes = ['stock', 'fund', 'cash', 'crypto'];
          if (!validTypes.includes(row.type)) {
            result.errors.push(`无效的账户类型: ${row.type}`);
            continue;
          }

          // 检查重复账户
          const existingAccount = await this.dbService.getAccountByName(userId, row.name);
          if (existingAccount) {
            result.duplicates++;
            continue;
          }

          // 创建账户
          await this.dbService.createAccount({
            user_id: userId,
            name: row.name,
            type: row.type,
            broker: row.broker || null,
            account_number: row.account_number || null,
            currency: row.currency || 'CNY',
            balance: row.balance ? parseFloat(row.balance) : 0,
            is_active: true
          });

          result.imported++;
        } catch (error) {
          result.errors.push(`处理账户数据时出错: ${error}`);
        }
      }

      result.success = result.imported > 0;
      return result;

    } catch (error) {
      result.errors.push(`导入失败: ${error}`);
      return result;
    }
  }

  // 导入复盘日志
  async importReviews(csvText: string, userId: number): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      errors: [],
      duplicates: 0
    };

    try {
      const data = this.parseCSV(csvText);
      
      if (data.length === 0) {
        result.errors.push('CSV文件为空或格式不正确');
        return result;
      }

      // 验证必需字段
      const requiredFields = ['review_date', 'content'];
      const firstRow = data[0];
      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        result.errors.push(`缺少必需字段: ${missingFields.join(', ')}`);
        return result;
      }

      for (const row of data) {
        try {
          // 检查重复日志
          const existingReview = await this.dbService.getReviewByDate(userId, row.review_date);
          if (existingReview) {
            result.duplicates++;
            continue;
          }

          // 创建复盘日志
          await this.dbService.createReviewLog({
            user_id: userId,
            title: row.title || '导入的复盘日志',
            review_date: row.review_date,
            content: row.content,
            emotion_score: row.emotion_score ? parseInt(row.emotion_score) : 5,
            tags: row.tags ? JSON.parse(row.tags) : [],
            related_transactions: row.related_transactions ? JSON.parse(row.related_transactions) : []
          });

          result.imported++;
        } catch (error) {
          result.errors.push(`处理复盘日志时出错: ${error}`);
        }
      }

      result.success = result.imported > 0;
      return result;

    } catch (error) {
      result.errors.push(`导入失败: ${error}`);
      return result;
    }
  }

  // 导出数据
  async exportData(userId: number, dataTypes: string[]): Promise<ExportData> {
    const exportData: ExportData = {};

    try {
      if (dataTypes.includes('accounts')) {
        const accounts = await this.dbService.getAccountsByUserId(userId);
        exportData.accounts = accounts.map(acc => ({
          name: acc.name,
          type: acc.type,
          broker: acc.broker,
          currency: acc.currency,
          balance: acc.balance,
          created_at: acc.created_at
        }));
      }

      if (dataTypes.includes('transactions')) {
        const transactions = await this.dbService.getTransactionsByUserId(userId);
        exportData.transactions = transactions.map(trans => ({
          account_id: trans.account_id,
          type: trans.type,
          symbol: trans.symbol,
          quantity: trans.quantity,
          price: trans.price,
          amount: trans.amount,
          fee: trans.fee,
          tax: trans.tax,
          notes: trans.notes,
          transaction_date: trans.transaction_date
        }));
      }

      if (dataTypes.includes('reviews')) {
        const reviews = await this.dbService.getReviewLogsByUserId(userId);
        exportData.reviews = reviews.map(review => ({
          title: review.title,
          review_date: review.review_date,
          content: review.content,
          emotion_score: review.emotion_score,
          tags: JSON.stringify(review.tags || []),
          related_transactions: JSON.stringify(review.related_transactions || [])
        }));
      }

      if (dataTypes.includes('plans')) {
        const plans = await this.dbService.getInvestmentPlansByUserId(userId);
        exportData.plans = plans.map(plan => ({
          title: plan.title,
          description: plan.description,
          target_amount: plan.target_amount,
          current_amount: plan.current_amount,
          target_date: plan.target_date,
          status: plan.status,
          risk_level: plan.risk_level,
          category: plan.category
        }));
      }

      return exportData;

    } catch (error) {
      throw new Error(`导出数据失败: ${error}`);
    }
  }

  // 生成CSV下载文件
  generateCSVDownload(data: any[], filename: string, headers: string[]): void {
    const csvContent = this.generateCSV(data, headers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export const importExportService = new ImportExportService();
