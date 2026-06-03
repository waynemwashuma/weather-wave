const DEFAULT_STATE = () => ({
  usersByEmail: {},
  tokensByValue: {},
  favoritesByEmail: {},
})

const CONDITIONS = [
  'Clear sky',
  'Few clouds',
  'Scattered clouds',
  'Broken clouds',
  'Light rain',
  'Moderate rain',
  'Thunderstorm',
  'Mist',
]

const swUrl = new URL(self.location.href)
const scopePath = new URL('./', swUrl).pathname
const apiPrefix = `${scopePath.replace(/\/$/, '')}/api/`
const databaseName = 'weather-wave-mock'
const storeName = 'state'
const recordKey = 'mock-state'

let dbPromise = null
let statePromise = null
let state = null

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin || !url.pathname.startsWith(apiPrefix)) {
    return
  }

  event.respondWith(handleApiRequest(event.request))
})

async function handleApiRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname.slice(apiPrefix.length - 1)

  try {
    if (path === '/auth/register' && request.method === 'POST') {
      return handleRegister(request)
    }

    if (path === '/auth/login' && request.method === 'POST') {
      return handleLogin(request)
    }

    if (path === '/favorites' && request.method === 'GET') {
      const currentUser = await requireUser(request)
      if (!currentUser) {
        return unauthorizedResponse()
      }

      const currentState = await getState()
      return jsonResponse({
        cities: [...(currentState.favoritesByEmail[currentUser.email] ?? [])],
      })
    }

    if (path === '/favorites' && request.method === 'POST') {
      const currentUser = await requireUser(request)
      if (!currentUser) {
        return unauthorizedResponse()
      }

      const body = await readJsonBody(request)
      const city = cleanCity(body?.city)

      if (!city) {
        return errorResponse(400, 'Please provide a city to save.', 'INVALID_INPUT')
      }

      const currentState = await getState()
      const favorites = new Set(currentState.favoritesByEmail[currentUser.email] ?? [])
      favorites.add(normalizeCity(city))
      currentState.favoritesByEmail[currentUser.email] = [...favorites]
      await saveState(currentState)

      return jsonResponse(
        {
          message: `${city} saved to favorites.`,
          city,
        },
        201,
      )
    }

    if (path.startsWith('/favorites/') && request.method === 'DELETE') {
      const currentUser = await requireUser(request)
      if (!currentUser) {
        return unauthorizedResponse()
      }

      const city = cleanCity(decodeURIComponent(path.slice('/favorites/'.length)))
      const currentState = await getState()
      const favorites = new Set(currentState.favoritesByEmail[currentUser.email] ?? [])
      const normalized = normalizeCity(city)

      if (!favorites.has(normalized)) {
        return errorResponse(404, 'That city is not in your favorites.', 'FAVORITE_NOT_FOUND')
      }

      favorites.delete(normalized)
      currentState.favoritesByEmail[currentUser.email] = [...favorites]
      await saveState(currentState)

      return jsonResponse({
        message: `${city} removed from favorites.`,
      })
    }

    if (path.startsWith('/weather/') && request.method === 'GET') {
      const currentUser = await requireUser(request)
      if (!currentUser) {
        return unauthorizedResponse()
      }

      const city = cleanCity(decodeURIComponent(path.slice('/weather/'.length)))
      if (!city) {
        return errorResponse(400, 'Please provide a city name.', 'INVALID_INPUT')
      }

      return jsonResponse(buildCurrentWeather(city))
    }

    if (path.startsWith('/forecast/') && request.method === 'GET') {
      const currentUser = await requireUser(request)
      if (!currentUser) {
        return unauthorizedResponse()
      }

      const city = cleanCity(decodeURIComponent(path.slice('/forecast/'.length)))
      if (!city) {
        return errorResponse(400, 'Please provide a city name.', 'INVALID_INPUT')
      }

      return jsonResponse(buildForecast(city))
    }

    return errorResponse(404, 'Not found.', 'NOT_FOUND')
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : 'An unexpected error occurred.')
  }
}

async function handleRegister(request) {
  const body = await readJsonBody(request)
  const name = cleanText(body?.name)
  const email = cleanText(body?.email).toLowerCase()
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!name) {
    return errorResponse(400, 'Please provide your name.', 'INVALID_INPUT')
  }

  if (!email || !email.includes('@')) {
    return errorResponse(400, 'Please provide a valid email address.', 'INVALID_INPUT')
  }

  if (password.length < 8) {
    return errorResponse(400, 'Password must be at least 8 characters long.', 'INVALID_INPUT')
  }

  const currentState = await getState()
  if (currentState.usersByEmail[email]) {
    return errorResponse(409, 'An account with that email already exists.', 'EMAIL_EXISTS')
  }

  currentState.usersByEmail[email] = { name, email, password }
  const token = issueToken()
  currentState.tokensByValue[token] = email
  currentState.favoritesByEmail[email] = currentState.favoritesByEmail[email] ?? []
  await saveState(currentState)

  return jsonResponse(
    {
      token,
      user: {
        name,
        email,
      },
    },
    201,
  )
}

