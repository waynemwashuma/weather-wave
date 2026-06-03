# Backend

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

Copy `.env.example` to `.env` and set values for:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

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

The API expects a PostgreSQL database to be available at `DATABASE_URL`.

If you need to create the database manually, a connection target like this works well for local development:

```bash
createdb weather_app
```

## Notes

- Weather data is fetched from the Open-Meteo APIs.
- Invalid city names return a clear 404-style error.
- Missing or invalid JWTs return 401 responses.
