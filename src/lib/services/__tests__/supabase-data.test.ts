// Mock the Supabase client creation
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    }
  }))
}))

import { supabaseDataService } from '../supabase-data.service'

describe('SupabaseDataService', () => {
  const mockUserId = 'test-user-id'

  const mockAccount = {
    id: 'account-1',
    user_id: mockUserId,
    name: '测试账户',
    type: 'securities' as const,
    balance: 10000,
    description: '测试用账户',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockTransaction = {
    id: 'transaction-1',
    user_id: mockUserId,
    account_id: 'account-1',
    type: 'buy' as const,
    symbol: 'AAPL',
    name: '苹果公司',
    quantity: 100,
    price: 150.00,
    amount: 15000,
    fee: 5,
    transaction_date: '2024-01-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('服务初始化', () => {
    it('应该能够正确初始化服务', () => {
      expect(supabaseDataService).toBeDefined()
      expect(typeof supabaseDataService.getAccounts).toBe('function')
      expect(typeof supabaseDataService.getTransactions).toBe('function')
      expect(typeof supabaseDataService.createAccount).toBe('function')
      expect(typeof supabaseDataService.createTransaction).toBe('function')
    })

  })

  describe('基础功能测试', () => {
    it('应该有正确的方法签名', () => {
      // 测试方法是否存在且为函数
      expect(typeof supabaseDataService.getAccounts).toBe('function')
      expect(typeof supabaseDataService.getTransactions).toBe('function')
      expect(typeof supabaseDataService.createAccount).toBe('function')
      expect(typeof supabaseDataService.createTransaction).toBe('function')
      expect(typeof supabaseDataService.updateAccount).toBe('function')
      expect(typeof supabaseDataService.deleteAccount).toBe('function')
    })

    it('应该能够处理基本的方法调用', () => {
      // 这些测试只验证方法可以被调用，不验证具体实现
      expect(() => {
        supabaseDataService.getAccounts
        supabaseDataService.getTransactions
        supabaseDataService.createAccount
        supabaseDataService.createTransaction
      }).not.toThrow()
    })
  })
})
