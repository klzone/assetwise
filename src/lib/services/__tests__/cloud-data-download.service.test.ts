import { cloudDataDownloadService, CloudDataItem } from '../cloud-data-download.service';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  storage: {
    from: jest.fn()
  },
  auth: {
    getUser: jest.fn()
  }
};

// Mock the supabase client
jest.mock('../../../../lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('CloudDataDownloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('checkConnection', () => {
    it('应该在网络连接正常时返回 true', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await cloudDataDownloadService.checkConnection();
      expect(result).toBe(true);
    });

    it('应该在网络连接失败时返回 false', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Network error'))
        })
      });

      const result = await cloudDataDownloadService.checkConnection();
      expect(result).toBe(false);
    });
  });

  describe('getCloudDataOverview', () => {
    it('应该返回云端数据概览', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      });

      const mockAssetsData = { data: [{ id: 1, updated_at: '2024-01-15T10:00:00Z' }, { id: 2, updated_at: '2024-01-15T11:00:00Z' }], error: null };
      const mockTransactionsData = { data: [{ id: 1, updated_at: '2024-01-15T10:00:00Z' }, { id: 2, updated_at: '2024-01-15T11:00:00Z' }, { id: 3, updated_at: '2024-01-15T12:00:00Z' }], error: null };
      const mockPlansData = { data: [{ id: 1, updated_at: '2024-01-15T10:00:00Z' }], error: null };
      const mockReviewsData = { data: [{ id: 1, updated_at: '2024-01-15T10:00:00Z' }, { id: 2, updated_at: '2024-01-15T11:00:00Z' }], error: null };
      const mockProfileData = { data: { id: 'test-user', updated_at: '2024-01-15T10:00:00Z' }, error: null };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockAssetsData)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockTransactionsData)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockPlansData)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockReviewsData)
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockProfileData)
            })
          })
        });

      const result = await cloudDataDownloadService.getCloudDataOverview();

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        id: 'assets',
        name: '资产数据',
        type: 'assets',
        count: 2
      });
      expect(result[1]).toMatchObject({
        id: 'transactions',
        name: '交易记录',
        type: 'transactions',
        count: 3
      });
    });

    it('应该处理数据获取错误', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
        })
      });

      await expect(cloudDataDownloadService.getCloudDataOverview()).rejects.toThrow();
    });
  });

  describe('downloadDataItem', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      });
    });

    it('应该成功下载资产数据', async () => {
      const mockData = [
        { id: 1, name: 'Asset 1', value: 1000 },
        { id: 2, name: 'Asset 2', value: 2000 }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      const progressCallback = jest.fn();
      cloudDataDownloadService.onProgress(progressCallback);

      await cloudDataDownloadService.downloadDataItem('assets');

      // 验证进度回调被调用
      expect(progressCallback).toHaveBeenCalledWith({
        itemId: 'assets',
        status: 'downloading',
        progress: 0
      });

      expect(progressCallback).toHaveBeenCalledWith({
        itemId: 'assets',
        status: 'completed',
        progress: 100
      });

      // 验证数据被保存到本地存储
      const savedData = localStorage.getItem('assetwise_cloud_assets');
      expect(savedData).toBeTruthy();
      const parsedData = JSON.parse(savedData!);
      expect(parsedData.data).toEqual(mockData);
    });

    it('应该处理下载错误', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('Download failed') })
        })
      });

      const progressCallback = jest.fn();
      cloudDataDownloadService.onProgress(progressCallback);

      await expect(cloudDataDownloadService.downloadDataItem('assets')).rejects.toThrow('下载资产数据失败');

      expect(progressCallback).toHaveBeenCalledWith({
        itemId: 'assets',
        status: 'error',
        progress: 0,
        error: '下载资产数据失败: Download failed'
      });
    });

    it('应该处理不支持的数据类型', async () => {
      await expect(cloudDataDownloadService.downloadDataItem('invalid' as any)).rejects.toThrow('未知的数据类型');
    });
  });

  describe('hasLocalData', () => {
    it('应该在有本地数据时返回 true', () => {
      const testData = {
        data: [{ id: 1 }],
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('assetwise_cloud_assets', JSON.stringify(testData));

      const result = cloudDataDownloadService.hasLocalData('assets');
      expect(result).toBe(true);
    });

    it('应该在没有本地数据时返回 false', () => {
      const result = cloudDataDownloadService.hasLocalData('assets');
      expect(result).toBe(false);
    });
  });

  describe('clearLocalData', () => {
    it('应该清除指定的本地数据', () => {
      const testData = {
        data: [{ id: 1 }],
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('assetwise_cloud_assets', JSON.stringify(testData));
      
      cloudDataDownloadService.clearLocalData('assets');
      
      expect(localStorage.getItem('assetwise_cloud_assets')).toBeNull();
    });

    it('应该清除所有云端数据', () => {
      const testData = {
        data: [{ id: 1 }],
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('assetwise_cloud_assets', JSON.stringify(testData));
      localStorage.setItem('assetwise_cloud_transactions', JSON.stringify(testData));
      localStorage.setItem('other_data', 'should not be removed');
      
      cloudDataDownloadService.clearLocalData();
      
      expect(localStorage.getItem('assetwise_cloud_assets')).toBeNull();
      expect(localStorage.getItem('assetwise_cloud_transactions')).toBeNull();
      expect(localStorage.getItem('other_data')).toBe('should not be removed');
    });
  });

  describe('getFromLocalStorage', () => {
    it('应该返回本地存储的数据', () => {
      const testData = [{ id: 1, name: 'Test Asset' }];
      const dataWithTimestamp = {
        data: testData,
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('assetwise_cloud_assets', JSON.stringify(dataWithTimestamp));

      const result = cloudDataDownloadService.getFromLocalStorage('assets');
      expect(result.data).toEqual(testData);
    });

    it('应该在没有数据时返回 null', () => {
      const result = cloudDataDownloadService.getFromLocalStorage('assets');
      expect(result).toBeNull();
    });

    it('应该处理无效的 JSON 数据', () => {
      localStorage.setItem('assetwise_cloud_assets', 'invalid json');

      const result = cloudDataDownloadService.getFromLocalStorage('assets');
      expect(result).toBeNull();
    });
  });

  describe('progress callbacks', () => {
    it('应该正确管理进度回调', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = cloudDataDownloadService.onProgress(callback1);
      const unsubscribe2 = cloudDataDownloadService.onProgress(callback2);

      // 触发进度更新
      cloudDataDownloadService['notifyProgress']({
        itemId: 'test',
        status: 'downloading',
        progress: 50
      });

      expect(callback1).toHaveBeenCalledWith({
        itemId: 'test',
        status: 'downloading',
        progress: 50
      });
      expect(callback2).toHaveBeenCalledWith({
        itemId: 'test',
        status: 'downloading',
        progress: 50
      });

      // 取消订阅第一个回调
      unsubscribe1();

      cloudDataDownloadService['notifyProgress']({
        itemId: 'test',
        status: 'completed',
        progress: 100
      });

      expect(callback1).toHaveBeenCalledTimes(1); // 不应该再被调用
      expect(callback2).toHaveBeenCalledTimes(2); // 应该被调用两次
    });
  });

  describe('data validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      });
    });

    it('应该验证下载的数据完整性', async () => {
      const mockData = [
        { id: 1, name: 'Asset 1', value: 1000 },
        { id: 2, name: 'Asset 2', value: 2000 }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      await cloudDataDownloadService.downloadDataItem('assets');

      const savedData = cloudDataDownloadService.getFromLocalStorage('assets');
      expect(savedData.data).toEqual(mockData);
      expect(Array.isArray(savedData.data)).toBe(true);
      expect(savedData.data.length).toBe(2);
    });

    it('应该处理空数据', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      await cloudDataDownloadService.downloadDataItem('assets');

      const savedData = cloudDataDownloadService.getFromLocalStorage('assets');
      expect(savedData.data).toEqual([]);
    });
  });

  describe('incremental sync', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      });
    });

    it('应该支持增量同步', async () => {
      // 先保存一些旧数据
      const oldData = {
        data: [{ id: 1, name: 'Old Asset', updated_at: '2024-01-01' }],
        downloadedAt: '2024-01-01T10:00:00Z',
        version: '1.0'
      };
      localStorage.setItem('assetwise_cloud_assets', JSON.stringify(oldData));

      // 模拟新数据
      const newData = [
        { id: 1, name: 'Updated Asset', updated_at: '2024-01-15' },
        { id: 2, name: 'New Asset', updated_at: '2024-01-15' }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: newData, error: null })
        })
      });

      await cloudDataDownloadService.downloadDataItem('assets');

      const savedData = cloudDataDownloadService.getFromLocalStorage('assets');
      expect(savedData.data).toEqual(newData);
      expect(savedData.data.length).toBe(2);
    });
  });

  describe('getDownloadStats', () => {
    it('应该返回正确的下载统计信息', () => {
      // 添加一些测试数据
      const testData = {
        data: [{ id: 1 }, { id: 2 }],
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('assetwise_cloud_assets', JSON.stringify(testData));
      localStorage.setItem('assetwise_cloud_transactions', JSON.stringify(testData));

      const stats = cloudDataDownloadService.getDownloadStats();

      expect(stats.totalItems).toBe(5); // assets, transactions, plans, reviews, settings
      expect(stats.downloadedItems).toBe(2); // assets, transactions
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.downloadedSize).toBeGreaterThan(0);
    });
  });
});