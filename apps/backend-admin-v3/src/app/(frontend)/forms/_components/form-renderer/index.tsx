'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Form } from '@/payload-types'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { lexicalToHtml } from '@/utilities/lexical-converter'
import { addAnalyticsAction } from '@/common/actions/analytics'
import { submitFormAction, resubmitFormAction } from './actions'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { User } from '@/payload-types'
import {
  evaluateCondition,
  calculateIndices,
  getMissingRequiredFields,
  getHighlightedCountMessage,
  buildFieldErrors,
  scrollToFirstInvalidField,
  isFieldFilled,
  partitionForReview,
  computeInitialListCounts,
  collectHiddenFieldNames,
  MultiStep,
} from './helpers'
import { RecursiveFields } from './recursive-fields'
import { ReviewScreen } from './review-screen'
import { FormIdContext, LockedDepartmentContext } from './form-id-context'
import { MultiStepFormRenderer } from './multi-step-renderer'
import { useLocalStorage } from '@/common/hooks/use-local-storage'
import { t, type Language } from '@/utilities/translations'

/**
 * Signature `submitFormAction` already matches. Surveys pass a `submitSurveyAction` wrapper here
 * instead — see `forms/[slug]/_components/survey-gate.tsx` — so this renderer never has to know
 * whether it's submitting a regular form or a code-gated survey response.
 */
export type FormSubmitAction = (input: {
  form: string
  submissionData: Array<{ field: string; value: string }>
}) => Promise<{ success: boolean; error?: string; data?: unknown }>

interface FormRendererProps {
  form: Form
  user?: User | null
  initialData?: Array<{ field: string; value: string }>
  originalSubmissionId?: string
  readOnly?: boolean
  /** Overrides the default `submitFormAction` call. Survey submissions are never resubmitted,
   * so this only ever affects the plain-submit path, not `resubmitFormAction`. */
  submitAction?: FormSubmitAction
  /**
   * Extra scope for the localStorage draft key, beyond `form.slug`. Survey forms all share one
   * slug (`/pv3/forms/<slug>`) across every invitee, so on a shared/kiosk device two different
   * respondents' codes would otherwise read and write the exact same `form-field-<slug>` draft.
   * `survey-gate.tsx` passes the (normalized) invitation code here; non-survey callers omit it
   * and get the pre-existing slug-only key unchanged.
   */
  draftScopeKey?: string
  /** Department set by the survey invitation: pre-selected and locked on `survey-department`. */
  lockedDepartmentId?: string
}

interface LanguageSwitcherProps {
  language: string
  allowedLanguagesLower: string[]
  pathname: string
  searchParams: URLSearchParams
  router: ReturnType<typeof useRouter> | null
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  allowedLanguagesLower,
  pathname,
  searchParams,
  router,
}) => {
  if (allowedLanguagesLower.length <= 1) return null

  const switchLanguage = (lang: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', lang)
    router?.push(`${pathname}?${params.toString()}`)
    const details = document.querySelector('details.dropdown') as HTMLDetailsElement
    if (details) details.open = false
  }

  return (
    <div className="flex justify-end p-2">
      <details className="dropdown dropdown-end">
        <summary className="btn btn-sm btn-ghost gap-2 bg-base-100/80 backdrop-blur border border-base-200 hover:bg-base-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 opacity-70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 9.97 9.273 13.934 5.925 15.5"
            />
          </svg>
          <span className="text-xs uppercase font-bold">{language}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="menu menu-sm dropdown-content mt-1 p-2 shadow-2xl bg-base-100 rounded-xl w-32 border border-base-200">
          {allowedLanguagesLower.includes('en') && (
            <li>
              <button
                type="button"
                className={cn(language === 'en' && 'active')}
                onClick={() => switchLanguage('en')}
              >
                English
              </button>
            </li>
          )}
          {allowedLanguagesLower.includes('ar') && (
            <li>
              <button
                type="button"
                className={cn(language === 'ar' && 'active font-arabic')}
                onClick={() => switchLanguage('ar')}
              >
                العربية
              </button>
            </li>
          )}
        </ul>
      </details>
    </div>
  )
}

