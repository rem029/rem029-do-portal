'use client'

import React from 'react'
import {
  SoundLevel,
  ToneId,
  UseBrowserNotifications,
} from '@/common/hooks/useBrowserNotifications'
import { cn } from '@/utilities/cn'
import { OUTLINE_BUTTON_CLASSES } from './index'

export interface NotificationSettingsPanelProps {
  notifications: UseBrowserNotifications
}

interface ToneOption {
  id: ToneId
  label: string
  description: string
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'chime',
    label: 'Soft chime',
    description: 'Gentle rising fourth sine chime (default)',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Original two-note triangle blip',
  },
  {
    id: 'ring',
    label: 'Ring',
    description: 'Telephone ringback double burst',
  },
  {
    id: 'bell',
    label: 'Bell',
    description: 'Struck metal bell with a long ring-out',
  },
  {
    id: 'handbell',
    label: 'Hand bell',
    description: 'Bell swung three times',
  },
]

const VOLUME_LEVELS: { id: SoundLevel; label: string }[] = [
  { id: 'low', label: 'Quiet' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'Loud' },
]

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  notifications,
}) => {
  const {
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
    chimeWhenVisible,
    setChimeWhenVisible,
    playAlertTone,
  } = notifications

  const handlePreviewTone = async (id: ToneId) => {
    setTone(id)
    await enableSound()
    playAlertTone()
  }

  const handleSetVolume = async (lvl: SoundLevel) => {
    setSoundLevel(lvl)
    await enableSound()
    playAlertTone()
  }

  return (
    <div className="flex flex-col gap-6 text-xs text-[var(--theme-elevation-800)]">
      {/* 1. Browser notifications */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-elevation-500)] m-0">
          Browser notifications
        </h3>
        {permission === 'default' && (
          <div>
            <button
              type="button"
              onClick={() => void requestPermission()}
              className={cn(
                OUTLINE_BUTTON_CLASSES,
                'w-full py-2 text-xs flex items-center justify-center gap-2',
              )}
            >
              🔔 Enable alerts
            </button>
            <p className="text-xs text-[var(--theme-elevation-600)] mt-1.5 m-0 leading-relaxed">
              Receive background notifications when this tab is not focused.
            </p>
          </div>
        )}
        {permission === 'denied' && (
          <div className="rounded p-2.5 border-2 border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs">
            <span className="font-semibold text-red-700 dark:text-red-400">🔕 Blocked</span>
            <p className="mt-1 text-[var(--theme-elevation-600)] m-0 leading-relaxed">
              Notifications are blocked. To receive order alerts, re-enable notifications in your browser site settings.
            </p>
          </div>
        )}
        {permission === 'granted' && (
          <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
            <span>✓ On</span>
            <span className="text-[var(--theme-elevation-600)] font-normal">
              (Browser notifications enabled)
            </span>
          </div>
        )}
      </section>

      {/* 2. Sound */}
      <section className="flex flex-col gap-4 pt-4 border-t border-[var(--theme-elevation-150)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-elevation-500)] m-0">
          Sound
        </h3>

        {/* On/off toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Sound alerts</span>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              OUTLINE_BUTTON_CLASSES,
              'px-3 py-1 text-xs',
              soundEnabled
                ? 'bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-200'
                : 'bg-[var(--theme-elevation-100)] text-[var(--theme-elevation-600)]',
            )}
          >
            {soundEnabled ? '🔔 Sound on' : '🔕 Sound off'}
          </button>
        </div>

        {/* Tap to enable sound prompt */}
        {soundEnabled && !soundReady && (
          <button
            type="button"
            onClick={() => void enableSound()}
            className={cn(
              OUTLINE_BUTTON_CLASSES,
              'w-full py-2 text-xs bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-800 animate-pulse font-bold',
            )}
            title="Browser audio is suspended. Click to enable sound alerts."
          >
            Tap to enable sound
          </button>
        )}

        {/* Volume: 3-way segmented control */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--theme-elevation-700)]">Volume</span>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-[var(--theme-elevation-100)] border border-[var(--theme-elevation-300)]">
            {VOLUME_LEVELS.map((lvl) => {
              const isSelected = soundLevel === lvl.id
              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={!soundEnabled}
                  onClick={() => void handleSetVolume(lvl.id)}
                  className={cn(
                    'py-1.5 text-xs font-semibold rounded transition-all cursor-pointer text-center',
                    isSelected
                      ? 'bg-[var(--theme-elevation-0)] text-[var(--theme-elevation-900)] border border-[var(--theme-elevation-1000)] shadow-[2px_2px_0px_0px_var(--theme-elevation-1000)]'
                      : 'text-[var(--theme-elevation-600)] hover:text-[var(--theme-elevation-900)] border border-transparent',
                    !soundEnabled && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {lvl.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Alert tone picker */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--theme-elevation-700)]">Alert tone</span>
          <div className="flex flex-col gap-2">
            {TONE_OPTIONS.map((opt) => {
              const isSelected = tone === opt.id
              return (
                <div
                  key={opt.id}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-md border text-xs transition-colors gap-2',
                    isSelected
                      ? 'border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-50)] shadow-[2px_2px_0px_0px_var(--theme-elevation-1000)]'
                      : 'border-[var(--theme-elevation-200)] bg-[var(--theme-elevation-0)] hover:bg-[var(--theme-elevation-50)]',
                  )}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                    <input
                      type="radio"
                      name="alert-tone"
                      value={opt.id}
                      checked={isSelected}
                      disabled={!soundEnabled}
                      onChange={() => setTone(opt.id)}
                      className="cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--theme-elevation-900)]">{opt.label}</span>
                      <span className="text-[11px] text-[var(--theme-elevation-600)]">
                        {opt.description}
                      </span>
                    </div>
                  </label>
                  <button
                    type="button"
                    disabled={!soundEnabled}
                    onClick={() => void handlePreviewTone(opt.id)}
                    className={cn(
                      OUTLINE_BUTTON_CLASSES,
                      'px-2.5 py-1 text-xs shrink-0',
                      !soundEnabled && 'opacity-50 cursor-not-allowed',
                    )}
                    title={`Preview ${opt.label} tone`}
                    aria-label={`Preview ${opt.label} tone`}
                  >
                    ▶
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chime even when visible */}
        <div className="pt-2 border-t border-[var(--theme-elevation-150)]">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={chimeWhenVisible}
              onChange={(e) => setChimeWhenVisible(e.target.checked)}
              className="mt-0.5 rounded border-[var(--theme-elevation-1000)] cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--theme-elevation-900)]">
                Chime even when this screen is visible
              </span>
              <span className="text-[11px] text-[var(--theme-elevation-600)] mt-0.5 leading-relaxed">
                Turn on for an unattended screen on a stand.
              </span>
            </div>
          </label>
        </div>
      </section>

      {/* 3. Ring until accepted */}
      <section className="flex flex-col gap-2 pt-4 border-t border-[var(--theme-elevation-150)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-elevation-500)] m-0">
          Ring until accepted
        </h3>
        <div className="p-3 rounded-md border-2 border-[var(--theme-elevation-1000)] bg-[var(--theme-elevation-50)] shadow-[2px_2px_0px_0px_var(--theme-elevation-1000)]">
          <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[var(--theme-elevation-900)]">
                Repeat alert until acted on
              </span>
              <span className="text-xs text-[var(--theme-elevation-600)] mt-1 leading-relaxed">
                Repeats the alert tone every few seconds until you act on a new order. Best paired with the Ring tone on an always-on kitchen screen.
              </span>
            </div>
            <input
              type="checkbox"
              checked={loopEnabled}
              onChange={(e) => setLoopEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--theme-elevation-1000)] cursor-pointer shrink-0"
            />
          </label>
        </div>
      </section>
    </div>
  )
}

export default NotificationSettingsPanel
