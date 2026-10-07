import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { notFound } from 'next/navigation'
import { getCollectionConfig } from '@/utilities/collection-meta'
import ServiceItemDetails from '@/common/components/service-item-details'
import WorkflowFrontend from '@/common/components/workflow-frontend'
import { processWorkflowAction, uploadAttachmentAction } from './actions'
import { noah, poppinsNormal } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { FormAuthWrapper } from '@/common/components/form-auth-wrapper'
import { User, UsersAccess } from '@/payload-types'

interface PageProps {
  params: Promise<{
    slug: string
    id: string
  }>
  searchParams: Promise<{
    token?: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params
  const payload = await getPayload({ config: configPromise })
  const collectionConfig = getCollectionConfig(slug)

  if (!collectionConfig) return { title: 'Doha Oasis' }

  try {
    const doc = await payload.findByID({
      collection: slug as any,
      id,
      overrideAccess: true,
      depth: 0,
    })

    const docTitle = (doc as any)?.subject || id
    return {
      title: `Doha Oasis | ${collectionConfig.label} | ${docTitle}`,
    }
  } catch (error) {
    return { title: `Doha Oasis | ${collectionConfig.label}` }
  }
}

export default async function ServicePage({ params, searchParams }: PageProps) {
  const { slug, id } = await params
  const { token } = await searchParams

  const payload = await getPayload({ config: configPromise })
  const collectionConfig = getCollectionConfig(slug)

  if (!collectionConfig) {
    return notFound()
  }

  // Fetch document with overrideAccess to bypass MSAL for public view
  // We should be careful about what data we expose here
  const doc = await payload.findByID({
    collection: slug as any,
    id,
    overrideAccess: true,
    depth: 2,
  })

  // Get authenticated user
  const headersList = await getHeaders()
  const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

  // Authorization Check
  let isAuthorized = false
  const isAuthenticated = !!user

  if (user) {
    if (user.super_user) {
      isAuthorized = true
    } else {
      // Fetch full user with access populated
      const fullUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 2,
        overrideAccess: true,
      })

      // Check if user has read access to this collection slug
      const accessObj =
        fullUser?.access && typeof fullUser.access === 'object'
          ? (fullUser.access as UsersAccess)
          : null
      const accessEntries = accessObj?.access || []
      const hasCollectionAccess = accessEntries.some((a) => a.slug === slug && a.read === true)

      // Check if user is the reviewer for the current step
      const reviews = (doc as any).workflow_reviews || []
      const activeReview = reviews.find((r: any) => r.status_slug === (doc as any)._workflow_status)
      const currentReviewer = activeReview?.reviewer && activeReview.reviewer === user.email

      isAuthorized = hasCollectionAccess || currentReviewer
    }
  }

  // Check the provided token validity
  const reviews = doc.workflow_reviews || []
  const activeReview = reviews.find((r: any) => r.status_slug === doc._workflow_status)
  const isReviewer = !!(user && activeReview?.reviewer && activeReview.reviewer === user.email)
  if (activeReview && !activeReview.approver_type) {
    try {
      const settings = await payload.findGlobal({
        slug: collectionConfig.settingsSlug as any,
        overrideAccess: true,
      })
      if (settings?.workflow_slug) {
        const workflows = await payload.find({
          collection: 'workflow',
          where: {
            slug: { equals: settings.workflow_slug },
            operator: {
              equals: typeof doc.operator === 'object' ? (doc.operator as any).id : doc.operator,
            },
          },
          overrideAccess: true,
          limit: 1,
        })
        if (workflows.totalDocs > 0) {
          const workflow = workflows.docs[0]
          reviews.forEach((r: any) => {
            if (!r.approver_type) {
              const step = workflow.steps?.find((s: any) => s.slug === r.status_slug)
              if (step) {
                r.approver_type = step.approver_type
              }
            }
          })
        }
      }
    } catch (e) {
      console.error('Failed to enrich workflow metadata:', e)
    }
  }

  // Check main token validity
  const isMainTokenValid =
    !!token && reviews.some((r: any) => r.status_slug === doc._workflow_status && r.token === token)

  // Check additional reviewer token validity
  const additionalReviewerEntry =
    !isMainTokenValid && token
      ? (() => {
          for (const r of reviews as any[]) {
            if (r.status_slug !== doc._workflow_status) continue
            const additionalTokens: any[] = r.additional_reviewer_tokens || []
            const found = additionalTokens.find((t: any) => t.token === token)
            if (found) return found
          }
          return null
        })()
      : null

  const isTokenValid = isMainTokenValid || !!additionalReviewerEntry

  // Identify the specific email authorized for this session
  const authorizedEmail = isMainTokenValid
    ? (activeReview as any)?.reviewer
    : additionalReviewerEntry
      ? (additionalReviewerEntry as any).email
      : isReviewer
        ? user?.email
        : undefined

  // Build token owner capabilities (used by WorkflowFrontend to restrict available actions)
  const tokenOwnerCapabilities = additionalReviewerEntry
    ? {
        canApprove: !!additionalReviewerEntry.can_approve,
        canReject: !!additionalReviewerEntry.can_reject,
        canAcknowledge: !!additionalReviewerEntry.can_acknowledge,
      }
    : undefined

  const handleSubmitAction = async (data: {
    response: 'approved' | 'rejected' | 'acknowledged' | 'skipped' | 'auto_completed'
    comments: string
    signature: string
    attachments?: string[]
    customFieldResponses?: Array<{ name: string; label: string; value: string }>
  }) => {
    'use server'
    const result = await processWorkflowAction({
      slug,
      id,
      token: token!,
      ...data,
    })

    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const handleUploadAction = async (formData: FormData) => {
    'use server'
    return await uploadAttachmentAction(slug, id, token!, formData)
  }

  return (
    <FormAuthWrapper
      requiresAuth={!isTokenValid}
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
            <div className="card-body p-4 sm:p-4 gap-2">
              <div className="border-b border-base-200 pb-8">
                <h1
                  className={cn(
                    'text-2xl font-extrabold tracking-tight text-secondary',
                    noah.className,
                  )}
                >
                  {collectionConfig.label} Document
                </h1>
                <div className="flex flex-col gap-2 text-base-content/70 text-xs opacity-75">
                  <p className="m-0!">Review and approve document #</p>
                  <p className="m-0!">{id}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base-content/70">Status:</span>
                  <span
                    className={cn(
                      'badge badge-dash badge-info font-bold uppercase',
                      doc.workflow_status === 'completed' && 'badge-success!',
                      doc.workflow_status === 'rejected' && 'badge-error!',
                    )}
                  >
                    {doc.workflow_status?.replace('_', ' ') || 'Draft'}
                  </span>
                </div>
                <span className="text-sm text-base-content/60">
                  Created:{' '}
                  {new Date(doc.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </span>
              </div>

              <ServiceItemDetails
                doc={doc}
                fields={collectionConfig.displayFields.filter((f) => {
                  if (
                    slug === 'notices' &&
                    f.path === 'days_deducted' &&
                    doc.type !== 'salary-deduction'
                  )
                    return false
                  return true
                })}
              />

              <div className="max-lg:block hidden w-full">
                <WorkflowFrontend
                  slug={slug}
                  docId={id}
                  docData={doc}
                  reviews={reviews}
                  currentStepSlug={doc._workflow_status || ''}
                  onSubmit={handleSubmitAction}
                  onUpload={handleUploadAction}
                  isTokenValid={isTokenValid}
                  isReviewer={isReviewer}
                  workflowStatus={doc.workflow_status || ''}
                  tokenOwnerCapabilities={tokenOwnerCapabilities}
                  authorizedEmail={authorizedEmail}
                />
              </div>
            </div>
          </div>

          <div className="max-lg:hidden card bg-base-100 shadow-xl border border-base-200 flex-[0.5] h-full">
            <div className="card-body p-4 sm:p-4">
              <WorkflowFrontend
                slug={slug}
                docId={id}
                docData={doc}
                reviews={reviews}
                currentStepSlug={doc._workflow_status || ''}
                onSubmit={handleSubmitAction}
                onUpload={handleUploadAction}
                isTokenValid={isTokenValid}
                isReviewer={isReviewer}
                workflowStatus={doc.workflow_status || ''}
                tokenOwnerCapabilities={tokenOwnerCapabilities}
                authorizedEmail={authorizedEmail}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-base-content/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Doha Oasis Admin System. All rights reserved.</p>
        </div>
      </div>
    </FormAuthWrapper>
  )
}
