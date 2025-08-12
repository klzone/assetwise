import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Zustand store
jest.mock('@/store', () => ({
  useUserStore: () => ({
    user: {
      id: 1,
      username: 'testuser',
      subscription: 'professional',
    },
  }),
  useAppStore: () => ({
    theme: 'light',
    currency: 'CNY',
    language: 'zh',
    setTheme: jest.fn(),
    setCurrency: jest.fn(),
    setLanguage: jest.fn(),
  }),
}))

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

// Mock fetch
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Supabase client
const mockSupabaseClient = {
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
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient
}))

// Mock Tauri API
jest.mock('@tauri-apps/api', () => ({
  invoke: jest.fn(() => Promise.resolve({})),
  event: {
    listen: jest.fn(() => Promise.resolve(() => {})),
    emit: jest.fn(() => Promise.resolve())
  }
}))

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'encrypted' })),
    decrypt: jest.fn(() => ({ toString: () => 'decrypted' }))
  },
  enc: {
    Utf8: {}
  }
}))
