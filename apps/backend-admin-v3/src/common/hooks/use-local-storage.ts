'use client'

import { useCallback, useState } from 'react'

type SetValue<T> = T | ((prev: T) => T)

interface UseLocalStorageOptions {
  disabled?: boolean
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: UseLocalStorageOptions,
) {
  const disabled = options?.disabled ?? false

  const resolveInitial = useCallback((): T => {
    return initialValue instanceof Function ? initialValue() : initialValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [value, setValue] = useState<T>(() => {
    if (disabled || typeof window === 'undefined') return resolveInitial()

    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : resolveInitial()
    } catch {
      return resolveInitial()
    }
  })

  const setStoredValue = useCallback(
    (next: SetValue<T>) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next

        if (!disabled && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(resolved))
          } catch {
            // localStorage may be unavailable (quota exceeded, private mode) - ignore
          }
        }

        return resolved
      })
    },
    [key, disabled],
  )

  const clearStoredValue = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // ignore
      }
    }
    setValue(resolveInitial())
  }, [key, resolveInitial])

  return [value, setStoredValue, clearStoredValue] as const
}
