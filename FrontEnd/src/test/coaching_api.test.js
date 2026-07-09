import { describe, it, expect, vi, beforeEach } from 'vitest'

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

function mockFetch(body, status = 200) {
  const json = JSON.stringify(body)
  global.fetch.mockResolvedValueOnce({
    ok: status < 400,
    status,
    text: async () => json,
    json: async () => body,
    headers: { get: () => 'application/json' },
  })
}

describe('Coaching API methods', () => {
  let apiService

  beforeEach(async () => {
    localStorageMock.clear()
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../lib/api.js')
    apiService = mod.apiService
    apiService.setToken('test-token')
  })

  describe('getCoachingAlerts', () => {
    it('calls GET /coaching/alerts', async () => {
      mockFetch({ alerts: [] })
      await apiService.getCoachingAlerts()
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/coaching/alerts'),
        expect.not.objectContaining({ method: 'POST' })
      )
    })

    it('returns alerts array', async () => {
      const alerts = [{ contact_id: 1, alert_type: 'sem_feedback', days_since: 10 }]
      mockFetch({ alerts })
      const result = await apiService.getCoachingAlerts()
      expect(result.alerts).toEqual(alerts)
    })
  })

  describe('getTimelineEvents', () => {
    it('calls correct URL for contact', async () => {
      mockFetch({ events: [] })
      await apiService.getTimelineEvents(42)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/coaching/contacts/42/timeline_events'),
        expect.anything()
      )
    })

    it('appends search query when provided', async () => {
      mockFetch({ events: [] })
      await apiService.getTimelineEvents(42, 'sono')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=sono'),
        expect.anything()
      )
    })

    it('does not append q param when query is empty', async () => {
      mockFetch({ events: [] })
      await apiService.getTimelineEvents(42, '')
      const url = fetch.mock.calls[0][0]
      expect(url).not.toContain('q=')
    })
  })

  describe('createTimelineEvent', () => {
    it('calls POST with raw_input', async () => {
      mockFetch({ event: { id: 1, raw_input: 'treino ok' } }, 201)
      await apiService.createTimelineEvent(5, 'treino ok')
      const [url, opts] = fetch.mock.calls[0]
      expect(url).toContain('/coaching/contacts/5/timeline_events')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body)).toMatchObject({ raw_input: 'treino ok' })
    })

    it('returns created event', async () => {
      const event = { id: 7, sono: '8h', carga: 'leve', observacao: 'ok', proxima_acao: null }
      mockFetch({ event }, 201)
      const result = await apiService.createTimelineEvent(5, 'algo')
      expect(result.event).toMatchObject(event)
    })
  })

  describe('getPreVisitSummary', () => {
    it('calls POST /appointments/:id/pre_visit_summary', async () => {
      mockFetch({ summary: 'Resumo do atleta...' })
      await apiService.getPreVisitSummary(99)
      const [url, opts] = fetch.mock.calls[0]
      expect(url).toContain('/appointments/99/pre_visit_summary')
      expect(opts.method).toBe('POST')
    })

    it('returns summary string', async () => {
      mockFetch({ summary: 'Atleta bem.' })
      const result = await apiService.getPreVisitSummary(99)
      expect(result.summary).toBe('Atleta bem.')
    })
  })

  describe('getCoachingProfile', () => {
    it('calls GET /coaching/contacts/:id/coaching_profile', async () => {
      mockFetch({ profile: { id: 1, goal: 'emagrecer' } })
      await apiService.getCoachingProfile(3)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/coaching/contacts/3/coaching_profile'),
        expect.not.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('updateCoachingProfile', () => {
    it('calls PATCH with profile data', async () => {
      mockFetch({ profile: { id: 1, goal: 'ganhar massa' } })
      await apiService.updateCoachingProfile(3, { goal: 'ganhar massa' })
      const [url, opts] = fetch.mock.calls[0]
      expect(url).toContain('/coaching/contacts/3/coaching_profile')
      expect(opts.method).toBe('PATCH')
      expect(JSON.parse(opts.body)).toMatchObject({ goal: 'ganhar massa' })
    })
  })

  describe('createFeedbackDraft', () => {
    it('calls POST /coaching/contacts/:id/feedback_draft', async () => {
      mockFetch({ draft: 'Parabéns pelo treino!' })
      await apiService.createFeedbackDraft(7)
      const [url, opts] = fetch.mock.calls[0]
      expect(url).toContain('/coaching/contacts/7/feedback_draft')
      expect(opts.method).toBe('POST')
    })
  })
})
