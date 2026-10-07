'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '@/common/hooks/use-local-storage'

export type NotifyPermission = NotificationPermission | 'unsupported'

/** Alert-tone loudness. Kept deliberately quiet - 'normal' is a soft mallet chime,
 *  'low' is barely-there for meetings, 'high' for a noisy kitchen pass. */
export type SoundLevel = 'low' | 'normal' | 'high'

export type ToneId = 'classic' | 'chime' | 'ring' | 'bell' | 'handbell'

const LEVEL_MULTIPLIER: Record<SoundLevel, number> = {
  low: 0.5,
  normal: 1,
  high: 1.7,
}

const LOOP_INTERVAL_MS = 3500

export interface NotifyOptions extends NotificationOptions {
  /** Also play the alert tone. Default true. */
  sound?: boolean
  /** Fire even while the tab is visible (staff "chime when visible" opt-in). Default false. */
  whenVisible?: boolean
}

export interface UseBrowserNotificationsOptions {
  scope?: string
}

export interface UseBrowserNotifications {
  /** 'unsupported' when the Notification API is missing; otherwise the live permission. */
  permission: NotifyPermission
  /** Ask for notification permission AND create/resume the AudioContext — must be
   *  called from a user gesture (click). Safe to call when already granted. */
  requestPermission: () => Promise<void>
  /** Create/resume the AudioContext only (sound-only opt-in path). User gesture. */
  enableSound: () => Promise<void>
  /** True once the AudioContext exists and is 'running'. */
  soundReady: boolean
  /** User's on/off choice, persisted in localStorage. Default true. */
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
  /** Alert-tone loudness, persisted in localStorage. Default 'normal'. */
  soundLevel: SoundLevel
  setSoundLevel: (v: SoundLevel) => void
  /** Selected alert tone, persisted in localStorage. Default 'chime'. */
  tone: ToneId
  setTone: (v: ToneId) => void
  /** Ring until accepted user preference, persisted in localStorage. Default false. */
  loopEnabled: boolean
  setLoopEnabled: (v: boolean) => void
  /** Live ringing state driven by the board when actionable orders are waiting. */
  ringing: boolean
  setRinging: (v: boolean) => void
  /** Fire even while the tab is visible/focused, persisted in localStorage. Default false. */
  chimeWhenVisible: boolean
  setChimeWhenVisible: (v: boolean) => void
  /** Play the selected alert tone now. No-op if the context isn't running or soundEnabled is false. */
  playAlertTone: () => void
  /**
   * Fire an OS notification + tone for an order event.
   * - Tab visible and `whenVisible` / `chimeWhenVisible` not set → does NOTHING.
   * - Otherwise → tone (when options.sound !== false, soundEnabled and the AudioContext is running)
   *   AND a Notification when permission === 'granted' (wrapped in try/catch for mobile Safari).
   */
  notify: (title: string, options?: NotifyOptions) => void
}

function getLegacyDefault<T>(legacyKey: string, fallback: T): T {
  if (typeof window !== 'undefined') {
    try {
      const v = window.localStorage.getItem(legacyKey)
      if (v !== null) return JSON.parse(v) as T
    } catch {
      // ignore parse errors
    }
  }
  return fallback
}