const FormRendererInner: React.FC<FormRendererProps> = ({
  form,
  user,
  initialData,
  originalSubmissionId,
  readOnly = false,
  submitAction,
  draftScopeKey,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [canAcceptTerms, setCanAcceptTerms] = useState(false)
  const termsRef = React.useRef<HTMLDivElement>(null)
  const [router, setRouter] = useState<ReturnType<typeof useRouter> | null>(null)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [isReview, setIsReview] = useState(false)

  const allowedLanguagesLower = useMemo(() => {
    const langs = (form as any).available_languages
    if (!langs || langs.length === 0) return ['en']
    return langs.map((l: string) => l.toLowerCase())
  }, [form])

  const nativeRouter = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const langParam = searchParams.get('lang')

  // Server-provided data (resubmit/edit) always wins, and drafts aren't persisted for
  // preview, read-only, or resubmission views.
  const skipFieldPersistence = readOnly || isPreview || !!originalSubmissionId
  // Survey forms all render at the same `form.slug` regardless of which invitee is answering, so
  // the draft key must fold in `draftScopeKey` (the invitation code) to keep one respondent's
  // in-progress answers from bleeding into another's on a shared device. Non-survey callers don't
  // pass it, so their key is unchanged from before.
  const storageKeyBase = draftScopeKey ? `${form.slug}__${draftScopeKey}` : form.slug
  const [fields, setFields, clearPersistedFields] = useLocalStorage<
    Record<string, string | boolean | number>
  >(
    `form-field-${storageKeyBase}`,
    () => {
      if (!initialData) return {}
      return Object.fromEntries(initialData.map((item) => [item.field, item.value]))
    },
    { disabled: skipFieldPersistence },
  )

  const [listCounts, setListCounts, clearPersistedListCounts] = useLocalStorage<
    Record<string, number>
  >(`form-field-${storageKeyBase}-list-counts`, {}, { disabled: skipFieldPersistence })

  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlLang = new URLSearchParams(window.location.search).get('lang')
      if (urlLang) return urlLang.toLowerCase()
    }
    const langs = (form as any).available_languages
    if (langs && langs.length > 0) return langs[0].toLowerCase()
    return 'en'
  })

  const lang = language as Language

  const [currentForm, setCurrentForm] = useState<Form>(form)
  const [isFetchingLocale, setIsFetchingLocale] = useState(false)

  useEffect(() => {
    if (langParam && allowedLanguagesLower.includes(langParam.toLowerCase())) {
      setLanguage(langParam.toLowerCase())
    }
  }, [langParam, allowedLanguagesLower])

  useEffect(() => {
    setRouter(nativeRouter)
  }, [nativeRouter])

  useEffect(() => {
    if (!isPreview) {
      addAnalyticsAction({
        eventType: 'page_view',
        path: pathname,
        additionalData: { formId: form.id, formTitle: form.title },
      }).catch(console.error)
    }
  }, [pathname, isPreview, form.id, form.title])

  const fieldIndices = useMemo(() => {
    return calculateIndices(
      currentForm.fields || [],
      fields,
      (currentForm as any).show_sequence_number !== false,
    )
  }, [currentForm.fields, fields, currentForm.show_sequence_number])

  useEffect(() => {
    setIsFetchingLocale(true)
    setCurrentForm(form)
    setIsFetchingLocale(false)
  }, [form])

  useEffect(() => {
    if (currentForm.has_terms && termsRef.current) {
      const { scrollHeight, clientHeight } = termsRef.current
      if (scrollHeight <= clientHeight) {
        setCanAcceptTerms(true)
      }
    }
  }, [currentForm.has_terms, currentForm.terms_content])

  const handleChange = (name: string, value: string | boolean | number) => {
    setFields((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name] && isFieldFilled(value)) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
      const remainingCount = Object.keys(fieldErrors).filter((k) => k !== name).length
      if (remainingCount === 0) {
        setError(null)
        setStatus('idle')
      } else {
        setError(getHighlightedCountMessage(remainingCount, lang))
      }
    } else if (error && Object.keys(fieldErrors).length === 0) {
      setError(null)
    }
  }

  // A field nested behind a conditional keeps its last value in state even after the
  // conditional hides it (the renderer just stops mounting it) — flip the trigger back
  // and the stale value reappears, which is wrong for required-field validation and for
  // any conditional further down the chain that reads that stale value. Clear hidden
  // fields back out whenever visibility changes; this reruns (and cascades) each time a
  // clear itself changes `fields`, until nothing hidden still holds a value.
  useEffect(() => {
    if (readOnly) return
    const hiddenFieldNames = collectHiddenFieldNames(currentForm.fields || [], fields, listCounts)
    if (hiddenFieldNames.length === 0) return

    setFields((prev) => {
      let changed = false
      const next = { ...prev }
      for (const name of hiddenFieldNames) {
        if (next[name] !== undefined) {
          delete next[name]
          changed = true
        }
      }
      return changed ? next : prev
    })

    setFieldErrors((prev) => {
      let changed = false
      const next = { ...prev }
      for (const name of hiddenFieldNames) {
        if (next[name]) {
          delete next[name]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [currentForm.fields, fields, listCounts, readOnly, setFields])

  const handleScroll = () => {
    if (termsRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = termsRef.current
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setCanAcceptTerms(true)
      }
    }
  }

  const handleReview = () => {
    setError(null)

    if (currentForm.requires_auth && !user) {
      setError(t('You must be logged in to submit this form.', lang))
      setStatus('error')
      return
    }

    if (currentForm.has_terms && !termsAccepted) {
      setError(t('Please accept the Terms and Conditions to continue.', lang))
      setStatus('error')
      return
    }

    if (Object.values(uploading).some(Boolean)) {
      setError(t('Please wait for files to finish uploading.', lang))
      setStatus('error')
      return
    }

    const missing = getMissingRequiredFields(currentForm.fields || [], fields, listCounts)
    if (missing.length > 0) {
      setFieldErrors(buildFieldErrors(missing, lang))
      setError(getHighlightedCountMessage(missing.length, lang))
      setStatus('error')
      scrollToFirstInvalidField(missing[0].name)
      return
    }

    setFieldErrors({})
    setStatus('idle')
    setIsReview(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    if (currentForm.requires_auth && !user) {
      setError(t('You must be logged in to submit this form.', lang))
      setStatus('error')
      return
    }

    if (currentForm.has_terms && !termsAccepted) {
      setError(t('Please accept the Terms and Conditions to submit.', lang))
      setStatus('error')
      return
    }

    if (Object.values(uploading).some(Boolean)) {
      setError(t('Please wait for files to finish uploading.', lang))
      setStatus('error')
      return
    }

    const missing = getMissingRequiredFields(currentForm.fields || [], fields, listCounts)
    if (missing.length > 0) {
      setFieldErrors(buildFieldErrors(missing, lang))
      setError(getHighlightedCountMessage(missing.length, lang))
      setStatus('error')
      scrollToFirstInvalidField(missing[0].name)
      return
    }

    setFieldErrors({})

    const getSubmissionData = (
      fieldsList: any[],
      prefix = '',
    ): { field: string; value: string }[] => {
      let data: { field: string; value: string }[] = []
      fieldsList.forEach((field) => {
        if (field.blockType === 'message') return
        if (field.blockType === 'group' && 'fields' in field && field.fields) {
          const groupPrefix =
            'name' in field && field.name
              ? prefix
                ? `${prefix}${field.name}.`
                : `${field.name}.`
              : ''
          data = [...data, ...getSubmissionData(field.fields, groupPrefix)]
          return
        }
        if ((field as any).blockType === 'list' && 'fields' in field && field.fields) {
          const name = 'name' in field && field.name ? field.name : ''
          const listKey = prefix ? `${prefix}${name}` : name
          const count = listCounts[listKey] ?? 1
          for (let i = 0; i < count; i++) {
            data = [...data, ...getSubmissionData(field.fields, `${listKey}.${i}.`)]
          }
          return
        }
        if (field.blockType === 'conditional' && 'fields' in field && field.fields) {
          if (evaluateCondition(field, fields, prefix)) {
            data = [...data, ...getSubmissionData(field.fields, prefix)]
          }
          return
        }
        const name = 'name' in field ? (field.name as string) : ''
        const fieldName = name ? (prefix ? `${prefix}${name}` : name) : ''
        const val = fields[fieldName]
        data.push({
          field: fieldName,
          value: typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val || ''),
        })
      })
      return data
    }

    const submissionData = getSubmissionData(currentForm.fields || [])

    try {
      let res: { success: boolean; error?: string; data?: any }
      if (originalSubmissionId) {
        res = await resubmitFormAction({ originalSubmissionId, submissionData })
      } else {
        res = await (submitAction ?? submitFormAction)({ form: currentForm.id, submissionData })
      }

      if (!res.success) throw new Error(res.error)

      if (!isPreview) {
        addAnalyticsAction({
          eventType: 'form_submission',
          path: pathname,
          additionalData: {
            formId: currentForm.id,
            formTitle: currentForm.title,
            submissionId: res.data?.id,
          },
        }).catch(console.error)
      }

      setStatus('success')
      clearPersistedFields()
      clearPersistedListCounts()
      if (
        !originalSubmissionId &&
        currentForm.confirmationType === 'redirect' &&
        currentForm.redirect?.url &&
        router
      ) {
        router.push(currentForm.redirect.url)
      } else if (originalSubmissionId && res.data?.id && router) {
        router.push(`/forms/submissions/${res.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const doSubmit = async () => {
    setStatus('loading')
    setError(null)

    if (currentForm.requires_auth && !user) {
      setError(t('You must be logged in to submit this form.', lang))
      setStatus('error')
      return
    }

    if (currentForm.has_terms && !termsAccepted) {
      setError(t('Please accept the Terms and Conditions to submit.', lang))
      setStatus('error')
      return
    }

    if (Object.values(uploading).some(Boolean)) {
      setError(t('Please wait for files to finish uploading.', lang))
      setStatus('error')
      return
    }

    const getSubmissionDataForSubmit = (
      fieldsList: any[],
      prefix = '',
    ): { field: string; value: string }[] => {
      let data: { field: string; value: string }[] = []
      fieldsList.forEach((field) => {
        if (field.blockType === 'message') return
        if (field.blockType === 'multi-step' && field.steps) {
          field.steps.forEach((step: any) => {
            data = [...data, ...getSubmissionDataForSubmit(step.fields || [], prefix)]
          })
          return
        }
        if (field.blockType === 'group' && 'fields' in field && field.fields) {
          const groupPrefix =
            'name' in field && field.name
              ? prefix
                ? `${prefix}${field.name}.`
                : `${field.name}.`
              : ''
          data = [...data, ...getSubmissionDataForSubmit(field.fields, groupPrefix)]
          return
        }
        if ((field as any).blockType === 'list' && 'fields' in field && field.fields) {
          const name = 'name' in field && field.name ? field.name : ''
          const listKey = prefix ? `${prefix}${name}` : name
          const count = listCounts[listKey] ?? 1
          for (let i = 0; i < count; i++) {
            data = [...data, ...getSubmissionDataForSubmit(field.fields, `${listKey}.${i}.`)]
          }
          return
        }
        if (field.blockType === 'conditional' && 'fields' in field && field.fields) {
          if (evaluateCondition(field, fields, prefix)) {
            data = [...data, ...getSubmissionDataForSubmit(field.fields, prefix)]
          }
          return
        }
        const name = 'name' in field ? (field.name as string) : ''
        const fieldName = name ? (prefix ? `${prefix}${name}` : name) : ''
        const val = fields[fieldName]
        data.push({
          field: fieldName,
          value: typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val || ''),
        })
      })
      return data
    }

    const submissionData = getSubmissionDataForSubmit(currentForm.fields || [])

    try {
      let res: { success: boolean; error?: string; data?: any }
      if (originalSubmissionId) {
        res = await resubmitFormAction({ originalSubmissionId, submissionData })
      } else {
        res = await (submitAction ?? submitFormAction)({ form: currentForm.id, submissionData })
      }

      if (!res.success) throw new Error(res.error)

      if (!isPreview) {
        addAnalyticsAction({
          eventType: 'form_submission',
          path: pathname,
          additionalData: {
            formId: currentForm.id,
            formTitle: currentForm.title,
            submissionId: res.data?.id,
          },
        }).catch(console.error)
      }

      setStatus('success')
      clearPersistedFields()
      clearPersistedListCounts()
      if (
        !originalSubmissionId &&
        currentForm.confirmationType === 'redirect' &&
        currentForm.redirect?.url &&
        router
      ) {
        router.push(currentForm.redirect.url)
      } else if (originalSubmissionId && res.data?.id && router) {
        router.push(`/forms/submissions/${res.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const multiStepBlock = (currentForm.fields || []).find((f: any) => f.blockType === 'multi-step')

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-12 max-w-xl mx-auto text-center space-y-6">
        <div className="bg-success/20 p-6 rounded-full inline-flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div
          className="text-lg text-base-content/70 font-Noah-Regular prose prose-primary"
          dangerouslySetInnerHTML={{
            __html: currentForm.confirmationMessage
              ? lexicalToHtml(currentForm.confirmationMessage)
              : t('Your submission has been received successfully.', lang),
          }}
        />
      </div>
    )
  }

  if (isReview && !multiStepBlock && !readOnly) {
    const reviewSections = partitionForReview(currentForm.fields || [], lang)
    return (
      <div
        className={cn(
          'w-full transition-all duration-300 relative p-1',
          language === 'ar' && 'font-arabic',
          isFetchingLocale && 'opacity-50 pointer-events-none',
        )}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <ReviewScreen
          steps={reviewSections}
          allValues={fields}
          listCounts={listCounts}
          onEditStep={() => {
            setIsReview(false)
            setFieldErrors({})
            setError(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSubmit={doSubmit}
          isSubmitting={status === 'loading'}
          error={error}
          submitLabel={currentForm.submitButtonLabel || t('Submit', lang)}
          originalSubmissionId={originalSubmissionId}
          language={language}
        />
      </div>
    )
  }

  if (multiStepBlock && readOnly) {
    const steps: MultiStep[] = ((multiStepBlock as any).steps || []).map((s: any) => ({
      label: s.label || t('Step', lang),
      fields: s.fields || [],
    }))
    return (
      <div
        className={cn(
          'w-full transition-all duration-300 relative p-1',
          language === 'ar' && 'font-arabic',
          isFetchingLocale && 'opacity-50 pointer-events-none',
        )}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <LanguageSwitcher
          language={language}
          allowedLanguagesLower={allowedLanguagesLower}
          pathname={pathname}
          searchParams={searchParams}
          router={router}
        />
        <ReviewScreen
          steps={steps}
          allValues={fields}
          listCounts={listCounts}
          onEditStep={() => {}}
          onSubmit={() => {}}
          isSubmitting={false}
          error={null}
          submitLabel=""
          readOnly={true}
          showNoInputFields={(currentForm as any).show_no_input_fields === true}
          language={language}
        />
      </div>
    )
  }

  if (multiStepBlock && !readOnly) {
    return (
      <div
        className={cn(
          'w-full transition-all duration-300 relative p-1',
          language === 'ar' && 'font-arabic',
          isFetchingLocale && 'opacity-50 pointer-events-none',
        )}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <LanguageSwitcher
          language={language}
          allowedLanguagesLower={allowedLanguagesLower}
          pathname={pathname}
          searchParams={searchParams}
          router={router}
        />
        <MultiStepFormRenderer
          multiStepBlock={multiStepBlock}
          form={currentForm}
          user={user}
          originalSubmissionId={originalSubmissionId}
          values={fields}
          onChange={handleChange}
          uploading={uploading}
          setUploading={setUploading}
          listCounts={listCounts}
          setListCounts={setListCounts}
          fieldIndices={fieldIndices}
          showSequenceNumber={(currentForm as any).show_sequence_number !== false}
          language={language}
          onSubmit={doSubmit}
          submitStatus={status}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full transition-all duration-300 relative p-1',
        language === 'ar' && 'font-arabic',
        isFetchingLocale && 'opacity-50 pointer-events-none',
      )}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <LanguageSwitcher
        language={language}
        allowedLanguagesLower={allowedLanguagesLower}
        pathname={pathname}
        searchParams={searchParams}
        router={router}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 md:p-2 p-1 sm:p-2 rounded-lg bg-base-100 relative"
      >
        {currentForm.has_terms && (
          <div className="card bg-base-100 card-xs shadow-sm border border-base-200 mt-4">
            <div className="card-body gap-4">
              <h2 className={cn('card-title text-primary', noah.className)}>
                {t('Terms and Conditions', lang)}
              </h2>
              <div
                ref={termsRef}
                onScroll={handleScroll}
                className="h-[40vh] md:h-[50vh] overflow-y-auto p-4 bg-base-200/50 rounded-lg border border-base-300 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: lexicalToHtml(currentForm.terms_content) }}
              />
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={!canAcceptTerms || status === 'loading'}
                />
                <span className="label-text text-wrap">{t('I agree to the Terms and Conditions', lang)}</span>
              </label>
            </div>
          </div>
        )}

        {(!currentForm.has_terms || termsAccepted) && (
          <>
            <RecursiveFields
              fieldsList={currentForm.fields || []}
              values={fields}
              fieldErrors={fieldErrors}
              onChange={handleChange}
              disabled={status === 'loading' || readOnly}
              uploading={uploading}
              setUploading={setUploading}
              setError={setError}
              status={status}
              showSequenceNumber={(currentForm as any).show_sequence_number !== false}
              listCounts={listCounts}
              setListCounts={setListCounts}
              fieldIndices={fieldIndices}
              language={language}
              readOnly={readOnly}
              showNoInputFields={(currentForm as any).show_no_input_fields === true}
            />

            {error && (
              <div className="alert alert-error shadow-sm mt-4">
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

            {!readOnly && (
              <button
                type="button"
                onClick={handleReview}
                disabled={status === 'loading'}
                className={cn(
                  'btn btn-primary btn-lg w-full text-white shadow-md hover:shadow-lg transition-all duration-300',
                  noah.className,
                )}
              >
                {t('Review', lang)}
                <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </form>
    </div>
  )
}

export const FormRenderer: React.FC<FormRendererProps> = (props) => (
  <FormIdContext.Provider value={String(props.form.id)}>
    <LockedDepartmentContext.Provider value={props.lockedDepartmentId}>
      <FormRendererInner {...props} />
    </LockedDepartmentContext.Provider>
  </FormIdContext.Provider>
)
