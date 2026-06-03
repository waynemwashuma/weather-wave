import express from 'express'
import { pool } from '../db.js'
import { AppError } from '../errors.js'
import { authenticateToken } from '../middleware/auth.js'
import { normalizeCity, safeDecode } from '../utils.js'
import { validateCityExists } from '../weather.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `
        SELECT city
        FROM favorite_cities
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.user.id],
    )

    res.json({ cities: result.rows.map((row) => row.city) })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const city = String(req.body?.city ?? '').trim()
    if (!city) {
      throw new AppError(400, 'Please provide a city to save.', 'INVALID_INPUT')
    }

    const resolvedCity = await validateCityExists(city)
    const normalized = normalizeCity(resolvedCity.city)

    await pool.query(
      `
        INSERT INTO favorite_cities (user_id, city, city_normalized)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, city_normalized) DO UPDATE
        SET city = EXCLUDED.city
      `,
      [req.user.id, resolvedCity.city, normalized],
    )

    res.status(201).json({ message: `${resolvedCity.city} saved to favorites.`, city: resolvedCity.city })
  } catch (error) {
    next(error)
  }
})

router.delete('/:city', async (req, res, next) => {
  try {
    const city = safeDecode(req.params.city)
    const normalized = normalizeCity(city)

    const result = await pool.query(
      `
        DELETE FROM favorite_cities
        WHERE user_id = $1 AND city_normalized = $2
        RETURNING city
      `,
      [req.user.id, normalized],
    )

    if (result.rowCount === 0) {
      throw new AppError(404, 'That city is not in your favorites.', 'FAVORITE_NOT_FOUND')
    }

    res.json({ message: `${result.rows[0].city} removed from favorites.` })
  } catch (error) {
    next(error)
  }
})

export default router
