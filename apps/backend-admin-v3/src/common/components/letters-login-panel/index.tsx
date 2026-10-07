'use client'

import React, { useState } from 'react'
import { loginAction } from '@/app/(frontend)/letters/login/actions'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { MicrosoftLoginButton } from '../microsoft-login-button'

export default function LettersLoginPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await loginAction({ email, password })
    if (result.success) {
      // Reload the page so the server re-checks auth
      window.location.reload()
    } else {
      setError(result.error || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className={cn('flex items-center gap-2 mb-4', noah.className)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
        <h1 className="text-3xl font-bold text-primary">Sign in</h1>
      </div>
      <p className="text-base-content/60 mb-8 text-center max-w-md">
        Please sign in with your credentials to manage and create letters.
      </p>

      <div className="card bg-base-100 border border-base-200 shadow-xl w-full max-w-md">
        <div className="card-body p-8">
          <MicrosoftLoginButton disabled={loading} />
          <div className="divider text-xs text-base-content/50">OR</div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div role="alert" className="alert alert-error shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-control">
              <label htmlFor="login-email" className="label pb-2">
                <span className={cn('label-text font-bold text-primary', noah.className)}>
                  Email Address
                </span>
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                className="input input-bordered input-primary w-full bg-white"
                placeholder="you@dohaoasis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-control">
              <label htmlFor="login-password" className="label pb-2">
                <span className={cn('label-text font-bold text-primary', noah.className)}>
                  Password
                </span>
              </label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                className="input input-bordered input-primary w-full bg-white"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn btn-primary w-full text-white font-bold uppercase tracking-widest',
                noah.className,
              )}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
