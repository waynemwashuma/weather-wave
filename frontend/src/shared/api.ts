import type { UserSession } from './session'

const defaultApiBase = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? defaultApiBase

export type AuthPayload = {
  name?: string
  email: string
  password: string
}

export type AuthResponse = {
  token: string
  user: {
    name: string
    email: string
  }
}

export type CurrentWeather = {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
}

export type ForecastDay = {
  date: string
  high: number
  low: number
  condition: string
}

type ApiErrorShape = {
  message?: unknown
}

function cleanMessage(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const message = value.trim()
  if (!message) {
    return null
  }

  return message
}

async function readErrorMessage(response: Response) {
  const bodyText = await response.text().catch(() => '')

  if (bodyText) {
    try {
      const payload = JSON.parse(bodyText) as ApiErrorShape
      const message = cleanMessage(payload.message)
      if (message) {
        return message
      }
    } catch {
      const textMessage = cleanMessage(bodyText)
      if (textMessage) {
        return textMessage
      }
    }
  }

  return response.statusText || 'An unexpected error occurred.'
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    })
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function registerUser(payload: AuthPayload) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginUser(payload: AuthPayload) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentWeather(city: string, token: string) {
  const encodedCity = encodeURIComponent(city)
  return request<CurrentWeather>(`/weather/${encodedCity}`, undefined, token)
}

export function getForecast(city: string, token: string) {
  const encodedCity = encodeURIComponent(city)
  return request<ForecastDay[]>(`/forecast/${encodedCity}`, undefined, token)
}

export function getFavoriteCities(token: string) {
  return request<unknown>('/favorites', undefined, token)
}

export function addFavoriteCity(city: string, token: string) {
  return request<unknown>(
    '/favorites',
    {
      method: 'POST',
      body: JSON.stringify({ city }),
    },
    token,
  )
}

export function removeFavoriteCity(city: string, token: string) {
  const params = encodeURIComponent(city)
  return request<unknown>(
    `/favorites/${params}`,
    {
      method: 'DELETE',
    },
    token,
  )
}

export type { UserSession }
