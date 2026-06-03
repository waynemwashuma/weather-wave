import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  addFavoriteCity,
  getCurrentWeather,
  getFavoriteCities,
  getForecast,
  removeFavoriteCity,
  type CurrentWeather,
  type ForecastDay,
} from '../shared/api'
import type { UserSession } from '../shared/session'
import '../App.css'

type DashboardPageProps = {
  session: UserSession
  onSignOut: () => void
}

type FavoriteSnapshot = {
  city: string
  temperature: number | null
  condition: string | null
  humidity: number | null
  windSpeed: number | null
  error?: string
}

function DashboardPage({ session, onSignOut }: DashboardPageProps) {
  const [cityQuery, setCityQuery] = useState('')
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchMessage, setSearchMessage] = useState<string>('Search for a city to begin.')
  const [favoriteWeather, setFavoriteWeather] = useState<FavoriteSnapshot[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoritesError, setFavoritesError] = useState<string | null>(null)
  const [favoritesBusy, setFavoritesBusy] = useState<string | null>(null)

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true)
    setFavoritesError(null)

    try {
      const rawFavorites = await getFavoriteCities(session.token)
      let normalizedCities: string[] = []

      if (Array.isArray(rawFavorites)) {
        normalizedCities = rawFavorites
      } else if (Array.isArray((rawFavorites as { cities?: unknown }).cities)) {
        normalizedCities = (rawFavorites as { cities: string[] }).cities ?? []
      }

      const snapshots = await Promise.all(
        normalizedCities.map(async (city) => {
          try {
            const weather = await getCurrentWeather(city, session.token)
            return {
              city: weather.city,
              temperature: weather.temperature,
              condition: weather.condition,
              humidity: weather.humidity,
              windSpeed: weather.windSpeed,
            }
          } catch (error) {
            return {
              city,
              temperature: null,
              condition: null,
              humidity: null,
              windSpeed: null,
              error: error instanceof Error ? error.message : undefined,
            }
          }
        }),
      )

      setFavoriteWeather(snapshots)
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : null)
      setFavoriteWeather([])
    } finally {
      setFavoritesLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadFavorites()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [loadFavorites])

  const runSearch = async (city: string): Promise<CurrentWeather | null> => {
    const query = city.trim()
    setSearchLoading(true)
    setSearchError(null)
    setSearchMessage(`Loading weather for ${query}...`)

    try {
      const [weather, forecastData] = await Promise.all([
        getCurrentWeather(query, session.token),
        getForecast(query, session.token),
      ])

      setCurrentWeather(weather)
      setForecast(forecastData)
      setSearchMessage(`Showing weather for ${weather.city}.`)
      setCityQuery(weather.city)
      return weather
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : null)
      setSearchMessage('Search for a city to begin.')
      setCurrentWeather(null)
      setForecast([])
      return null
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await runSearch(cityQuery)
  }

  const handleViewFavorite = async (city: string) => {
    await runSearch(city)
  }

  const handleAddFavorite = async () => {
    if (!currentWeather) {
      return
    }

    setFavoritesBusy(currentWeather.city)
    setFavoritesError(null)
    try {
      await addFavoriteCity(currentWeather.city, session.token)
      await loadFavorites()
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : null)
    } finally {
      setFavoritesBusy(null)
    }
  }

  const handleRemoveFavorite = async (city: string) => {
    setFavoritesBusy(city)
    setFavoritesError(null)

    try {
      await removeFavoriteCity(city, session.token)
      await loadFavorites()
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : null)
    } finally {
      setFavoritesBusy(null)
    }
  }

  const isCurrentFavorite = Boolean(
    currentWeather && favoriteWeather.some((entry) => entry.city === currentWeather.city),
  )
  const canSaveFavorite = Boolean(currentWeather) && !isCurrentFavorite && favoriteWeather.length < 3

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Weather Wave Dashboard</p>
          <h1>Welcome back, {session.user.name}.</h1>
        </div>

        <button type="button" className="secondary-button signout-button" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="panel search-panel">
          <div className="panel-title-row">
            <div>
              <p className="panel-kicker">City search</p>
              <h2>Find weather by city name</h2>
            </div>
          </div>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <label className="field search-field">
              City name
              <input
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                type="text"
                placeholder="Nairobi"
                autoComplete="off"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search weather'}
            </button>
          </form>

          <p className="status">{searchLoading ? searchMessage : searchMessage}</p>
          {searchError && (
            <p className="status status-error" role="alert">
              {searchError}
            </p>
          )}
        </article>

        <article className="panel current-panel">
          <div className="panel-title-row">
            <div>
              <p className="panel-kicker">Current weather</p>
              <h2>{currentWeather ? currentWeather.city : 'No city selected yet'}</h2>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleAddFavorite}
              disabled={!canSaveFavorite || favoritesBusy === currentWeather?.city}
            >
              {favoritesBusy === currentWeather?.city
                ? 'Saving...'
                : isCurrentFavorite
                  ? 'Saved'
                  : 'Save city'}
            </button>
          </div>

          {currentWeather ? (
            <div className="weather-summary">
              <div className="weather-hero">
                <strong>{Math.round(currentWeather.temperature)}°C</strong>
                <span>{currentWeather.condition}</span>
              </div>

              <dl className="metric-grid">
                <div>
                  <dt>City name</dt>
                  <dd>{currentWeather.city}</dd>
                </div>
                <div>
                  <dt>Humidity</dt>
                  <dd>{currentWeather.humidity}%</dd>
                </div>
                <div>
                  <dt>Wind speed</dt>
                  <dd>{currentWeather.windSpeed} km/h</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="empty-state">Search for a city to display temperature, condition, humidity, and wind speed.</p>
          )}
        </article>

        <article className="panel forecast-panel">
          <div className="panel-title-row">
            <div>
              <p className="panel-kicker">5-day forecast</p>
              <h2>Forecast details</h2>
            </div>
          </div>

          {searchLoading ? (
            <p className="empty-state">Loading forecast...</p>
          ) : forecast.length > 0 ? (
            <div className="forecast-list">
              {forecast.map((day) => (
                <section className="forecast-card" key={day.date}>
                  <p className="forecast-date">{day.date}</p>
                  <strong>{day.condition}</strong>
                  <dl>
                    <div>
                      <dt>High</dt>
                      <dd>{Math.round(day.high)}°C</dd>
                    </div>
                    <div>
                      <dt>Low</dt>
                      <dd>{Math.round(day.low)}°C</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <p className="empty-state">Your 5-day forecast will appear here after a search.</p>
          )}
        </article>

        <article className="panel favorites-panel">
          <div className="panel-title-row">
            <div>
              <p className="panel-kicker">Favorite cities</p>
              <h2>Saved places</h2>
            </div>
            <span className="favorite-count">{favoriteWeather.length}/3</span>
          </div>

          {favoritesLoading ? (
            <p className="status">Loading favorites...</p>
          ) : favoritesError ? (
            <p className="status status-error" role="alert">
              {favoritesError}
            </p>
          ) : favoriteWeather.length > 0 ? (
            <div className="favorites-list">
              {favoriteWeather.map((favorite) => (
                <section
                  className={`favorite-card ${currentWeather?.city === favorite.city ? 'favorite-card--active' : ''}`}
                  key={favorite.city}
                >
                  <div className="panel-title-row favorite-card-header">
                    <div>
                      <h3>{favorite.city}</h3>
                      {favorite.error ? (
                        <p className="status status-error">{favorite.error}</p>
                      ) : (
                        <p>{favorite.condition}</p>
                      )}
                    </div>

                    <div className="favorite-card-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleViewFavorite(favorite.city)}
                        disabled={searchLoading && currentWeather?.city === favorite.city}
                      >
                        {currentWeather?.city === favorite.city && !searchLoading ? 'Viewing' : 'View report'}
                      </button>

                      <button
                        type="button"
                        className="link-button"
                        onClick={() => handleRemoveFavorite(favorite.city)}
                        disabled={favoritesBusy === favorite.city}
                      >
                        {favoritesBusy === favorite.city ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>

                  {!favorite.error && (
                    <dl className="metric-grid metric-grid-compact">
                      <div>
                        <dt>Temperature</dt>
                        <dd>{Math.round(favorite.temperature ?? 0)}°C</dd>
                      </div>
                      <div>
                        <dt>Humidity</dt>
                        <dd>{favorite.humidity}%</dd>
                      </div>
                      <div>
                        <dt>Wind</dt>
                        <dd>{favorite.windSpeed} km/h</dd>
                      </div>
                    </dl>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Save up to 3 cities. Your favorites will show current weather here.
            </p>
          )}
        </article>
      </section>
    </main>
  )
}

export default DashboardPage
