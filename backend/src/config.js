import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT ?? 8000),
  host: process.env.HOST ?? '127.0.0.1',
  databaseHost: process.env.DATABASE_HOST ?? 'localhost',
  databasePort: Number(process.env.DATABASE_PORT ?? 5432),
  databaseName: process.env.DATABASE_NAME ?? 'weather_wave',
  databaseUser: process.env.DATABASE_USER ?? 'postgres',
  databasePassword: process.env.DATABASE_PASSWORD ?? 'postgres',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-weather-secret',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? '',
  openWeatherBaseUrl: process.env.OPENWEATHER_BASE_URL ?? 'https://api.openweathermap.org',
}
