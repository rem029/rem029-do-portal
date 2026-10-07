'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/app/(frontend)/forms/login/actions'
import { noah } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { MicrosoftLoginButton } from '../microsoft-login-button'

interface LoginFormProps {
  onSuccess?: () => void
  buttonLabel?: string
  className?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  buttonLabel = 'Sign In',
  className,
}) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await loginAction({ email, password })
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.')
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleLogin} className={cn('flex flex-col gap-4', className)}>
      <MicrosoftLoginButton disabled={isPending} />
      <div className="divider my-0 text-xs text-base-content/50">OR</div>

      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-5 w-5"
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

      <label className="form-control w-full">
        <div className="label">
          <span className={cn('label-text font-semibold text-primary', noah.className)}>Email</span>
        </div>
        <input
          type="email"
          placeholder="you@example.com"
          className="input input-bordered input-primary w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isPending}
        />
      </label>

      <label className="form-control w-full">
        <div className="label">
          <span className={cn('label-text font-semibold text-primary', noah.className)}>
            Password
          </span>
        </div>
        <input
          type="password"
          placeholder="••••••••"
          className="input input-bordered input-primary w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isPending}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className={cn('btn btn-primary w-full mt-2 uppercase', noah.className)}
      >
        {isPending ? <span className="loading loading-spinner loading-sm" /> : null}
        {isPending ? 'Signing in…' : buttonLabel}
      </button>
    </form>
  )
}
