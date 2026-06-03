import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getCurrentWeatherForCity, getForecastForCity } from '../weather.js'
import { safeDecode } from '../utils.js'

const router = express.Router()

router.get('/weather/:city', authenticateToken, async (req, res) => {
  const city = safeDecode(req.params.city)
  const weather = await getCurrentWeatherForCity(city)
  res.json(weather)
})

router.get('/forecast/:city', authenticateToken, async (req, res) => {
  const city = safeDecode(req.params.city)
  const forecast = await getForecastForCity(city)
  res.json(forecast)
})

export default router
