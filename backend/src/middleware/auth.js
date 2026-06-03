import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { AppError } from '../errors.js'

export function authenticateToken(req, _res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Missing authentication token.', 'MISSING_TOKEN'))
    return
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.user = payload
    next()
  } catch {
    next(new AppError(401, 'Your session is invalid or has expired. Please sign in again.', 'INVALID_TOKEN'))
  }
}
