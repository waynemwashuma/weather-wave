import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

function getBaseEnv() {
  return {
    ...process.env,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '0',
    FRONTEND_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'test-jwt-secret',
    OPENWEATHER_API_KEY: 'test-openweather-key',
  }
}

export async function startBackendServer() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'start'], {
      cwd: repoRoot,
      env: getBaseEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let settled = false
    let bufferedOutput = ''
    const timeoutId = setTimeout(() => {
      if (!settled) {
        fail(new Error(`Timed out waiting for backend startup.\n${bufferedOutput}`))
      }
    }, 30000)

    const fail = (error) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeoutId)
      child.kill('SIGTERM')
      reject(error)
    }

    const finish = (baseUrl) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeoutId)
      resolve({
        baseUrl,
        close: () =>
          new Promise((closeResolve) => {
            if (child.exitCode !== null || child.signalCode !== null) {
              closeResolve()
              return
            }

            child.once('exit', () => closeResolve())
            child.kill('SIGTERM')
          }),
      })
    }

    child.on('error', fail)
    child.on('exit', (code) => {
      if (!settled && code !== 0) {
        fail(new Error(`Backend exited before it was ready (code ${code ?? 'unknown'})`))
      }
    })

    child.stdout.on('data', (chunk) => {
      bufferedOutput += chunk.toString()
      const match = bufferedOutput.match(/Backend listening on http:\/\/127\.0\.0\.1:(\d+)/)
      if (match) {
        finish(`http://127.0.0.1:${match[1]}`)
      }
    })

    child.stderr.on('data', (chunk) => {
      bufferedOutput += chunk.toString()
    })
  })
}
