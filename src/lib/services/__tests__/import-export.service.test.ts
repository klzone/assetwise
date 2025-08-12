import { ImportExportService } from '../import-export.service';

// Mock DatabaseService
jest.mock('../database.service', () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getAccountsByUserId: jest.fn(),
    getTransactionByDetails: jest.fn(),
    createTransaction: jest.fn(),
    createAccount: jest.fn(),
    getAccountByName: jest.fn(),
    createReviewLog: jest.fn(),
    getReviewByDate: jest.fn(),
    getTransactionsByUserId: jest.fn(),
    getReviewLogsByUserId: jest.fn(),
    getInvestmentPlansByUserId: jest.fn(),
  })),
}));

describe('ImportExportService', () => {
  let service: ImportExportService;
  let mockDbService: any;

  beforeEach(() => {
    service = new ImportExportService();
    mockDbService = (service as any).dbService;
    jest.clearAllMocks();
  });

  describe('importTransactions', () => {
    const validCSV = `account_id,type,amount,transaction_date,symbol,quantity,price,fee
1,buy,10000,2024-01-15,AAPL,100,100,5
2,sell,8000,2024-01-20,GOOGL,50,160,5`;

    beforeEach(() => {
      mockDbService.getAccountsByUserId.mockResolvedValue([
        { id: 1, name: '账户1' },
        { id: 2, name: '账户2' },
      ]);
      mockDbService.getTransactionByDetails.mockResolvedValue(null);
      mockDbService.createTransaction.mockResolvedValue({ id: 1 });
    });

    it('should import valid transactions successfully', async () => {
      const result = await service.importTransactions(validCSV, 1);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.duplicates).toBe(0);
      expect(mockDbService.createTransaction).toHaveBeenCalledTimes(2);
    });

    it('should handle empty CSV', async () => {
      const result = await service.importTransactions('', 1);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('CSV文件为空或格式不正确');
    });

    it('should validate required fields', async () => {
      const invalidCSV = `name,description
账户1,测试账户`;

      const result = await service.importTransactions(invalidCSV, 1);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('缺少必需字段');
    });

    it('should detect duplicate transactions', async () => {
      mockDbService.getTransactionByDetails.mockResolvedValue({ id: 1 });

      const result = await service.importTransactions(validCSV, 1);

      expect(result.duplicates).toBe(2);
      expect(result.imported).toBe(0);
    });

    it('should validate account IDs', async () => {
      mockDbService.getAccountsByUserId.mockResolvedValue([{ id: 1 }]);

      const result = await service.importTransactions(validCSV, 1);

      expect(result.errors).toContain('无效的账户ID: 2');
      expect(result.imported).toBe(1);
    });

    it('should validate transaction types', async () => {
      const invalidTypeCSV = `account_id,type,amount,transaction_date
1,invalid_type,10000,2024-01-15`;

      const result = await service.importTransactions(invalidTypeCSV, 1);

      expect(result.errors).toContain('无效的交易类型: invalid_type');
      expect(result.imported).toBe(0);
    });

    it('should validate amounts', async () => {
      const invalidAmountCSV = `account_id,type,amount,transaction_date
1,buy,invalid_amount,2024-01-15`;

      const result = await service.importTransactions(invalidAmountCSV, 1);

      expect(result.errors).toContain('无效的金额: invalid_amount');
      expect(result.imported).toBe(0);
    });
  });

  describe('importAccounts', () => {
    const validCSV = `name,type,broker,currency,balance
股票账户,stock,招商证券,CNY,50000
基金账户,fund,天天基金,CNY,30000`;

    beforeEach(() => {
      mockDbService.getAccountByName.mockResolvedValue(null);
      mockDbService.createAccount.mockResolvedValue({ id: 1 });
    });

    it('should import valid accounts successfully', async () => {
      const result = await service.importAccounts(validCSV, 1);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockDbService.createAccount).toHaveBeenCalledTimes(2);
    });

    it('should validate account types', async () => {
      const invalidTypeCSV = `name,type
测试账户,invalid_type`;

      const result = await service.importAccounts(invalidTypeCSV, 1);

      expect(result.errors).toContain('无效的账户类型: invalid_type');
      expect(result.imported).toBe(0);
    });

    it('should detect duplicate accounts', async () => {
      mockDbService.getAccountByName.mockResolvedValue({ id: 1 });

      const result = await service.importAccounts(validCSV, 1);

      expect(result.duplicates).toBe(2);
      expect(result.imported).toBe(0);
    });
  });

  describe('importReviews', () => {
    const validCSV = `review_date,content,emotion,market_view
2024-01-15,今天买入苹果股票,optimistic,看涨
2024-01-20,市场有些波动,neutral,观望`;

    beforeEach(() => {
      mockDbService.getReviewByDate.mockResolvedValue(null);
      mockDbService.createReviewLog.mockResolvedValue({ id: 1 });
    });

    it('should import valid reviews successfully', async () => {
      const result = await service.importReviews(validCSV, 1);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockDbService.createReviewLog).toHaveBeenCalledTimes(2);
    });

    it('should detect duplicate reviews', async () => {
      mockDbService.getReviewByDate.mockResolvedValue({ id: 1 });

      const result = await service.importReviews(validCSV, 1);

      expect(result.duplicates).toBe(2);
      expect(result.imported).toBe(0);
    });
  });

  describe('exportData', () => {
    beforeEach(() => {
      mockDbService.getAccountsByUserId.mockResolvedValue([
        { id: 1, name: '账户1', type: 'stock', balance: 50000 },
      ]);
      mockDbService.getTransactionsByUserId.mockResolvedValue([
        { id: 1, account_id: 1, type: 'buy', amount: 10000 },
      ]);
      mockDbService.getReviewLogsByUserId.mockResolvedValue([
        { id: 1, review_date: '2024-01-15', content: '测试日志' },
      ]);
      mockDbService.getInvestmentPlansByUserId.mockResolvedValue([
        { id: 1, title: '测试计划', target_amount: 100000 },
      ]);
    });

    it('should export accounts data', async () => {
      const result = await service.exportData(1, ['accounts']);

      expect(result.accounts).toBeDefined();
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0]).toHaveProperty('name');
      expect(result.accounts[0]).toHaveProperty('type');
      expect(result.accounts[0]).toHaveProperty('balance');
    });

    it('should export transactions data', async () => {
      const result = await service.exportData(1, ['transactions']);

      expect(result.transactions).toBeDefined();
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toHaveProperty('account_id');
      expect(result.transactions[0]).toHaveProperty('type');
      expect(result.transactions[0]).toHaveProperty('amount');
    });

    it('should export reviews data', async () => {
      const result = await service.exportData(1, ['reviews']);

      expect(result.reviews).toBeDefined();
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0]).toHaveProperty('review_date');
      expect(result.reviews[0]).toHaveProperty('content');
    });

    it('should export plans data', async () => {
      const result = await service.exportData(1, ['plans']);

      expect(result.plans).toBeDefined();
      expect(result.plans).toHaveLength(1);
      expect(result.plans[0]).toHaveProperty('title');
      expect(result.plans[0]).toHaveProperty('target_amount');
    });

    it('should export multiple data types', async () => {
      const result = await service.exportData(1, ['accounts', 'transactions']);

      expect(result.accounts).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(result.reviews).toBeUndefined();
      expect(result.plans).toBeUndefined();
    });
  });

  describe('CSV parsing and generation', () => {
    it('should parse CSV correctly', () => {
      const csvText = `name,type,balance
账户1,stock,50000
账户2,fund,30000`;

      const result = (service as any).parseCSV(csvText);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: '账户1',
        type: 'stock',
        balance: '50000',
      });
      expect(result[1]).toEqual({
        name: '账户2',
        type: 'fund',
        balance: '30000',
      });
    });

    it('should generate CSV correctly', () => {
      const data = [
        { name: '账户1', type: 'stock', balance: 50000 },
        { name: '账户2', type: 'fund', balance: 30000 },
      ];
      const headers = ['name', 'type', 'balance'];

      const result = (service as any).generateCSV(data, headers);

      expect(result).toContain('name,type,balance');
      expect(result).toContain('账户1,stock,50000');
      expect(result).toContain('账户2,fund,30000');
    });

    it('should handle CSV values with commas', () => {
      const data = [
        { name: '账户1,测试', type: 'stock', balance: 50000 },
      ];
      const headers = ['name', 'type', 'balance'];

      const result = (service as any).generateCSV(data, headers);

      expect(result).toContain('"账户1,测试"');
    });
  });
});
