import { AppError } from './errors.js'
import { titleCase } from './utils.js'

const WEATHER_CODE_MAP = new Map([
  [0, 'Clear sky'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Moderate drizzle'],
  [55, 'Dense drizzle'],
  [56, 'Freezing drizzle'],
  [57, 'Freezing drizzle'],
  [61, 'Light rain'],
  [63, 'Moderate rain'],
  [65, 'Heavy rain'],
  [66, 'Freezing rain'],
  [67, 'Freezing rain'],
  [71, 'Light snow'],
  [73, 'Moderate snow'],
  [75, 'Heavy snow'],
  [77, 'Snow grains'],
  [80, 'Rain showers'],
  [81, 'Rain showers'],
  [82, 'Violent rain showers'],
  [85, 'Snow showers'],
  [86, 'Snow showers'],
  [95, 'Thunderstorm'],
  [96, 'Thunderstorm with hail'],
  [99, 'Thunderstorm with hail'],
])

function weatherConditionFromCode(code) {
  return WEATHER_CODE_MAP.get(code) ?? 'Unknown conditions'
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

async function resolveCity(city) {
  const query = new URLSearchParams({
    name: city,
    count: '1',
    language: 'en',
    format: 'json',
  })

  const payload = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?${query.toString()}`,
    'Unable to reach the location service.',
  )

  const result = payload?.results?.[0]
  if (!result) {
    throw new AppError(404, `We could not find weather data for "${city}".`, 'CITY_NOT_FOUND')
  }

  return {
    city: titleCase(result.name),
    latitude: result.latitude,
    longitude: result.longitude,
  }
}

export async function getCurrentWeatherForCity(city) {
  const location = await resolveCity(city)
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    timezone: 'auto',
  })

  const payload = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?${query.toString()}`,
    'Unable to load current weather right now.',
  )

  const current = payload?.current
  if (!current) {
    throw new AppError(502, 'Weather data was incomplete.', 'EXTERNAL_API_FAILURE')
  }

  return {
    city: location.city,
    temperature: current.temperature_2m,
    condition: weatherConditionFromCode(current.weather_code),
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
  }
}

export async function getForecastForCity(city) {
  const location = await resolveCity(city)
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '5',
    timezone: 'auto',
  })

  const payload = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?${query.toString()}`,
    'Unable to load forecast data right now.',
  )

  const daily = payload?.daily
  if (!daily) {
    throw new AppError(502, 'Forecast data was incomplete.', 'EXTERNAL_API_FAILURE')
  }

  return daily.time.map((date, index) => ({
    city: location.city,
    date,
    high: daily.temperature_2m_max[index],
    low: daily.temperature_2m_min[index],
    condition: weatherConditionFromCode(daily.weather_code[index]),
  }))
}

export async function validateCityExists(city) {
  return resolveCity(city)
}
