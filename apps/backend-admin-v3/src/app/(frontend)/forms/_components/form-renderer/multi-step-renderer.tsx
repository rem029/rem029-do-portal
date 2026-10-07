'use client'

import React, { useState } from 'react'
import { Form, User } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import {
  MultiStep,
  buildIdSegment,
  getMissingRequiredFields,
  getHighlightedCountMessage,
  buildFieldErrors,
  scrollToFirstInvalidField,
  isFieldFilled,
} from './helpers'
import { RecursiveFields } from './recursive-fields'
import { StepProgressBar } from './progress-bar'
import { ReviewScreen } from './review-screen'
import { t, type Language } from '@/utilities/translations'

export const MultiStepFormRenderer: React.FC<{
  multiStepBlock: any
  form: Form
  user?: User | null
  originalSubmissionId?: string
  values: Record<string, string | boolean | number>
  onChange: (name: string, value: string | boolean | number) => void
  uploading: Record<string, boolean>
  setUploading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  listCounts: Record<string, number>
  setListCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>
  fieldIndices: Record<string, number>
  showSequenceNumber: boolean
  language: string
  onSubmit: () => Promise<void>
  submitStatus: 'idle' | 'loading' | 'success' | 'error'
}> = ({
  multiStepBlock,
  form,
  user,
  originalSubmissionId,
  values,
  onChange,
  uploading,
  setUploading,
  listCounts,
  setListCounts,
  fieldIndices,
  showSequenceNumber,
  language,
  onSubmit,
  submitStatus,
}) => {
  const lang = language as Language

  const steps: MultiStep[] = (multiStepBlock.steps || []).map((s: any) => ({
    label: s.label || t('Step', lang),
    fields: s.fields || [],
  }))

  const [currentStep, setCurrentStep] = useState(0)
  const [isReview, setIsReview] = useState(false)
  const [returnToReview, setReturnToReview] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFieldChange = (name: string, value: string | boolean | number) => {
    if (fieldErrors[name] && isFieldFilled(value)) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
      const remainingCount = Object.keys(fieldErrors).filter((k) => k !== name).length
      if (remainingCount === 0) {
        setStepError(null)
      } else {
        setStepError(getHighlightedCountMessage(remainingCount, lang))
      }
    }
    onChange(name, value)
  }

  const handleNext = () => {
    const missing = getMissingRequiredFields(steps[currentStep]?.fields || [], values, listCounts)
    if (missing.length > 0) {
      setFieldErrors(buildFieldErrors(missing, lang))
      setStepError(getHighlightedCountMessage(missing.length, lang))
      scrollToFirstInvalidField(missing[0].name)
      return
    }
    setFieldErrors({})
    setStepError(null)
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setIsReview(true)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setFieldErrors({})
    setStepError(null)
    if (isReview) {
      setIsReview(false)
      setCurrentStep(steps.length - 1)
    } else if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditFromReview = (idx: number) => {
    setIsReview(false)
    setCurrentStep(idx)
    setReturnToReview(true)
    setFieldErrors({})
    setStepError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveAndReturnToReview = () => {
    const missing = getMissingRequiredFields(steps[currentStep]?.fields || [], values, listCounts)
    if (missing.length > 0) {
      setFieldErrors(buildFieldErrors(missing, lang))
      setStepError(getHighlightedCountMessage(missing.length, lang))
      scrollToFirstInvalidField(missing[0].name)
      return
    }
    setFieldErrors({})
    setStepError(null)
    setReturnToReview(false)
    setIsReview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onSubmit()
    setIsSubmitting(false)
  }

  const noopSetError = (_: string | null) => {}

  if (isReview) {
    return (
      <>
        <StepProgressBar steps={steps} currentStep={currentStep} isReview={true} language={language} />
        <ReviewScreen
          steps={steps}
          allValues={values}
          listCounts={listCounts}
          onEditStep={handleEditFromReview}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || submitStatus === 'loading'}
          error={stepError}
          submitLabel={form.submitButtonLabel || t('Submit', lang)}
          originalSubmissionId={originalSubmissionId}
          language={language}
        />
      </>
    )
  }

  return (
    <>
      <StepProgressBar steps={steps} currentStep={currentStep} isReview={false} language={language} />

      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-base-200">
        <span className="badge badge-primary badge-sm font-bold">{currentStep + 1}</span>
        <h2 className={cn('text-base font-bold text-secondary ', noah.className)}>
          {steps[currentStep]?.label}
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        <RecursiveFields
          fieldsList={steps[currentStep]?.fields || []}
          idPrefix={`${buildIdSegment(undefined, steps[currentStep]?.label)}.`}
          messageIdContext={String(currentStep + 1)}
          values={values}
          fieldErrors={fieldErrors}
          onChange={handleFieldChange}
          disabled={submitStatus === 'loading'}
          uploading={uploading}
          setUploading={setUploading}
          setError={noopSetError}
          status={stepError ? 'error' : 'idle'}
          showSequenceNumber={showSequenceNumber}
          listCounts={listCounts}
          setListCounts={setListCounts}
          fieldIndices={fieldIndices}
          language={language}
          readOnly={false}
        />

        {stepError && (
          <div className="alert alert-error shadow-sm">
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
            <span>{stepError}</span>
          </div>
        )}

        <div className={cn('flex gap-3', currentStep === 0 ? 'justify-end' : 'justify-between')}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className={cn('btn btn-outline btn-md gap-2', noah.className)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('Back', lang)}
            </button>
          )}

          {returnToReview ? (
            <button
              type="button"
              onClick={handleSaveAndReturnToReview}
              className={cn('btn btn-primary btn-md flex-1 gap-2', noah.className)}
            >
              {t('Save & Back to Review', lang)}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className={cn('btn btn-primary btn-md flex-1 gap-2', noah.className)}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  {t('Continue', lang)}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              ) : (
                <>
                  {t('Review', lang)}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
