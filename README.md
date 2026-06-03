# Weather Wave

This repository contains:

- A React frontend in `frontend/`
- An Express + PostgreSQL backend in `backend/`

## Quick Start

1. Install dependencies from the repository root:

```bash
npm install
```

2. Create `backend/.env` with your PostgreSQL host, port, database name, username, password, JWT secret, and OpenWeather API key.
3. Make sure PostgreSQL is running and the database in `DATABASE_NAME` exists. The local default database name is `weather_wave`.
4. Start both apps:

```bash
npm start
```

Frontend:

- `http://localhost:5173`

Backend:

- `http://localhost:8000`

## Backend API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/weather/:city`
- `GET /api/forecast/:city`
- `POST /api/favorites`
- `GET /api/favorites`
- `DELETE /api/favorites/:city`

## Notes

- Weather data comes from OpenWeather.
- JWTs are required for weather and favorites endpoints.
- The backend bootstraps its PostgreSQL tables on startup.
