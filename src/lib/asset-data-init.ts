import { Asset } from '@/lib/types/data.types';

export async function initializeAssetData(): Promise<void> {
  // 创建示例资产数据
  const sampleAssets: Omit<Asset, 'id' | 'created_at' | 'updated_at'>[] = [
    // 股票类资产
    {
      user_id: 1,
      symbol: 'AAPL',
      name: '苹果公司',
      type: 'stock',
      quantity: 100,
      average_price: 165.00,
      current_price: 175.50,
      total_value: 17550,
      profit: 1050,
      profit_percentage: 6.36,
      account_id: 1
    },
    {
      user_id: 1,
      symbol: 'MSFT',
      name: '微软公司',
      type: 'stock',
      quantity: 50,
      average_price: 320.00,
      current_price: 335.00,
      total_value: 16750,
      profit: 750,
      profit_percentage: 4.69,
      account_id: 1
    },
    {
      user_id: 1,
      symbol: 'GOOGL',
      name: '谷歌公司',
      type: 'stock',
      quantity: 25,
      average_price: 2800.00,
      current_price: 2950.00,
      total_value: 73750,
      profit: 3750,
      profit_percentage: 5.36,
      account_id: 1
    },
    // 基金类资产
    {
      user_id: 1,
      symbol: 'SPY',
      name: 'SPDR标普500ETF',
      type: 'fund',
      quantity: 200,
      average_price: 420.00,
      current_price: 435.00,
      total_value: 87000,
      profit: 3000,
      profit_percentage: 3.57,
      account_id: 1
    },
    {
      user_id: 1,
      symbol: 'QQQ',
      name: '纳斯达克100ETF',
      type: 'fund',
      quantity: 100,
      average_price: 380.00,
      current_price: 395.00,
      total_value: 39500,
      profit: 1500,
      profit_percentage: 3.95,
      account_id: 1
    },
    // 债券类资产
    {
      user_id: 1,
      symbol: 'TLT',
      name: '20年期美国国债ETF',
      type: 'bond',
      quantity: 150,
      average_price: 95.00,
      current_price: 92.50,
      total_value: 13875,
      profit: -375,
      profit_percentage: -2.63,
      account_id: 1
    },
    // 加密货币类资产
    {
      user_id: 1,
      symbol: 'BTC',
      name: '比特币',
      type: 'crypto',
      quantity: 0.5,
      average_price: 45000.00,
      current_price: 48000.00,
      total_value: 24000,
      profit: 1500,
      profit_percentage: 6.67,
      account_id: 1
    },
    {
      user_id: 1,
      symbol: 'ETH',
      name: '以太坊',
      type: 'crypto',
      quantity: 5,
      average_price: 3200.00,
      current_price: 3400.00,
      total_value: 17000,
      profit: 1000,
      profit_percentage: 6.25,
      account_id: 1
    }
  ];

  // 将数据存储到 localStorage
  const assetsWithIds = sampleAssets.map((asset, index) => ({
    ...asset,
    id: index + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  localStorage.setItem('assetwise_assets', JSON.stringify(assetsWithIds));
  
  console.log('✅ 资产数据初始化完成，共创建', assetsWithIds.length, '个资产');
}

export async function clearAssetData(): Promise<void> {
  localStorage.removeItem('assetwise_assets');
  console.log('✅ 资产数据清除完成');
}