export type UserSession = {
  token: string
  user: {
    name: string
    email: string
  }
}

const SESSION_KEY = 'weatherwave.session'

export function readSession(): UserSession | null {
  const value = window.localStorage.getItem(SESSION_KEY)
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as UserSession
  } catch {
    window.localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(session: UserSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
}
