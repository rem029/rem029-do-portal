import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { notFound } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import WorkflowFrontend from '@/common/components/workflow-frontend'
import { processWorkflowAction, uploadAttachmentAction } from '../actions'
import { noah, poppinsNormal } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { Form, FormSubmission, User, UsersAccess } from '@/payload-types'
import { FormRenderer } from '../../../_components/form-renderer'
import { FormAuthWrapper } from '@/common/components/form-auth-wrapper'
import SubmissionLoginSection from '../login-section'
import UnauthorizedSection from '../unauthorized-section'
import { SubmissionDataItems } from './submission-data-items'
import { SubmissionCreator } from './submission-creator'
import { getWorkflowStateV1 } from '../_lib/workflow-state-v1'

const SLUG = 'form-submissions'

export async function SubmissionReviewV1({ id, token }: { id: string; token?: string }) {
  const payload = await getPayload({ config: configPromise })

  const doc = await payload.findByID({
    collection: SLUG,
    id,
    overrideAccess: true,
    depth: 2,
  })
  if (!doc) return notFound()

  const headersList = await getHeaders()
  const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

  const form = doc.form && typeof doc.form === 'object' ? (doc.form as Form) : null

  const state = getWorkflowStateV1(doc as FormSubmission, token, user)

  const {
    reviews,
    currentStepSlug,
    workflowStatus,
    isReviewer,
    isCreator,
    canResubmit,
    isRejectedNotCreator,
    isRejectedNotLoggedIn,
    effectiveTokenValid,
    authorizedEmail,
    tokenOwnerCapabilities,
  } = state

  // Authorization check
  let isAuthorized = false
  const isAuthenticated = !!user

  if (user) {
    if (user.super_user) {
      isAuthorized = true
    } else {
      const fullUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 2,
        overrideAccess: true,
      })

      let hasRequiredAccess = true
      if (form?.requires_auth && form?.required_access) {
        const accessObj =
          fullUser?.access && typeof fullUser.access === 'object'
            ? (fullUser.access as UsersAccess)
            : null
        const accessEntries = accessObj?.access || []
        hasRequiredAccess = accessEntries.some(
          (a) => a.slug === form.required_access && a.read === true,
        )
      }

      isAuthorized = (isCreator || isReviewer) && hasRequiredAccess
    }
  }

  const formTitle = form?.title || 'Form Submission'

  const initialData = (doc.submissionData || []).map((item) => ({
    field: item.field,
    value: String(item.value || ''),
  }))

  const previousSubmission = (doc as any).previous_submission
  const previousSubmissionId =
    typeof previousSubmission === 'object' ? previousSubmission?.id : previousSubmission

  // V1 server actions — operate directly on the form-submission document
  const handleSubmitAction = async (data: {
    response: 'approved' | 'rejected' | 'acknowledged' | 'skipped' | 'auto_completed'
    comments: string
    signature: string
    attachments: string[]
    customFieldResponses?: Array<{ name: string; label: string; value: string }>
  }) => {
    'use server'
    const result = await processWorkflowAction({ id, token: token!, ...data })
    if (!result.success) throw new Error(result.error)
  }

  const handleUploadAction = async (formData: FormData) => {
    'use server'
    return await uploadAttachmentAction(id, token!, formData)
  }

  return (
    <FormAuthWrapper
      requiresAuth={!effectiveTokenValid}
      isAuthenticated={isAuthenticated}
      isAuthorized={isAuthorized}
      hideBackground={true}
    >
      <div
        data-theme="dohaoasis-new"
        className={cn(
          'min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center',
          poppinsNormal.className,
        )}
      >
        <div className="max-w-[1920px] w-full flex flex-row gap-2 justify-center items-start">
          <div className="flex-1 card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-8 sm:p-4 gap-4">
              {/* Header */}
              <div className="border-b border-base-200 pb-8">
                <h1
                  className={cn(
                    'text-2xl font-extrabold tracking-tight text-secondary',
                    noah.className,
                  )}
                >
                  {formTitle}
                </h1>
                <div className="flex flex-col gap-2 text-base-content/70 text-xs opacity-75">
                  <p className="m-0!">Review form submission #</p>
                  <p className="m-0!">{id}</p>
                </div>
              </div>

              {/* Status and date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base-content/70">Status:</span>
                  <span
                    className={cn(
                      'badge badge-dash badge-info font-bold uppercase',
                      workflowStatus === 'completed' && 'badge-success!',
                      workflowStatus === 'rejected' && 'badge-error!',
                    )}
                  >
                    {workflowStatus?.replace('_', ' ') || 'Draft'}
                  </span>
                </div>
                <span className="text-sm text-base-content/60">
                  Submitted:{' '}
                  {new Date(doc.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
              </div>

              {/* Previous Submission Link (if this is a resubmission) */}
              {previousSubmissionId && (
                <div className="border border-base-200 rounded-lg p-4 bg-base-50 flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <div>
                    <p
                      className={cn(
                        'text-xs font-bold text-primary/70 uppercase tracking-wider',
                        noah.className,
                      )}
                    >
                      Previous Submission
                    </p>
                    <a
                      href={`/forms/submissions/${previousSubmissionId}`}
                      className="text-sm text-secondary hover:underline font-medium"
                    >
                      View rejected submission #{previousSubmissionId}
                    </a>
                  </div>
                </div>
              )}

              {/* Submission data */}
              <SubmissionDataItems doc={doc as FormSubmission} form={form} payload={payload} />

              {/* Submitted by */}
              <SubmissionCreator doc={doc as FormSubmission} />

              {/* Workflow review section for Mobile */}
              <div className="max-lg:block hidden w-full">
                <WorkflowFrontend
                  slug={SLUG}
                  docId={id}
                  docData={doc}
                  reviews={reviews}
                  currentStepSlug={currentStepSlug}
                  onSubmit={handleSubmitAction}
                  onUpload={handleUploadAction}
                  isTokenValid={effectiveTokenValid}
                  isReviewer={isReviewer}
                  workflowStatus={workflowStatus}
                  tokenOwnerCapabilities={tokenOwnerCapabilities}
                  authorizedEmail={authorizedEmail}
                />
              </div>

              {/* Resubmit section — visible to the creator when submission is rejected */}
              {canResubmit && form && (
                <div className="mt-10">
                  <div className="border-t border-base-200 pt-8">
                    <div className={cn('flex items-center gap-2 mb-1', noah.className)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-warning"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <h2 className="text-xl font-bold text-warning">
                        This submission was rejected
                      </h2>
                    </div>
                    <p className="text-sm text-base-content/60 mb-6">
                      You can update your answers below and resubmit. This will create a new
                      submission linked to this one.
                    </p>
                    <div className="card bg-base-100 border border-warning/30 shadow-md">
                      <div className="card-body p-6">
                        <h3 className={cn('text-lg font-bold text-primary mb-4', noah.className)}>
                          Update &amp; Resubmit
                        </h3>
                        <FormRenderer
                          form={form}
                          user={user}
                          initialData={initialData}
                          originalSubmissionId={id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Not authorized: logged in but not the creator */}
              {isRejectedNotCreator && <UnauthorizedSection />}

              {/* Not logged in: show login section */}
              {isRejectedNotLoggedIn && <SubmissionLoginSection />}
            </div>
          </div>

          {/* Workflow review section for Desktop */}
          <div className="max-lg:hidden card bg-base-100 shadow-xl border border-base-200 flex-[0.5] h-full">
            <div className="card-body p-4 sm:p-4">
              <WorkflowFrontend
                slug={SLUG}
                docId={id}
                docData={doc}
                reviews={reviews}
                currentStepSlug={currentStepSlug}
                onSubmit={handleSubmitAction}
                onUpload={handleUploadAction}
                isTokenValid={effectiveTokenValid}
                isReviewer={isReviewer}
                workflowStatus={workflowStatus}
                tokenOwnerCapabilities={tokenOwnerCapabilities}
                authorizedEmail={authorizedEmail}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-base-content/40 text-xs">
          <p>&copy; {new Date().getFullYear()} Doha Oasis Admin System. All rights reserved.</p>
        </div>
      </div>
    </FormAuthWrapper>
  )
}
