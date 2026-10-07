import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { notFound, redirect } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import { noah, poppinsNormal } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import LetterCreationForm from './form'
import { getCollectionConfig } from '@/utilities/collection-meta'

import LettersLoginPanel from '@/common/components/letters-login-panel'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CreateLetterPage({ params }: PageProps) {
  const { slug } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return (
      <div
        className={cn(
          'min-h-screen bg-base-200 py-12 px-4 flex items-center justify-center',
          poppinsNormal.className,
        )}
      >
        <LettersLoginPanel />
      </div>
    )
  }

  const collectionConfig = getCollectionConfig(slug)
  if (!collectionConfig || !['salary-deduction', 'warnings'].includes(slug)) {
    return notFound()
  }

  return (
    <div
      data-theme="dohaoasis-new"
      className={cn(
        'min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center',
        poppinsNormal.className,
      )}
    >
      <div className="max-w-2xl w-full bg-white card shadow-2xl border border-base-200">
        <div className="card-body p-8">
          <div className="border-b border-base-200 pb-6 mb-6">
            <h1 className={cn('text-3xl font-extrabold text-secondary', noah.className)}>
              Create {collectionConfig.label}
            </h1>
            <p className="text-base-content/60 text-sm mt-2">
              Fill out the form below to initiate a new {collectionConfig.label.toLowerCase()}{' '}
              workflow.
            </p>
          </div>

          <LetterCreationForm slug={slug} label={collectionConfig.label} />

          <div className="mt-8 text-center">
            <Link
              href="/letters"
              className="text-sm font-medium text-primary hover:underline transition-all"
            >
              &larr; Back to available letters
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-base-content/40 text-xs">
        <p>&copy; {new Date().getFullYear()} Doha Oasis Admin System. All rights reserved.</p>
      </div>
    </div>
  )
}
