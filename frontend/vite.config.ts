import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const { homepage } = require('../package.json') as { homepage?: string }

function getBasePath() {
  if (process.env.GITHUB_PAGES !== 'true' || !homepage) {
    return '/'
  }

  try {
    const url = new URL(homepage)
    if (!url.hostname.endsWith('github.io')) {
      return '/'
    }

    return url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  } catch {
    return '/'
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  const base = getBasePath()

  return {
    base,
    envPrefix: ['VITE_', 'MOCK_'],
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
      },
    },
  }
})
