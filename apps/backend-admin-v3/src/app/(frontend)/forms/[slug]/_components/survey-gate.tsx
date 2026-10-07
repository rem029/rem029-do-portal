'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Form } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { FormRenderer } from '../../_components/form-renderer'
import { t, type Language } from '@/utilities/translations'
import { validateSurveyCodeAction, submitSurveyAction } from './survey-actions'

/**
 * The only data the server sends to the client before a valid code is proven — deliberately
 * excludes `fields`/`layout` (the survey's questions). Kept in sync with the shell object
 * `forms/[slug]/page.tsx` builds for `is_survey` forms.
 */
export interface SurveyFormShell {
  id: string
  slug: string
  title: string
  theme?: Form['theme']
  header_image?: Form['header_image']
  background_image?: Form['background_image']
  available_languages?: Form['available_languages']
}

interface SurveyGateProps {
  shell: SurveyFormShell
}

/**
 * The respondent's validated code, remembered per-survey so a refresh or an accidental tab close
 * doesn't force them to dig the code out of their email again. It is cleared the moment it stops
 * working — a completed submission, an expired session, or a re-check that no longer passes — so
 * a spent code never lingers to auto-fail on the next visit. Wrapped in try/catch throughout:
 * private-mode browsers and locked-down kiosks throw on access.
 */
const storedCodeKey = (slug: string) => `doha:survey-code:${slug}`

const readStoredCode = (slug: string): string | null => {
  try {
    return window.localStorage.getItem(storedCodeKey(slug))
  } catch {
    return null
  }
}

const writeStoredCode = (slug: string, code: string): void => {
  try {
    window.localStorage.setItem(storedCodeKey(slug), code)
  } catch {
    /* storage unavailable — the code just won't be remembered, which is fine */
  }
}

const clearStoredCode = (slug: string): void => {
  try {
    window.localStorage.removeItem(storedCodeKey(slug))
  } catch {
    /* nothing to clean up if storage is unavailable */
  }
}

// Keeps `?scode=` in the address bar in sync with the validated code, so the language switcher's
// `router.push(?lang=…)` (which remounts the gate) carries the code along even without storage.
const syncScodeParam = (code: string | null): void => {
  const url = new URL(window.location.href)
  if (code) url.searchParams.set('scode', code)
  else url.searchParams.delete('scode')
  if (url.href !== window.location.href) window.history.replaceState(null, '', url)
}

const resolveImageUrl = (
  image: SurveyFormShell['header_image'] | SurveyFormShell['background_image'],
): string | null => {
  if (image && typeof image === 'object') {
    return image.url || `/api/media/file/${image.filename}`
  }
  return null
}

