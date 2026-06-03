import { type FormEvent, useState } from 'react'
import {
  loginUser,
  registerUser,
  type AuthPayload,
  type UserSession,
} from '../shared/api'
import '../App.css'

type AuthMode = 'sign-in' | 'sign-up'

type AuthPageProps = {
  onAuthenticated: (session: UserSession) => void
}

function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload: AuthPayload = {
      name: formData.get('name')?.toString().trim() || undefined,
      email: formData.get('email')?.toString().trim() ?? '',
      password: formData.get('password')?.toString() ?? '',
    }

    try {
      const response =
        mode === 'sign-in' ? await loginUser(payload) : await registerUser(payload)

      onAuthenticated({
        token: response.token,
        user: {
          name: response.user.name || payload.name || payload.email,
          email: response.user.email || payload.email,
        },
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitLabel = isSubmitting
    ? mode === 'sign-in'
      ? 'Signing in...'
      : 'Creating account...'
    : mode === 'sign-in'
      ? 'Sign in'
      : 'Create account'

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-label="Authentication form">
        <div className="mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-in'}
            className={mode === 'sign-in' ? 'tab is-active' : 'tab'}
            onClick={() => setMode('sign-in')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'sign-up'}
            className={mode === 'sign-up' ? 'tab is-active' : 'tab'}
            onClick={() => setMode('sign-up')}
          >
            Register
          </button>
        </div>

        <header className="panel-header">
          <h1>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1>
          <p>
            {mode === 'sign-in'
              ? 'Sign in to search cities, see forecasts, and save favorite locations.'
              : 'Register to unlock city search, weather forecasts, and your own favorites list.'}
          </p>
        </header>

        {error && (
          <p className="status status-error" role="alert">
            {error}
          </p>
        )}

        <form
          className={mode === 'sign-in' ? 'auth-form is-sign-in' : 'auth-form is-sign-up'}
          onSubmit={handleSubmit}
        >
          <div className="field-slot">
            {mode === 'sign-up' && (
              <label className="field">
                Name
                <input
                  type="text"
                  name="name"
                  placeholder="Amina Okoth"
                  autoComplete="name"
                  required={mode === 'sign-up'}
                />
              </label>
            )}
          </div>

          <label className="field">
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            Password
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" name="remember" defaultChecked />
              <span>{mode === 'sign-in' ? 'Remember me' : 'I agree to the terms'}</span>
            </label>
          </div>

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {submitLabel}
          </button>

          {mode === 'sign-in' && (
            <p className="form-note">Use your account to manage searches, forecasts, and favorites.</p>
          )}
        </form>

        <p className="panel-footer">
          <span className="panel-footer-copy">
            {mode === 'sign-in' ? "Need an account?" : 'Already registered?'}
          </span>{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          >
            {mode === 'sign-in' ? 'Register now' : 'Sign in instead'}
          </button>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
