import { config } from './config.js'
import { AppError } from './errors.js'
import { titleCase } from './utils.js'

function ensureApiKey() {
  if (!config.openWeatherApiKey) {
    throw new AppError(
      500,
      'The OpenWeather API key is missing. Set OPENWEATHER_API_KEY in backend/.env.',
      'MISSING_WEATHER_API_KEY',
    )
  }
}

async function fetchJson(url, errorMessage) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new AppError(502, errorMessage, 'EXTERNAL_API_FAILURE')
    }

    return await response.json()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new AppError(504, 'Weather service timed out.', 'EXTERNAL_API_TIMEOUT')
    }

    throw new AppError(502, errorMessage, 'EXTERNAL_API_FAILURE')
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchOpenWeather(path, params, errorMessage) {
  ensureApiKey()

  const query = new URLSearchParams({
    ...params,
    appid: config.openWeatherApiKey,
  })

  return fetchJson(`https://api.openweathermap.org${path}?${query.toString()}`, errorMessage)
}

function weatherConditionFromDescription(description) {
  return titleCase(description ?? 'Unknown conditions')
}

function formatLocation(result) {
  return [result.name, result.state, result.country].filter(Boolean).join(', ')
}

async function resolveCity(city) {
  const payload = await fetchOpenWeather(
    '/geo/1.0/direct',
    {
      q: city,
      limit: '1',
    },
    'Unable to reach the location service.',
  )

  const result = payload?.[0]
  if (!result) {
    throw new AppError(404, `We could not find weather data for "${city}".`, 'CITY_NOT_FOUND')
  }

  return {
    city: formatLocation(result),
    latitude: result.lat,
    longitude: result.lon,
  }
}

export async function getCurrentWeatherForCity(city) {
  const location = await resolveCity(city)
  const payload = await fetchOpenWeather(
    '/data/2.5/weather',
    {
      lat: String(location.latitude),
      lon: String(location.longitude),
      units: 'metric',
    },
    'Unable to load current weather right now.',
  )

  const main = payload?.main
  const wind = payload?.wind
  const weather = payload?.weather?.[0]
  if (!main || !wind || !weather) {
    throw new AppError(502, 'Weather data was incomplete.', 'EXTERNAL_API_FAILURE')
  }

  return {
    city: location.city,
    temperature: main.temp,
    condition: weatherConditionFromDescription(weather.description),
    humidity: main.humidity,
    windSpeed: Number((wind.speed * 3.6).toFixed(1)),
  }
}

export async function getForecastForCity(city) {
  const location = await resolveCity(city)
  const payload = await fetchOpenWeather(
    '/data/2.5/forecast',
    {
      lat: String(location.latitude),
      lon: String(location.longitude),
      units: 'metric',
    },
    'Unable to load forecast data right now.',
  )

  const entries = payload?.list
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new AppError(502, 'Forecast data was incomplete.', 'EXTERNAL_API_FAILURE')
  }

  const dailyMap = new Map()

  for (const entry of entries) {
    const date = entry.dt_txt?.slice(0, 10)
    if (!date) {
      continue
    }

    const condition = weatherConditionFromDescription(entry.weather?.[0]?.description)
    const existing = dailyMap.get(date)

    if (!existing) {
      dailyMap.set(date, {
        date,
        high: Number(entry.main?.temp_max ?? entry.main?.temp ?? 0),
        low: Number(entry.main?.temp_min ?? entry.main?.temp ?? 0),
        conditions: [condition],
      })
      continue
    }

    existing.high = Math.max(existing.high, Number(entry.main?.temp_max ?? entry.main?.temp ?? existing.high))
    existing.low = Math.min(existing.low, Number(entry.main?.temp_min ?? entry.main?.temp ?? existing.low))
    existing.conditions.push(condition)
  }

  return [...dailyMap.values()].slice(0, 5).map((day) => {
    const conditionCounts = new Map()
    for (const condition of day.conditions) {
      conditionCounts.set(condition, (conditionCounts.get(condition) ?? 0) + 1)
    }

    const condition = [...conditionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown conditions'

    return {
      city: location.city,
      date: day.date,
      high: day.high,
      low: day.low,
      condition,
    }
  })
}

export async function validateCityExists(city) {
  return resolveCity(city)
}
