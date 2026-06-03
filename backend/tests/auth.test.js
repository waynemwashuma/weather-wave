import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { startBackendServer } from './server.js'

const adaEmail = 'ada.lovelace@example.com'
let server

async function postJson(path, body) {
  const response = await fetch(`${server.baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return {
    response,
    body: await response.json(),
  }
}

async function deleteUser(email) {
  const response = await fetch(`${server.baseUrl}/api/auth/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  })

  return {
    response,
    body: await response.json(),
  }
}

beforeAll(async () => {
  server = await startBackendServer()
})

afterAll(async () => {
  await server.close()
})

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await deleteUser(adaEmail)
  })

  it('registers a new user and returns a token', async () => {
    const { response, body } = await postJson('/api/auth/register', {
      name: 'Ada Lovelace',
      email: adaEmail,
      password: 'correct-horse',
    })

    expect(response.status).toBe(201)
    expect(body.user).toEqual({
      id: expect.any(Number),
      name: 'Ada Lovelace',
      email: adaEmail,
    })
    expect(body.token).toEqual(expect.any(String))
  })

  it('rejects duplicate emails', async () => {
    const first = await postJson('/api/auth/register', {
      name: 'Ada Lovelace',
      email: adaEmail,
      password: 'correct-horse',
    })
    expect(first.response.status).toBe(201)

    const second = await postJson('/api/auth/register', {
      name: 'Ada Lovelace',
      email: adaEmail,
      password: 'correct-horse',
    })

    expect(second.response.status).toBe(409)
    expect(second.body).toEqual({
      error: 'EMAIL_EXISTS',
      message: 'An account with that email already exists.',
    })
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await deleteUser(adaEmail)
  })

  it('logs in a user with valid credentials', async () => {
    const register = await postJson('/api/auth/register', {
      name: 'Ada Lovelace',
      email: adaEmail,
      password: 'correct-horse',
    })
    expect(register.response.status).toBe(201)

    const login = await postJson('/api/auth/login', {
      email: adaEmail,
      password: 'correct-horse',
    })

    expect(login.response.status).toBe(200)
    expect(login.body.user).toEqual({
      id: expect.any(Number),
      name: 'Ada Lovelace',
      email: adaEmail,
    })
    expect(login.body.token).toEqual(expect.any(String))
  })

  it('rejects invalid credentials', async () => {
    const register = await postJson('/api/auth/register', {
      name: 'Ada Lovelace',
      email: adaEmail,
      password: 'correct-horse',
    })
    expect(register.response.status).toBe(201)

    const login = await postJson('/api/auth/login', {
      email: adaEmail,
      password: 'wrong-password',
    })

    expect(login.response.status).toBe(401)
    expect(login.body).toEqual({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    })
  })
})
