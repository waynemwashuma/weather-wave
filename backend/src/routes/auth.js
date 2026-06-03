import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { config } from '../config.js'
import { AppError } from '../errors.js'

const router = express.Router()

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!name) {
      throw new AppError(400, 'Please provide your name.', 'INVALID_INPUT')
    }

    if (!email || !email.includes('@')) {
      throw new AppError(400, 'Please provide a valid email address.', 'INVALID_INPUT')
    }

    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters long.', 'INVALID_INPUT')
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rowCount > 0) {
      throw new AppError(409, 'An account with that email already exists.', 'EMAIL_EXISTS')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const userResult = await pool.query(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email
      `,
      [name, email, passwordHash],
    )

    const user = sanitizeUser(userResult.rows[0])
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: '7d' })

    res.status(201).json({ token, user })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required.', 'INVALID_INPUT')
    }

    const result = await pool.query(
      `
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = $1
      `,
      [email],
    )

    const userRow = result.rows[0]
    if (!userRow) {
      throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
    }

    const passwordMatches = await bcrypt.compare(password, userRow.password_hash)
    if (!passwordMatches) {
      throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
    }

    const user = sanitizeUser(userRow)
    const token = jwt.sign(user, config.jwtSecret, { expiresIn: '7d' })

    res.json({ token, user })
  } catch (error) {
    next(error)
  }
})

export default router
