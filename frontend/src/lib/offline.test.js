import { afterEach, describe, expect, it, vi } from 'vitest'
import { enqueue, flushQueue, queueSize } from './offline.js'
import { api } from '../api/client.js'

describe('offline queue', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('enqueues and reports size', () => {
    enqueue('/records', { method: 'POST', body: '{}' })
    enqueue('/meals', { method: 'POST', body: '{}' })
    expect(queueSize()).toBe(2)
  })

  it('flush drops succeeded, keeps failed for next round', async () => {
    enqueue('/ok', {})
    enqueue('/fail', {})
    const doFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })
    const r = await flushQueue(doFetch)
    expect(r).toEqual({ ok: 1, failed: 1 })
    expect(queueSize()).toBe(1)
  })

  it('flush keeps items when fetch throws (still offline)', async () => {
    enqueue('/x', {})
    const r = await flushQueue(vi.fn().mockRejectedValue(new Error('net')))
    expect(r).toEqual({ ok: 0, failed: 1 })
    expect(queueSize()).toBe(1)
  })

  it('client queues writes while offline without touching fetch', async () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const r = await api.saveRecord({
      record_date: '2027-01-01', servings: {}, water_ml: 100, note: '',
    })
    expect(r).toEqual({ queued: true })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(queueSize()).toBe(1)
  })
})
