import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── localStorage mock ────────────────────────────────────────────────────────
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

global.fetch = vi.fn()

// request() chama response.text() internamente; fetch direto chama response.json()
const mockRequest = (body, status = 200) => {
  const json = JSON.stringify(body)
  return Promise.resolve({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
    text: () => Promise.resolve(json),
    json: () => Promise.resolve(body),
  })
}

const mockFetch = (body, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })

// ── helpers ──────────────────────────────────────────────────────────────────
const TEMPLATE = {
  id: 1,
  name: 'Anamnese Nutricional',
  fields: [{ id: 'f1', label: 'Peso', type: 'number', required: true, options: [] }],
}
const APPOINTMENT_INFO = { id: 42, service_name: 'Consulta', professional: 'Ana' }

describe('getPublicAnamnese', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('calls the public URL without Authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ appointment: APPOINTMENT_INFO, template: TEMPLATE, response: null, filled: false }),
    })

    const { apiService } = await import('../lib/api.js')
    await apiService.getPublicAnamnese('abc123')

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toContain('/public/anamnese/abc123')
    expect(opts.headers?.Authorization).toBeUndefined()
  })

  it('returns appointment, template and filled status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ appointment: APPOINTMENT_INFO, template: TEMPLATE, response: null, filled: false }),
    })

    const { apiService } = await import('../lib/api.js')
    const result = await apiService.getPublicAnamnese('tok1')

    expect(result.appointment.id).toBe(42)
    expect(result.template.name).toBe('Anamnese Nutricional')
    expect(result.filled).toBe(false)
  })

  it('throws when token is invalid (404)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

    const { apiService } = await import('../lib/api.js')
    await expect(apiService.getPublicAnamnese('bad_token')).rejects.toThrow('Link inválido ou expirado')
  })
})

describe('submitPublicAnamnese', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('POSTs to the correct public URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: { id: 1 }, message: 'Anamnese enviada com sucesso!' }),
    })

    const { apiService } = await import('../lib/api.js')
    await apiService.submitPublicAnamnese('tok2', {
      anamnese_template_id: 1,
      responses: { f1: '78' },
    })

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toContain('/public/anamnese/tok2')
    expect(opts.method).toBe('POST')
  })

  it('sends the responses payload as JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: {} }),
    })

    const { apiService } = await import('../lib/api.js')
    await apiService.submitPublicAnamnese('tok3', {
      anamnese_template_id: 1,
      responses: { f1: '90' },
    })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.anamnese_response.responses.f1).toBe('90')
    expect(body.anamnese_response.anamnese_template_id).toBe(1)
  })

  it('throws with error message on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Link inválido ou expirado' }),
    })

    const { apiService } = await import('../lib/api.js')
    await expect(
      apiService.submitPublicAnamnese('bad', { responses: {} })
    ).rejects.toThrow('Link inválido ou expirado')
  })

  it('does not include Authorization header', async () => {
    localStorageMock.setItem('auth_token', 'should-not-appear')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ response: {} }),
    })

    const { apiService } = await import('../lib/api.js')
    await apiService.submitPublicAnamnese('tok4', { responses: {} })

    const opts = global.fetch.mock.calls[0][1]
    expect(opts.headers?.Authorization).toBeUndefined()
  })
})

describe('getLastAnamneseResponse', () => {
  beforeEach(() => {
    localStorageMock.setItem('auth_token', 'valid-token')
    vi.clearAllMocks()
  })

  it('calls the correct authenticated endpoint', async () => {
    global.fetch = vi.fn().mockReturnValue(mockRequest({ response: null }))

    const { apiService } = await import('../lib/api.js')
    await apiService.getLastAnamneseResponse(99)

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toContain('/contacts/99/last_anamnese_response')
    expect(opts.headers?.Authorization).toContain('Bearer')
  })

  it('returns null response when contact has no history', async () => {
    global.fetch = vi.fn().mockReturnValue(mockRequest({ response: null }))

    const { apiService } = await import('../lib/api.js')
    const result = await apiService.getLastAnamneseResponse(5)
    expect(result.response).toBeNull()
  })

  it('returns the last response when history exists', async () => {
    const lastResponse = { id: 10, responses: { f1: 'Emagrecer' }, anamnese_template_id: 1 }
    global.fetch = vi.fn().mockReturnValue(mockRequest({ response: lastResponse }))

    const { apiService } = await import('../lib/api.js')
    const result = await apiService.getLastAnamneseResponse(7)
    expect(result.response.responses.f1).toBe('Emagrecer')
  })
})

describe('setAppointmentAnamneseTemplate', () => {
  beforeEach(() => {
    localStorageMock.setItem('auth_token', 'valid-token')
    vi.clearAllMocks()
  })

  it('sends PATCH to the appointment endpoint', async () => {
    global.fetch = vi.fn().mockReturnValue(mockRequest({ id: 1, anamnese_template_id: 3 }))

    const { apiService } = await import('../lib/api.js')
    await apiService.setAppointmentAnamneseTemplate(1, 3)

    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toContain('/appointments/1')
    expect(opts.method).toBe('PATCH')
  })

  it('sends anamnese_template_id in the body', async () => {
    global.fetch = vi.fn().mockReturnValue(mockRequest({}))

    const { apiService } = await import('../lib/api.js')
    await apiService.setAppointmentAnamneseTemplate(2, 5)

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.appointment.anamnese_template_id).toBe(5)
  })

  it('accepts null to clear the template', async () => {
    global.fetch = vi.fn().mockReturnValue(mockRequest({}))

    const { apiService } = await import('../lib/api.js')
    await apiService.setAppointmentAnamneseTemplate(2, null)

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.appointment.anamnese_template_id).toBeNull()
  })
})
