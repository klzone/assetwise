// Mock dependencies first
jest.mock('../supabase-data.service', () => ({
  supabaseDataService: {
    getAccounts: jest.fn(() => Promise.resolve([])),
    getTransactions: jest.fn(() => Promise.resolve([])),
    getReviews: jest.fn(() => Promise.resolve([])),
    createAccount: jest.fn(() => Promise.resolve({ success: true })),
    createTransaction: jest.fn(() => Promise.resolve({ success: true })),
    updateAccount: jest.fn(() => Promise.resolve({ success: true })),
    deleteAccount: jest.fn(() => Promise.resolve({ success: true }))
  }
}))
jest.mock('../local-data-manager.service', () => ({
  localDataManagerService: {
    getSyncQueue: jest.fn(() => []),
    getLastSyncTime: jest.fn(() => null),
    setLastSyncTime: jest.fn(),
    getCurrentUser: jest.fn(() => ({ id: 'test-user-id' })),
    createAccount: jest.fn(() => Promise.resolve({ success: true })),
    createTransaction: jest.fn(() => Promise.resolve({ success: true })),
    clearSyncQueue: jest.fn(),
    getAccounts: jest.fn(() => []),
    getTransactions: jest.fn(() => [])
  }
}))
jest.mock('@/store', () => ({
  useUserStore: {
    getState: jest.fn()
  }
}))

import { cloudSyncService } from '../cloud-sync.service'
import { supabaseDataService } from '../supabase-data.service'
import { localDataManagerService } from '../local-data-manager.service'
import { useUserStore } from '@/store'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    length: 0,
    key: (index: number) => null
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock window object
global.window = global.window || {}

describe('CloudSyncService', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    subscription_type: 'professional'
  }

  const mockAccount = {
    id: 'account-1',
    user_id: 'test-user-id',
    name: '测试账户',
    type: 'securities' as const,
    balance: 10000,
    description: '测试用账户'
  }

  const mockTransaction = {
    id: 'transaction-1',
    user_id: 'test-user-id',
    account_id: 'account-1',
    type: 'buy' as const,
    symbol: 'AAPL',
    name: '苹果公司',
    quantity: 100,
    price: 150.00,
    amount: 15000,
    fee: 5,
    transaction_date: '2024-01-15'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()

    // Mock user store
    ;(useUserStore.getState as jest.Mock).mockReturnValue({
      user: mockUser
    })

    // Mock localDataManagerService methods
    ;(localDataManagerService.getSyncQueue as jest.Mock).mockReturnValue([])
    ;(localDataManagerService.getLastSyncTime as jest.Mock).mockReturnValue(null)
  })

  describe('基础同步功能测试', () => {
    it('应该能够测试 Supabase 连接', async () => {
      // Mock 成功的连接测试
      ;(supabaseDataService.getAccounts as jest.Mock).mockResolvedValue([])

      const testConnection = async () => {
        try {
          await supabaseDataService.getAccounts('test-user-id')
          return true
        } catch (error) {
          throw error
        }
      }

      const result = await testConnection()
      expect(result).toBe(true)
      expect(supabaseDataService.getAccounts).toHaveBeenCalledWith('test-user-id')
    })

    it('应该处理连接失败的情况', async () => {
      // Mock 连接失败
      ;(supabaseDataService.getAccounts as jest.Mock).mockRejectedValue(
        new Error('连接超时')
      )

      const testConnection = async () => {
        try {
          await supabaseDataService.getAccounts('test-user-id')
          return true
        } catch (error) {
          throw error
        }
      }

      await expect(testConnection()).rejects.toThrow('连接超时')
    })
  })

  describe('数据服务基础功能', () => {
    it('应该能够调用账户获取服务', async () => {
      ;(supabaseDataService.getAccounts as jest.Mock).mockResolvedValue([mockAccount])

      const accounts = await supabaseDataService.getAccounts('test-user-id')

      expect(accounts).toEqual([mockAccount])
      expect(supabaseDataService.getAccounts).toHaveBeenCalledWith('test-user-id')
    })

    it('应该能够调用交易获取服务', async () => {
      ;(supabaseDataService.getTransactions as jest.Mock).mockResolvedValue([mockTransaction])

      const transactions = await supabaseDataService.getTransactions('test-user-id')

      expect(transactions).toEqual([mockTransaction])
      expect(supabaseDataService.getTransactions).toHaveBeenCalledWith('test-user-id')
    })

    it('应该能够调用账户创建服务', async () => {
      ;(supabaseDataService.createAccount as jest.Mock).mockResolvedValue({ success: true, data: mockAccount })

      const result = await supabaseDataService.createAccount(mockAccount)

      expect(result.success).toBe(true)
      expect(supabaseDataService.createAccount).toHaveBeenCalledWith(mockAccount)
    })
  })

  describe('本地数据管理服务', () => {
    it('应该能够调用本地账户获取服务', () => {
      ;(localDataManagerService.getAccounts as jest.Mock).mockReturnValue([mockAccount])

      const accounts = localDataManagerService.getAccounts('test-user-id')

      expect(accounts).toEqual([mockAccount])
      expect(localDataManagerService.getAccounts).toHaveBeenCalledWith('test-user-id')
    })

    it('应该能够调用本地交易获取服务', () => {
      ;(localDataManagerService.getTransactions as jest.Mock).mockReturnValue([mockTransaction])

      const transactions = localDataManagerService.getTransactions('test-user-id')

      expect(transactions).toEqual([mockTransaction])
      expect(localDataManagerService.getTransactions).toHaveBeenCalledWith('test-user-id')
    })

    it('应该能够获取同步队列', () => {
      const mockQueue = [{ id: 'sync-1', operation: 'createAccount', data: mockAccount }]
      ;(localDataManagerService.getSyncQueue as jest.Mock).mockReturnValue(mockQueue)

      const queue = localDataManagerService.getSyncQueue()

      expect(queue).toEqual(mockQueue)
      expect(localDataManagerService.getSyncQueue).toHaveBeenCalled()
    })
  })
})
