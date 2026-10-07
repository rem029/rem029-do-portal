'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { cookies } from 'next/headers'

const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days

export async function loginAction(data: { email: string; password: string }) {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.login({
      collection: 'users',
      data: {
        email: data.email,
        password: data.password,
      },
    })

    if (!result.token) {
      return { success: false, error: 'Invalid email or password.' }
    }

    // Set the payload-token cookie so subsequent requests are authenticated
    const cookieStore = await cookies()
    cookieStore.set('payload-token', result.token, {
      httpOnly: true,
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
    }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.set('payload-token', '', {
    path: '/',
    maxAge: 0,
  })
  return { success: true }
}
