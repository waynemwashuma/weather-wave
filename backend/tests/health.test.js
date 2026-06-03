import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startBackendServer } from './server.js'

let server

beforeAll(async () => {
  server = await startBackendServer()
})

afterAll(async () => {
  await server.close()
})

describe('GET /api/health', () => {
  it('returns an ok status payload', async () => {
    const response = await fetch(`${server.baseUrl}/api/health`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'ok' })
  })
})
