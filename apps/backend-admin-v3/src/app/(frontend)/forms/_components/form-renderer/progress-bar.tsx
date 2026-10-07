'use client'

import React from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { MultiStep } from './helpers'
import { t, type Language } from '@/utilities/translations'

export const StepProgressBar: React.FC<{
  steps: MultiStep[]
  currentStep: number
  isReview: boolean
  language?: string
}> = ({ steps, currentStep, isReview, language }) => {
  const lang = language as Language
  const total = steps.length + 1
  const active = isReview ? total - 1 : currentStep

  return (
    <div className="w-full mb-6">
      <div className="flex items-start justify-between mb-3 gap-1">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 min-w-0 flex-1">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0',
                idx < active
                  ? 'bg-primary text-primary-content'
                  : idx === active
                    ? 'bg-primary text-primary-content ring-2 ring-primary ring-offset-2'
                    : 'bg-base-300 text-base-content/40',
              )}
            >
              {idx < active ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                'text-[10px] text-center leading-tight w-full max-w-[64px] break-words',
                idx <= active ? 'text-primary font-semibold' : 'text-base-content/40',
              )}
            >
              {step.label}
            </span>
          </div>
        ))}

        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0',
              isReview
                ? 'bg-primary text-primary-content ring-2 ring-primary ring-offset-2'
                : 'bg-base-300 text-base-content/40',
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <span
            className={cn(
              'text-[10px] text-center leading-tight',
              isReview ? 'text-primary font-semibold' : 'text-base-content/40',
            )}
          >
            {t('Review', lang)}
          </span>
        </div>
      </div>

      <div className="relative h-1.5 bg-base-300 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(active / (total - 1)) * 100}%` }}
        />
      </div>

      <p className={cn('text-xs text-base-content/50 text-right', noah.className)}>
        {isReview ? t('Review & Submit', lang) : `${t('Step', lang)} ${active + 1} ${t('of', lang)} ${steps.length}`}
      </p>
    </div>
  )
}
