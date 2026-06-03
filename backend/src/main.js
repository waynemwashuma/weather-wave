import { config } from './config.js'
import { ensureSchema, pool } from './db.js'
import { createApp } from './app.js'

await ensureSchema()

const app = createApp()
const server = app.listen(config.port, config.host, () => {
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : config.port
  console.log(`Backend listening on http://${config.host}:${port}`)
})

const shutdown = async () => {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
