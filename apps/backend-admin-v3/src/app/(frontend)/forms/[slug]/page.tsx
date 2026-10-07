import { getPayload } from 'payload'
import config from '@/payload.config'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import React from 'react'
import { Form, User, UsersAccess } from '@/payload-types'
import { headers as getHeaders } from 'next/headers'
import { FormContent } from './_components/form-content'
import { FormLive } from './_components/form-live'
import { SurveyGate, SurveyFormShell } from './_components/survey-gate'
import { BASE_PATH } from '@/utilities/constant'

// Forms have no logo/SEO fields of their own, so every form page gets these defaults.
const DEFAULT_SITE_NAME = 'Doha Oasis'
const DEFAULT_FAVICON = `${BASE_PATH}/branding/do-icon-container.svg`

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const forms = await payload.find({
    collection: 'forms',
    where: {
      slug: {
        equals: slug,
      },
    },
    overrideAccess: true,
  })

  if (!forms.docs.length) {
    return {
      title: `Form Not Found | ${DEFAULT_SITE_NAME}`,
      icons: { icon: DEFAULT_FAVICON },
    }
  }

  const form = forms.docs[0] as Form
  const headerImageUrl =
    form.header_image && typeof form.header_image === 'object'
      ? form.header_image.url || `/api/media/file/${form.header_image.filename}`
      : null
  const siteName =
    (typeof form.operator === 'object' && form.operator?.title) || DEFAULT_SITE_NAME
  const title = `${form.title || 'Form'} | ${siteName}`
  const description = `${title} — fill in and submit this form online.`

  return {
    title,
    description,
    icons: { icon: DEFAULT_FAVICON },
    openGraph: {
      title,
      description,
      siteName,
      images: headerImageUrl ? [headerImageUrl] : [],
    },
  }
}

export default async function FormPage({ params, searchParams }: Props) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const preview = resolvedSearchParams.preview
  const lang = resolvedSearchParams.lang

  const isPreview = preview === 'true'
  const payload = await getPayload({ config })

  const forms = await payload.find({
    collection: 'forms',
    where: {
      slug: {
        equals: slug,
      },
    },
    locale: (preview || typeof lang !== 'string') ? undefined : (lang === 'ar' ? 'ar' : 'en'),
    overrideAccess: true,
  })

  if (!forms.docs.length) {
    return notFound()
  }

  const form = forms.docs[0] as Form

  // Check authentication and authorization
  const headersList = await getHeaders()
  const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }
  const isAuthenticated = !!user
  let isAuthorized = true // default: no restriction

  if (form.requires_auth) {
    if (user && form.required_access) {
      // Fetch user with access relation populated so we can inspect access slugs
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
      // Not authenticated but auth is required
      isAuthorized = false
    }
  }

  if (isPreview && isAuthenticated) {
    // Live-preview bypass, gated on being logged in — NOT on `isAuthorized` (a form's
    // `required_access` is a grant for people submitting the published form, which an author
    // previewing their own draft won't necessarily hold). `FormLive` unconditionally serializes
    // the full `form` doc (incl. `fields`) into `initialData` before `FormContent` ever gets to
    // apply its own requires_auth/isAuthorized gating in the browser — so an unauthenticated
    // `?preview=true` request must never reach this branch at all, for any form, survey or not:
    // the leak already happened by the time the client-side check would have run.
    return (
      <FormLive
        initialData={form}
        user={user}
        isAuthenticated={isAuthenticated}
        isAuthorized={isAuthorized}
      />
    )
  }

  if (form.is_survey) {
    // Never pass the full `form` doc (its `fields`/blocks) into a client component for a
    // survey — only this fixed shell of non-question data crosses the server/client boundary
    // until `validateSurveyCodeAction` proves the visitor holds a valid code.
    const shell: SurveyFormShell = {
      id: form.id,
      slug: form.slug,
      title: form.title,
      theme: form.theme,
      header_image: form.header_image,
      background_image: form.background_image,
      available_languages: form.available_languages,
    }

    return <SurveyGate key={typeof lang === 'string' ? lang : 'default'} shell={shell} />
  }

  return (
    <FormContent
      form={form}
      user={user}
      isAuthenticated={isAuthenticated}
      isAuthorized={isAuthorized}
    />
  )
}
