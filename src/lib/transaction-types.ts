/**
 * 交易类型定义
 */

// 交易类型枚举
export enum TransactionType {
  BUY = 'buy',   // 买入
  SELL = 'sell'  // 卖出
}

// 交易记录接口
export interface Transaction {
  id: string;            // 交易ID
  assetId: string;       // 关联资产ID
  type: TransactionType; // 交易类型
  price: number;         // 交易价格
  quantity: number;      // 交易数量
  date: Date;            // 交易日期
  totalAmount: number;   // 交易总额
  notes?: string;        // 交易备注
  createdAt: Date;       // 创建时间
}

// 买入交易数据
export interface BuyTransactionData {
  assetId: string;
  price: number;
  quantity: number;
  date: Date;
  notes?: string;
}

// 卖出交易数据
export interface SellTransactionData {
  sellPrice: number;
  sellQuantity: number;
  sellDate: Date;
  notes?: string;
}