async function handleLogin(request) {
  const body = await readJsonBody(request)
  const email = cleanText(body?.email).toLowerCase()
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return errorResponse(400, 'Email and password are required.', 'INVALID_INPUT')
  }

  const currentState = await getState()
  const user = currentState.usersByEmail[email]
  if (!user || user.password !== password) {
    return errorResponse(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
  }

  const token = issueToken()
  currentState.tokensByValue[token] = email
  await saveState(currentState)

  return jsonResponse({
    token,
    user: {
      name: user.name,
      email: user.email,
    },
  })
}

async function requireUser(request) {
  const header = request.headers.get('Authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return null
  }

  const token = match[1].trim()
  if (!token) {
    return null
  }

  const currentState = await getState()
  const email = currentState.tokensByValue[token]
  if (!email) {
    return null
  }

  const user = currentState.usersByEmail[email]
  if (!user) {
    return null
  }

  return user
}

async function getState() {
  if (state) {
    return state
  }

  if (!statePromise) {
    statePromise = readState()
      .then((nextState) => {
        state = nextState
        return nextState
      })
      .catch(() => {
        state = DEFAULT_STATE()
        return state
      })
  }

  return statePromise
}

async function saveState(nextState) {
  state = normalizeState(nextState)
  const db = await openDatabase()

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(state, recordKey)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function readState() {
  const db = await openDatabase()

  return await new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(recordKey)

    request.onsuccess = () => resolve(normalizeState(request.result))
    request.onerror = () => reject(request.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function openDatabase() {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })

  return dbPromise
}

function normalizeState(input) {
  const fallback = DEFAULT_STATE()

  if (!input || typeof input !== 'object') {
    return fallback
  }

  const usersByEmail = isPlainObject(input.usersByEmail) ? input.usersByEmail : fallback.usersByEmail
  const tokensByValue = isPlainObject(input.tokensByValue) ? input.tokensByValue : fallback.tokensByValue
  const favoritesByEmail = isPlainObject(input.favoritesByEmail)
    ? input.favoritesByEmail
    : fallback.favoritesByEmail

  return {
    usersByEmail: Object.fromEntries(
      Object.entries(usersByEmail).map(([email, user]) => {
        const safeUser = isPlainObject(user) ? user : {}
        return [
          email,
          {
            name: cleanText(safeUser.name),
            email: cleanText(safeUser.email).toLowerCase(),
            password: typeof safeUser.password === 'string' ? safeUser.password : '',
          },
        ]
      }),
    ),
    tokensByValue: Object.fromEntries(
      Object.entries(tokensByValue).map(([token, email]) => [token, cleanText(email).toLowerCase()]),
    ),
    favoritesByEmail: Object.fromEntries(
      Object.entries(favoritesByEmail).map(([email, cities]) => [
        cleanText(email).toLowerCase(),
        Array.isArray(cities) ? cities.map((city) => normalizeCity(city)).filter(Boolean) : [],
      ]),
    ),
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanCity(value) {
  return cleanText(value)
}

function normalizeCity(value) {
  return cleanText(value).replace(/\s+/g, ' ').toLowerCase()
}

function titleCase(value) {
  return cleanText(value)
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function issueToken() {
  if (self.crypto?.randomUUID) {
    return `mock-${self.crypto.randomUUID()}`
  }

  return `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function hashString(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16)
}

function createRng(seed) {
  let stateValue = Number.parseInt(hashString(seed).slice(0, 8), 16) || 1

  return () => {
    stateValue = (stateValue * 1664525 + 1013904223) >>> 0
    return stateValue / 4294967296
  }
}

function buildCurrentWeather(city) {
  const canonicalCity = titleCase(city)
  const rng = createRng(`snslvefekl:${normalizeCity(city)}`)
  const condition = CONDITIONS[Math.floor(rng() * CONDITIONS.length)] || 'Clear sky'
  const temperature = Number((14 + rng() * 18).toFixed(1))
  const humidity = Math.round(35 + rng() * 60)
  const windSpeed = Number((4 + rng() * 22).toFixed(1))

  return {
    city: canonicalCity,
    temperature,
    condition,
    humidity,
    windSpeed,
  }
}

function buildForecast(city) {
  const rng = createRng(`snslvefekl:${normalizeCity(city)}:forecast`)
  const baseDate = new Date()
  const canonicalCity = titleCase(city)

  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(baseDate)
    day.setDate(baseDate.getDate() + index)

    const center = 13 + rng() * 16
    const high = Number((center + rng() * 4).toFixed(1))
    const low = Number((center - (4 + rng() * 4)).toFixed(1))

    return {
      city: canonicalCity,
      date: day.toISOString().slice(0, 10),
      high,
      low,
      condition: CONDITIONS[Math.floor(rng() * CONDITIONS.length)] || 'Clear sky',
    }
  })
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function errorResponse(status, message, code) {
  return jsonResponse(
    {
      message,
      code,
    },
    status,
  )
}

function unauthorizedResponse() {
  return errorResponse(401, 'Authentication token is missing or invalid.', 'UNAUTHORIZED')
}

async function readJsonBody(request) {
  try {
    return await request.clone().json()
  } catch {
    return null
  }
}
