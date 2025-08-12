// 测试数据固定装置
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: '测试用户'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    name: '管理员用户'
  }
};

export const testAssets = [
  {
    id: 1,
    name: '苹果股票',
    type: 'stock',
    symbol: 'AAPL',
    quantity: 100,
    price: 150.50,
    purchaseDate: '2024-01-15',
    currentValue: 15050.00
  },
  {
    id: 2,
    name: '微软股票',
    type: 'stock',
    symbol: 'MSFT',
    quantity: 50,
    price: 280.75,
    purchaseDate: '2024-01-20',
    currentValue: 14037.50
  },
  {
    id: 3,
    name: '国债基金',
    type: 'bond',
    symbol: 'TLT',
    quantity: 200,
    price: 95.25,
    purchaseDate: '2024-02-01',
    currentValue: 19050.00
  }
];

export const testTransactions = [
  {
    id: 1,
    type: 'buy',
    assetId: 1,
    assetSymbol: 'AAPL',
    quantity: 100,
    price: 150.50,
    fees: 9.99,
    date: '2024-01-15',
    notes: '定期投资计划'
  },
  {
    id: 2,
    type: 'buy',
    assetId: 2,
    assetSymbol: 'MSFT',
    quantity: 50,
    price: 280.75,
    fees: 9.99,
    date: '2024-01-20',
    notes: '科技股投资'
  },
  {
    id: 3,
    type: 'sell',
    assetId: 1,
    assetSymbol: 'AAPL',
    quantity: 25,
    price: 155.75,
    fees: 9.99,
    date: '2024-02-15',
    notes: '部分获利了结'
  }
];

export const testReports = [
  {
    id: 1,
    name: '月度投资组合报告',
    type: 'portfolio',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    format: 'pdf'
  },
  {
    id: 2,
    name: '年度收益分析',
    type: 'performance',
    dateRange: {
      start: '2023-01-01',
      end: '2023-12-31'
    },
    format: 'excel'
  }
];

export const mockApiResponses = {
  assets: {
    success: {
      status: 200,
      data: testAssets
    },
    error: {
      status: 500,
      error: '服务器内部错误'
    }
  },
  transactions: {
    success: {
      status: 200,
      data: testTransactions
    },
    error: {
      status: 400,
      error: '请求参数错误'
    }
  },
  sync: {
    success: {
      status: 200,
      message: '同步成功',
      syncedItems: 15,
      timestamp: new Date().toISOString()
    },
    conflict: {
      status: 409,
      error: '数据冲突',
      conflicts: [
        {
          id: 1,
          type: 'asset',
          localVersion: { quantity: 150 },
          serverVersion: { quantity: 175 }
        }
      ]
    }
  }
};

export const testFormData = {
  validAsset: {
    name: '测试资产',
    type: 'stock',
    symbol: 'TEST',
    quantity: '100',
    price: '50.00',
    purchaseDate: '2024-01-01'
  },
  invalidAsset: {
    name: '',
    type: '',
    symbol: '',
    quantity: '-10',
    price: '0'
  },
  validTransaction: {
    type: 'buy',
    assetId: '1',
    quantity: '50',
    price: '100.00',
    fees: '9.99',
    date: '2024-01-15',
    notes: '测试交易'
  },
  invalidTransaction: {
    type: '',
    assetId: '',
    quantity: '0',
    price: '-50.00',
    fees: '-5.00'
  }
};

export const testSettings = {
  sync: {
    autoSyncEnabled: true,
    syncInterval: 300, // 5分钟
    conflictResolution: 'manual'
  },
  notifications: {
    desktopNotifications: true,
    emailNotifications: false,
    priceAlerts: true
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30, // 30分钟
    passwordExpiry: 90 // 90天
  }
};

// 测试工具函数
export const testHelpers = {
  generateRandomEmail: () => `test${Date.now()}@example.com`,
  generateRandomAsset: () => ({
    name: `测试资产${Date.now()}`,
    type: 'stock',
    symbol: `TEST${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    quantity: Math.floor(Math.random() * 1000) + 1,
    price: Math.round((Math.random() * 1000 + 10) * 100) / 100
  }),
  formatCurrency: (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
  formatDate: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
  waitForElement: async (page: any, selector: string, timeout = 5000) => {
    return await page.waitForSelector(selector, { timeout });
  },
  fillForm: async (page: any, formData: Record<string, string>) => {
    for (const [field, value] of Object.entries(formData)) {
      await page.fill(`[data-testid="${field}"]`, value);
    }
  }
};