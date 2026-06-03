import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const isPagesBuild = process.env.GITHUB_PAGES === 'true'
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
  const base = isPagesBuild && repositoryName ? `/${repositoryName}/` : '/'

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