export const SurveyGate: React.FC<SurveyGateProps> = ({ shell }) => {
  const searchParams = useSearchParams()
  const scodeParam = searchParams.get('scode') || ''
  const langParam = searchParams.get('lang')
  // Same fallback order as FormRenderer's own `language` state.
  const lang = (langParam || shell.available_languages?.[0] || 'en').toLowerCase() as Language

  const [code, setCode] = useState(scodeParam)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validated, setValidated] = useState<{
    form: Form
    token: string
    code: string
    lockedDepartmentId?: string
  } | null>(null)
  // True from first paint until the mount effect decides there is nothing to auto-resolve (no
  // `?scode=`, no remembered code) or an auto-validation finishes. Holding the gate view back
  // during this window is what stops the gate → form flash on every return visit.
  const [isResolving, setIsResolving] = useState(true)
  const autoValidatedRef = useRef(false)

  const theme = shell.theme || 'dohaoasis-new'
  const backgroundImage = resolveImageUrl(shell.background_image)
  const headerImage = resolveImageUrl(shell.header_image)

  const runValidate = useCallback(
    async (submittedCode: string) => {
      const trimmed = submittedCode.trim()
      if (!trimmed) {
        setError(t('Please enter your invitation code.', lang))
        return
      }

      setIsLoading(true)
      setError(null)

      // Update the URL before the server action, not after: Next turns replaceState into a router
      // RESTORE, and one landing while an action is still pending leaves the form's first server
      // actions (e.g. department options) stuck forever.
      const previousScode = new URL(window.location.href).searchParams.get('scode')
      syncScodeParam(trimmed)

      const res = await validateSurveyCodeAction({
        code: trimmed,
        formId: shell.id,
        locale: langParam === 'ar' ? 'ar' : langParam === 'en' ? 'en' : undefined,
      })

      setIsLoading(false)

      if (!res.success || !res.form || !res.token) {
        // Never clear the remembered code here. The server masks throttling, DB blips and a
        // genuinely spent code behind one identical error, so a failure at this step is not
        // proof the code is dead — dropping it would let one rate-limited corporate IP wipe
        // every colleague's valid code. A truly spent code is caught unambiguously at submit
        // time (`reason` below); until then it just costs one silent retry per visit.
        // The server only ever returns one masked error here, so show it in the page language.
        setError(t('Invalid or expired code.', lang))
        syncScodeParam(previousScode)
        return
      }

      writeStoredCode(shell.slug, trimmed)
      setValidated({
        form: res.form,
        token: res.token,
        code: trimmed,
        lockedDepartmentId: res.lockedDepartmentId,
      })
    },
    [shell.id, shell.slug, langParam, lang],
  )

  // On mount, resolve the code once: an explicit `?scode=` link wins; otherwise fall back to a
  // code this browser validated on a previous visit. `isResolving` gates the gate view until
  // this settles so a remembered code never flashes the gate before the form.
  useEffect(() => {
    if (autoValidatedRef.current) return
    autoValidatedRef.current = true

    const auto = scodeParam || readStoredCode(shell.slug)
    if (!auto) {
      setIsResolving(false)
      return
    }

    if (!scodeParam) setCode(auto)
    runValidate(auto).finally(() => setIsResolving(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runValidate(code)
  }

  const handleReenterCode = useCallback(() => {
    // The respondent explicitly asked to switch codes — forget the remembered one so a reload,
    // or the next person on a shared device, starts from the gate.
    clearStoredCode(shell.slug)
    syncScodeParam(null)
    setValidated(null)
    setError(null)
    setCode('')
  }, [shell.slug])

  if (validated) {
    const validatedForm = validated.form
    const validatedHeaderImage = resolveImageUrl(validatedForm.header_image)
    const validatedBackgroundImage = resolveImageUrl(validatedForm.background_image)

    // Every invitee for this survey lands on the same `form.slug` — scope the renderer's draft
    // persistence to this invitation's own code so two different codes used on the same shared
    // device (e.g. a kiosk) never read or write each other's in-progress answers. Normalized the
    // same way the server compares codes, so re-entering the same code in different casing still
    // resumes the same draft.
    const draftScopeKey = validated.code.toUpperCase()

    // Bound to this gate's own token — never the raw `submitFormAction`, and never re-usable for
    // a different form since the token is single-invitation. Submit time is the one place a code
    // is unambiguously spent, so this is where a remembered code gets forgotten — keyed off the
    // structured `reason`, not the human error string.
    const surveySubmitAction = async (input: {
      form: string
      submissionData: Array<{ field: string; value: string }>
    }) => {
      const result = await submitSurveyAction({
        token: validated.token,
        submissionData: input.submissionData,
      })

      // Success or a permanently-dead code: stop remembering it. `token_expired` is deliberately
      // excluded — the code itself is still good, so a reload (which re-validates the remembered
      // code) silently recovers the session. FormRenderer shows its own "session expired"
      // message; the respondent can also just hit "Use a different code" and re-enter the same
      // one, resuming their draft (persisted under `draftScopeKey`).
      if (result.success || result.reason === 'already_submitted' || result.reason === 'survey_closed') {
        clearStoredCode(shell.slug)
      }

      return result
    }

    return (
      <div
        data-theme={theme}
        className={cn(
          'min-h-screen bg-cover bg-center bg-no-repeat w-full py-10 px-4 max-md:py-2 max-md:px-1',
          !validatedBackgroundImage && 'bg-white',
        )}
        style={
          validatedBackgroundImage
            ? { backgroundImage: `url(${validatedBackgroundImage})`, backgroundAttachment: 'fixed' }
            : {}
        }
      >
        <div className="survey-panel-in container w-full max-w-2xl bg-white mx-auto overflow-hidden rounded-xl">
          <div
            className={cn(
              'flex items-center border-b border-base-200 px-4 py-2.5',
              noah.className,
            )}
          >
            <button
              type="button"
              onClick={handleReenterCode}
              className="group inline-flex items-center gap-2 rounded-md text-sm font-medium text-primary/65 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {t('Use a different code', lang)}
            </button>
          </div>
          <div className="w-full mx-auto text-center">
            {validatedHeaderImage && (
              <div className="overflow-hidden shadow-lg border border-base-200 aspect-video bg-white">
                <img
                  src={validatedHeaderImage}
                  alt={validatedForm.title}
                  className="w-full h-full aspect-video object-cover"
                />
              </div>
            )}
            <h2 className={cn('text-lg! md:text-lg font-bold text-primary p-4 m-0', noah.className)}>
              {validatedForm.title}
            </h2>
          </div>
          <div className={cn(validatedBackgroundImage && 'max-w-3xl mx-auto px-1 pb-2')}>
            <FormRenderer
              form={validatedForm}
              submitAction={surveySubmitAction}
              draftScopeKey={draftScopeKey}
              lockedDepartmentId={validated.lockedDepartmentId}
            />
          </div>
        </div>
      </div>
    )
  }

  // Auto-resolving a `?scode=` link or a remembered code — hold on a quiet themed placeholder so
  // the gate never flashes in front of the form it's about to become.
  if (isResolving) {
    return (
      <div
        data-theme={theme}
        className={cn(
          'min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat',
          !backgroundImage && 'bg-white',
        )}
        style={
          backgroundImage
            ? { backgroundImage: `url(${backgroundImage})`, backgroundAttachment: 'fixed' }
            : {}
        }
      >
        <span
          className="loading loading-spinner loading-lg text-primary"
          role="status"
          aria-label={t('Loading survey', lang)}
        />
      </div>
    )
  }

  return (
    <div
      data-theme={theme}
      className={cn(
        'min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat',
        !backgroundImage && 'bg-white',
      )}
      style={
        backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundAttachment: 'fixed' } : {}
      }
    >
      <div className="survey-panel-in card bg-base-100 shadow-2xl max-w-md w-full p-8 border border-base-200">
        <div className="flex flex-col gap-6 items-center text-center">
          {headerImage && (
            <div className="overflow-hidden shadow-lg border border-base-200 aspect-video bg-white w-full">
              <img src={headerImage} alt={shell.title} className="w-full h-full aspect-video object-cover" />
            </div>
          )}
          <h1 className={cn('text-xl md:text-lg font-normal text-primary', noah.className)}>{shell.title}</h1>
          <p className="text-base-content/70 leading-relaxed text-sm">
            {t('This is a survey. Enter the invitation code from your email to continue.', lang)}
          </p>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABC123-A1"
              maxLength={13}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="input input-bordered input-lg w-full text-center tracking-[0.3em] uppercase"
              disabled={isLoading}
            />
            {error && (
              <div role="alert" className="alert alert-error text-sm">
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : t('Continue', lang)}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
