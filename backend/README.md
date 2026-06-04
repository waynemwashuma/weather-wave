# Weather Wave Backend

This backend is an Express API backed by PostgreSQL and protected with JWT authentication.

## Features

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/weather/:city`
- `GET /api/forecast/:city`
- `POST /api/favorites`
- `GET /api/favorites`
- `DELETE /api/favorites/:city`

It also boots the database tables automatically on startup if they do not already exist.

## Environment Variables

Set values in `backend/.env` for the variables below. Only `OPENWEATHER_API_KEY` is required for weather requests to work, but you should set the database and JWT values for local development so they do not rely on the built-in defaults.

| Variable | Purpose | Default |
| --- | --- | --- |
| `HOST` | Host interface the API listens on. | `127.0.0.1` |
| `PORT` | Port the API listens on. | `8000` |
| `DATABASE_HOST` | PostgreSQL host. | `localhost` |
| `DATABASE_PORT` | PostgreSQL port. | `5432` |
| `DATABASE_NAME` | Database name used by the backend. | `weather_wave` |
| `DATABASE_USER` | Database user for the PostgreSQL connection. | `postgres` |
| `DATABASE_PASSWORD` | Password for the PostgreSQL connection. | `postgres` |
| `JWT_SECRET` | Secret used to sign and verify authentication tokens. | `dev-weather-secret` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for the frontend app. | `http://localhost:5173` |
| `OPENWEATHER_API_KEY` | API key used to fetch geocoding, current weather, and forecast data from OpenWeather. | none |
| `OPENWEATHER_BASE_URL` | Base URL for the OpenWeather API. Useful if you want to point the backend at a different endpoint during testing. | `https://api.openweathermap.org` |

## Run

From the repository root:

```bash
npm install
npm run start:backend
```

Or run both frontend and backend together:

```bash
npm start
```

## Database

The API expects a PostgreSQL database to be available using the values in the database environment variables.

If you need to create the database manually, a connection target like this works well for local development:

```bash
createdb weather_wave
```

## Notes

- Weather data is fetched from the OpenWeather APIs.
- Invalid city names return a clear 404-style error.
- Missing or invalid JWTs return 401 responses.
