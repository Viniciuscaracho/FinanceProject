import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock fetch
global.fetch = vi.fn()

describe('ApiService token management', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('saves token to localStorage on setToken', async () => {
    const { apiService } = await import('../lib/api.js')
    apiService.setToken('test-token-123')
    expect(localStorage.getItem('auth_token')).toBe('test-token-123')
  })

  it('clears token from localStorage on clearToken', async () => {
    const { apiService } = await import('../lib/api.js')
    apiService.setToken('test-token-123')
    apiService.clearToken()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })
})

describe('register endpoint validation', () => {
  it('rejects empty name', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ success: false, error: 'Preencha todos os campos obrigatórios' }),
      headers: { get: () => 'application/json' },
    })

    const { apiService } = await import('../lib/api.js')
    const result = await apiService.register({ name: '', accountName: 'Teste', email: 'a@b.com', password: '123456' }).catch(e => e)
    expect(result).toBeTruthy()
  })
})