export function useBrowserNotifications(
  options?: UseBrowserNotificationsOptions,
): UseBrowserNotifications {
  const scope = options?.scope ?? 'default'
  const k = useCallback((name: string) => `fnb-notify:${scope}:${name}`, [scope])

  const [permission, setPermission] = useState<NotifyPermission>('unsupported')
  const permissionRef = useRef<NotifyPermission>(permission)

  useEffect(() => {
    permissionRef.current = permission
  }, [permission])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    } else {
      setPermission('unsupported')
    }
  }, [])

  // Keep the UI in sync when the user flips the site's notification permission
  // from the browser chrome (URL bar / site settings) rather than our button.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return
    let status: PermissionStatus | null = null
    const onChange = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission)
      }
    }
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((s) => {
        status = s
        s.addEventListener('change', onChange)
      })
      .catch(() => {
        // Some browsers reject the 'notifications' permission query - safe to ignore.
      })
    return () => status?.removeEventListener('change', onChange)
  }, [])

  const [soundEnabled, setSoundEnabledStorage] = useLocalStorage<boolean>(
    k('sound'),
    scope === 'default' ? () => getLegacyDefault('fnb-notify-sound', true) : true,
  )
  const soundEnabledRef = useRef<boolean>(soundEnabled)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const setSoundEnabled = useCallback(
    (v: boolean) => {
      soundEnabledRef.current = v
      setSoundEnabledStorage(v)
    },
    [setSoundEnabledStorage],
  )

  const [soundLevel, setSoundLevelStorage] = useLocalStorage<SoundLevel>(
    k('level'),
    scope === 'default' ? () => getLegacyDefault('fnb-notify-level', 'normal') : 'normal',
  )
  const soundLevelRef = useRef<SoundLevel>(soundLevel)

  useEffect(() => {
    soundLevelRef.current = soundLevel
  }, [soundLevel])

  const setSoundLevel = useCallback(
    (v: SoundLevel) => {
      soundLevelRef.current = v
      setSoundLevelStorage(v)
    },
    [setSoundLevelStorage],
  )

  const [tone, setToneStorage] = useLocalStorage<ToneId>(k('tone'), 'chime')
  const toneRef = useRef<ToneId>(tone)

  useEffect(() => {
    toneRef.current = tone
  }, [tone])

  const setTone = useCallback(
    (v: ToneId) => {
      toneRef.current = v
      setToneStorage(v)
    },
    [setToneStorage],
  )

  const [loopEnabled, setLoopEnabledStorage] = useLocalStorage<boolean>(k('loop'), false)
  const setLoopEnabled = useCallback(
    (v: boolean) => {
      setLoopEnabledStorage(v)
    },
    [setLoopEnabledStorage],
  )

  const [chimeWhenVisible, setChimeWhenVisibleStorage] = useLocalStorage<boolean>(
    k('chimeVisible'),
    scope === 'default' ? () => getLegacyDefault('fnb-notify-chime-visible', false) : false,
  )
  const chimeWhenVisibleRef = useRef<boolean>(chimeWhenVisible)

  useEffect(() => {
    chimeWhenVisibleRef.current = chimeWhenVisible
  }, [chimeWhenVisible])

  const setChimeWhenVisible = useCallback(
    (v: boolean) => {
      chimeWhenVisibleRef.current = v
      setChimeWhenVisibleStorage(v)
    },
    [setChimeWhenVisibleStorage],
  )

  const ringingRef = useRef(false)
  const [ringing, setRingingState] = useState(false)
  const loopTimerRef = useRef<number | null>(null)

  const setRinging = useCallback((active: boolean) => {
    if (active === ringingRef.current) return
    ringingRef.current = active
    setRingingState(active)
  }, [])

  const audioContextRef = useRef<AudioContext | null>(null)
  const [soundReady, setSoundReady] = useState<boolean>(false)

  const getOrCreateAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    if (audioContextRef.current) return audioContextRef.current

    const AudioCtx =
      window.AudioContext ??
      // Safari prefix structural cast: webkitAudioContext fallback
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioCtx) return null

    try {
      const ctx = new AudioCtx()
      audioContextRef.current = ctx
      ctx.onstatechange = () => {
        setSoundReady(ctx.state === 'running')
      }
      setSoundReady(ctx.state === 'running')
      return ctx
    } catch {
      return null
    }
  }, [])

  // Release the AudioContext and loop timer when the last consumer unmounts
  useEffect(() => {
    return () => {
      if (loopTimerRef.current !== null) {
        window.clearInterval(loopTimerRef.current)
        loopTimerRef.current = null
      }
      const ctx = audioContextRef.current
      audioContextRef.current = null
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {})
      }
    }
  }, [])

  const enableSound = useCallback(async (): Promise<void> => {
    const ctx = getOrCreateAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // Autoplay policy or resume failure
      }
    }
    setSoundReady(ctx.state === 'running')
  }, [getOrCreateAudioContext])

  const requestPermission = useCallback(async (): Promise<void> => {
    // Ask for permission FIRST, before any other await: resuming the AudioContext
    // yields to the microtask queue, which can invalidate the transient user
    // activation that Safari/WebKit requires for Notification.requestPermission().
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission()
        // Legacy callback-style WebKit resolves undefined - don't clobber state with it.
        if (res) setPermission(res)
      } catch {
        // Permission request failed or unsupported
      }
    }

    await enableSound()
  }, [enableSound])

  const lastToneAtRef = useRef(0)

  const playAlertTone = useCallback(() => {
    if (!soundEnabledRef.current) return
    const ctx = audioContextRef.current
    if (!ctx) return

    if (ctx.state === 'suspended') {
      // Browsers auto-suspend idle contexts (an iPad board left running for hours);
      // kick a resume so the next event chimes even though this one is skipped.
      ctx.resume().catch(() => {})
      return
    }
    if (ctx.state !== 'running') return

    // Coalesce bursts (batch updates, reconnect replays) into a single blip.
    const nowMs = Date.now()
    if (nowMs - lastToneAtRef.current < 250) return
    lastToneAtRef.current = nowMs

    try {
      const now = ctx.currentTime
      const mult = LEVEL_MULTIPLIER[soundLevelRef.current]
      const currentTone = toneRef.current

      if (currentTone === 'classic') {
        const peak = 0.11 * mult

        // Note 1: ~660Hz, triangle oscillator, ~100ms duration
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(660, now)

        gain1.gain.setValueAtTime(0.0001, now)
        gain1.gain.exponentialRampToValueAtTime(peak, now + 0.02)
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)

        osc1.connect(gain1)
        gain1.connect(ctx.destination)

        osc1.start(now)
        osc1.stop(now + 0.1)
        osc1.onended = () => {
          osc1.disconnect()
          gain1.disconnect()
        }

        // Note 2: ~880Hz, triangle oscillator, ~110ms duration (total ~220ms)
        const t2 = now + 0.11
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(880, t2)

        gain2.gain.setValueAtTime(0.0001, t2)
        gain2.gain.exponentialRampToValueAtTime(peak, t2 + 0.02)
        gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.11)

        osc2.connect(gain2)
        gain2.connect(ctx.destination)

        osc2.start(t2)
        osc2.stop(t2 + 0.11)
        osc2.onended = () => {
          osc2.disconnect()
          gain2.disconnect()
        }
      } else if (currentTone === 'ring') {
        const peak = 0.09 * mult

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1000, now)
        filter.connect(ctx.destination)

        const gain = ctx.createGain()
        gain.connect(filter)

        // Burst A: now -> now + 0.4s (15ms attack, hold, 15ms release)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.015)
        gain.gain.setValueAtTime(peak, now + 0.385)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)

        // Burst B: now + 0.6s -> now + 1.0s (15ms attack, hold, 15ms release)
        gain.gain.setValueAtTime(0.0001, now + 0.6)
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.615)
        gain.gain.setValueAtTime(peak, now + 0.985)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0)

        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        osc1.type = 'sine'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(440, now)
        osc2.frequency.setValueAtTime(480, now)

        osc1.connect(gain)
        osc2.connect(gain)

        osc1.start(now)
        osc1.stop(now + 1.0)
        osc2.start(now)
        osc2.stop(now + 1.0)

        let stopped = 0
        const cleanup = () => {
          try {
            osc1.disconnect()
            osc2.disconnect()
            gain.disconnect()
            filter.disconnect()
          } catch {
            // already torn down
          }
        }
        osc1.onended = () => {
          stopped++
          if (stopped === 2) cleanup()
        }
        osc2.onended = () => {
          stopped++
          if (stopped === 2) cleanup()
        }
        window.setTimeout(cleanup, 1200)
      } else if (currentTone === 'bell') {
        const peak = 0.06 * mult
        const fundamental = 660

        // Soften the top end so the metallic partials shimmer rather than pierce.
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(3500, now)
        filter.connect(ctx.destination)

        // Struck-metal timbre = a few INHARMONIC partials (not integer multiples),
        // each quieter and shorter-lived than the last, over a long exponential tail.
        const partials: { ratio: number; gain: number; decay: number }[] = [
          { ratio: 1, gain: 1.0, decay: 1.8 },
          { ratio: 2.76, gain: 0.6, decay: 1.2 },
          { ratio: 5.4, gain: 0.35, decay: 0.7 },
          { ratio: 8.93, gain: 0.2, decay: 0.4 },
        ]

        partials.forEach(({ ratio, gain: g, decay }) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(fundamental * ratio, now)

          // Near-instant attack (a strike), long exponential ring-out.
          gain.gain.setValueAtTime(0.0001, now)
          gain.gain.exponentialRampToValueAtTime(peak * g, now + 0.005)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decay)

          osc.connect(gain)
          gain.connect(filter)

          osc.start(now)
          osc.stop(now + decay)
          osc.onended = () => {
            osc.disconnect()
            gain.disconnect()
          }
        })

        // Release the shared filter after the longest partial has decayed.
        window.setTimeout(() => {
          try {
            filter.disconnect()
          } catch {
            // already torn down
          }
        }, 2000)
      } else if (currentTone === 'handbell') {
        const peak = 0.055 * mult
        const fundamental = 660

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(3500, now)
        filter.connect(ctx.destination)

        const partials: { ratio: number; gain: number; decay: number }[] = [
          { ratio: 1, gain: 1.0, decay: 1.6 },
          { ratio: 2.76, gain: 0.55, decay: 1.0 },
          { ratio: 5.4, gain: 0.3, decay: 0.6 },
          { ratio: 8.93, gain: 0.18, decay: 0.35 },
        ]

        // One clapper strike. `decayScale` < 1 cuts the ring short when another
        // swing follows; `wobble` detunes the whole strike a few cents to mimic
        // the bell meeting the clapper at a different point of its arc.
        const strike = (startAt: number, decayScale: number, wobble: number) => {
          partials.forEach(({ ratio, gain: g, decay }) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(fundamental * ratio * wobble, startAt)

            const d = decay * decayScale
            gain.gain.setValueAtTime(0.0001, startAt)
            gain.gain.exponentialRampToValueAtTime(peak * g, startAt + 0.004)
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + d)

            osc.connect(gain)
            gain.connect(filter)

            osc.start(startAt)
            osc.stop(startAt + d)
            osc.onended = () => {
              osc.disconnect()
              gain.disconnect()
            }
          })
        }

        // Three swings ~0.4 s apart; the first two are damped by the next
        // swing, the last one rings out in full.
        strike(now, 0.5, 1.0)
        strike(now + 0.4, 0.5, 0.993)
        strike(now + 0.8, 1.0, 1.006)

        window.setTimeout(() => {
          try {
            filter.disconnect()
          } catch {
            // already torn down
          }
        }, 2800)
      } else {
        // chime (default)
        const peak = 0.05 * mult

        // Shared low-pass: keep only the rounded fundamental, drop the piercing
        // harmonics that make a raw oscillator read as an alarm.
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1300, now)
        filter.Q.setValueAtTime(0.7, now)
        filter.connect(ctx.destination)

        const playNote = (freq: number, startAt: number, duration: number) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, startAt)

          gain.gain.setValueAtTime(0.0001, startAt)
          gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.04)
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

          osc.connect(gain)
          gain.connect(filter)

          osc.start(startAt)
          osc.stop(startAt + duration)
          osc.onended = () => {
            osc.disconnect()
            gain.disconnect()
          }
        }

        playNote(587.33, now, 0.3)
        playNote(783.99, now + 0.13, 0.4)

        // Release the shared filter once the longest tail has finished.
        window.setTimeout(() => {
          try {
            filter.disconnect()
          } catch {
            // already torn down
          }
        }, 700)
      }
    } catch {
      // Ignore audio scheduling errors
    }
  }, [])

  useEffect(() => {
    if (!ringing) return
    playAlertTone() // fire immediately
    const id = window.setInterval(() => playAlertTone(), LOOP_INTERVAL_MS)
    loopTimerRef.current = id
    return () => {
      window.clearInterval(id)
      loopTimerRef.current = null
    }
  }, [ringing, playAlertTone])

  const notify = useCallback(
    (title: string, options?: NotifyOptions) => {
      const isVisible = typeof document !== 'undefined' && document.visibilityState === 'visible'
      const allowWhenVisible = Boolean(options?.whenVisible || chimeWhenVisibleRef.current)

      // "Like Facebook": stay quiet while the tab is focused - the live board is
      // already the signal - UNLESS the caller opted in or panel has chimeWhenVisible enabled.
      if (isVisible && !allowWhenVisible) {
        return
      }

      if (options?.sound !== false) {
        playAlertTone()
      }

      // Once past the visibility gate above, deliver the full alert (banner + tone).
      // Firing a Notification while the tab is focused is fine here: it only happens
      // on the explicit opt-in, never on the default background path.
      if (
        permissionRef.current === 'granted' &&
        typeof window !== 'undefined' &&
        'Notification' in window
      ) {
        try {
          new Notification(title, options)
        } catch {
          // Guard against mobile Safari or restricted contexts throwing "Illegal constructor"
        }
      }
    },
    [playAlertTone],
  )

  return {
    permission,
    requestPermission,
    enableSound,
    soundReady,
    soundEnabled,
    setSoundEnabled,
    soundLevel,
    setSoundLevel,
    tone,
    setTone,
    loopEnabled,
    setLoopEnabled,
    ringing,
    setRinging,
    chimeWhenVisible,
    setChimeWhenVisible,
    playAlertTone,
    notify,
  }
}
