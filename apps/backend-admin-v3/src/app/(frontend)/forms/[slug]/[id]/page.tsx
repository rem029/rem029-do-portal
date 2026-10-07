import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { notFound } from 'next/navigation'
import { Form, FormSubmission, User, UsersAccess } from '@/payload-types'
import { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { FormContent } from '../_components/form-content'
import React from 'react'

const SLUG = 'form-submissions'

interface PageProps {
  params: Promise<{ slug: string; id: string }>
}

// Recursively walk form field definitions and collect every path that is a `file` block.
// List fields introduce a numeric index in submission paths (e.g. "items.0.photo"),
// so we store the index-stripped version ("items.photo") and normalise submission paths
// the same way before comparing.
function collectFileFieldPaths(fields: any[], prefix = ''): Set<string> {
  const paths = new Set<string>()
  for (const field of fields || []) {
    const name: string = field.name || ''
    const fullPath = prefix ? (name ? `${prefix}.${name}` : prefix) : name

    switch (field.blockType) {
      case 'file':
        if (fullPath) paths.add(fullPath)
        break
      case 'group':
      case 'conditional':
        collectFileFieldPaths(field.fields || [], fullPath).forEach((p) => paths.add(p))
        break
      case 'list':
        // Submission paths for list items look like "listName.0.childField".
        // We store them without the index so normaliseFieldPath() can match them.
        collectFileFieldPaths(field.fields || [], fullPath).forEach((p) => paths.add(p))
        break
      case 'multi-step':
        for (const step of field.steps || []) {
          collectFileFieldPaths(step.fields || [], prefix).forEach((p) => paths.add(p))
        }
        break
    }
  }
  return paths
}

// Strip numeric list indices from a dotted field path so it can be compared
// against paths collected by collectFileFieldPaths.
// "items.0.photo" → "items.photo", "items.2.nested.0.img" → "items.nested.img"
function normaliseFieldPath(path: string): string {
  return path.replace(/\.(\d+)\./g, '.').replace(/\.(\d+)$/, '')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = (await payload.findByID({
      collection: SLUG,
      id,
      overrideAccess: true,
      depth: 1,
    })) as FormSubmission

    const formTitle =
      doc?.form && typeof doc.form === 'object' ? (doc.form as Form).title : 'Form Submission'

    return {
      title: `${formTitle} | Doha Oasis`,
      description: `View submission for ${formTitle}.`,
    }
  } catch {
    return { title: 'Doha Oasis | Public Submission View' }
  }
}

export default async function PublicFormSubmissionPage({ params }: PageProps) {
  const { slug, id } = await params

  const payload = await getPayload({ config: configPromise })

  const doc = (await payload.findByID({
    collection: SLUG,
    id,
    overrideAccess: true,
    depth: 2,
  })) as FormSubmission | null

  if (!doc) return notFound()

  const form = doc.form && typeof doc.form === 'object' ? (doc.form as Form) : null

  // Finding 5: this route is pre-existing and unrelated to the survey code-gate, but it renders
  // a form's full field set plus one submission's answers whenever `enable_public_submission_link`
  // is on — nothing here previously excluded `is_survey` forms. An admin could tick that flag on
  // a survey without realizing it bypasses the entire code-gate/single-use-code system for
  // anyone who obtains (or enumerates) a submission id. Surveys never render here, regardless of
  // `enable_public_submission_link`.
  if (!form || form.slug !== slug || form.is_survey || !(form as any).enable_public_submission_link) {
    return notFound()
  }

  // Build the set of field paths that are file uploads using the form definition as
  // the source of truth — no heuristics needed.
  const fileFieldPaths = collectFileFieldPaths((form.fields || []) as any[])

  // For every submission value whose field is a known file field, replace the raw
  // media ID with the full media document so FormRenderer can display it in readOnly mode.
  const initialData = await Promise.all(
    (doc.submissionData || []).map(async (item) => {
      const normalisedPath = normaliseFieldPath(item.field)

      if (fileFieldPaths.has(normalisedPath) && typeof item.value === 'string' && item.value) {
        try {
          const mediaDoc = await payload.findByID({
            collection: 'forms-media',
            id: item.value,
            depth: 1,
            overrideAccess: true,
          })
          if (mediaDoc) return { field: item.field, value: mediaDoc }
        } catch (_) {
          // value wasn't a valid media ID — fall through and return as string
        }
      }

      return {
        field: item.field,
        value:
          typeof item.value === 'object' && item.value !== null
            ? item.value
            : String(item.value || ''),
      }
    }),
  )

  // Check authentication and authorization
  const headersList = await getHeaders()
  const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }
  const isAuthenticated = !!user
  let isAuthorized = true

  if (form.requires_auth) {
    if (user && form.required_access) {
      const fullUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 2,
        overrideAccess: true,
      })
      const accessObj =
        fullUser?.access && typeof fullUser.access === 'object'
          ? (fullUser.access as UsersAccess)
          : null
      const accessEntries = accessObj?.access || []
      isAuthorized =
        !!fullUser?.super_user ||
        accessEntries.some((a) => a.slug === form.required_access && a.read === true)
    } else if (!user) {
      isAuthorized = false
    }
  }

  return (
    <FormContent
      form={form}
      user={user}
      isAuthenticated={isAuthenticated}
      isAuthorized={isAuthorized}
      initialData={initialData as any}
      readOnly={true}
    />
  )
}
