import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT ?? 8000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/weather_app',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-weather-secret',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
}
