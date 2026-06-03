import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { AppError, isAppError } from './errors.js'
import authRouter from './routes/auth.js'
import favoritesRouter from './routes/favorites.js'
import weatherRouter from './routes/weather.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api', weatherRouter)
  app.use('/api/favorites', favoritesRouter)

  app.use((req, _res, next) => {
    next(new AppError(404, `Cannot ${req.method} ${req.originalUrl}`, 'NOT_FOUND'))
  })

  app.use((error, _req, res, _next) => {
    if (isAppError(error)) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
      })
      return
    }

    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json({
        error: 'INVALID_JSON',
        message: 'The request body could not be parsed.',
      })
      return
    }

    console.error(error)
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    })
  })

  return app
}
