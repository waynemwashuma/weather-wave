import { config } from './config.js'
import { ensureSchema, pool } from './db.js'
import { createApp } from './app.js'

async function main() {
  await ensureSchema()

  const app = createApp()
  const server = app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`)
  })

  const shutdown = async () => {
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
