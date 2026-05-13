import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  tracesSampleRate: 0.1,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
})

// Verificar se o elemento root existe
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Elemento root não encontrado!')
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Erro: Elemento root não encontrado</h1></div>'
} else {
  try {
    const root = createRoot(rootElement)
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  } catch (error) {
    console.error('Erro ao renderizar aplicação:', error)
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'padding:20px;text-align:center;font-family:sans-serif'
    const title = document.createElement('h1')
    title.style.color = 'red'
    title.textContent = 'Erro ao carregar aplicação'
    const msg = document.createElement('p')
    msg.textContent = error.message
    const btn = document.createElement('button')
    btn.style.cssText = 'margin-top:20px;padding:10px 20px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer'
    btn.textContent = 'Recarregar Página'
    btn.onclick = () => window.location.reload()
    wrapper.append(title, msg, btn)
    rootElement.replaceChildren(wrapper)
  }
}
