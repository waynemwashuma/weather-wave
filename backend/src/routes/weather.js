import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getCurrentWeatherForCity, getForecastForCity } from '../weather.js'
import { safeDecode } from '../utils.js'

const router = express.Router()

router.get('/weather/:city', authenticateToken, async (req, res, next) => {
  try {
    const city = safeDecode(req.params.city)
    const weather = await getCurrentWeatherForCity(city)
    res.json(weather)
  } catch (error) {
    next(error)
  }
})

router.get('/forecast/:city', authenticateToken, async (req, res, next) => {
  try {
    const city = safeDecode(req.params.city)
    const forecast = await getForecastForCity(city)
    res.json(forecast)
  } catch (error) {
    next(error)
  }
})

export default router
