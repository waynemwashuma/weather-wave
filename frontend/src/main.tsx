import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { bootstrapMockServer } from './shared/mockServer'

async function bootstrap() {
  await bootstrapMockServer()
  const basename = import.meta.env.BASE_URL

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

void bootstrap()
