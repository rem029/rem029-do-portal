import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import React from 'react'
import { noah, poppinsNormal } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import LettersLoginPanel from '@/common/components/letters-login-panel'

const LetterTypes = [
  {
    slug: 'salary-deduction',
    label: 'Salary Deduction',
    description: 'Create and submit a salary deduction request.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    slug: 'warnings',
    label: 'Warning Letter',
    description: 'Generate a warning letter for formal documentation.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-primary"
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
    ),
  },
]

export default async function LettersPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return (
      <div
        data-theme="dohaoasis-new"
        className={cn(
          'min-h-screen bg-base-200 py-12 px-4 flex items-center justify-center',
          poppinsNormal.className,
        )}
      >
        <LettersLoginPanel />
      </div>
    )
  }

  return (
    <div
      data-theme="dohaoasis-new"
      className={cn(
        'min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center',
        poppinsNormal.className,
      )}
    >
      <div className="max-w-[1920px] w-full flex flex-row gap-2 justify-center items-start">
        <div className="flex-[1] card bg-base-100 shadow-xl border border-base-200 max-w-4xl">
          <div className="card-body p-8">
            <div className="border-b border-base-200 pb-8 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className={cn('text-3xl font-extrabold text-secondary', noah.className)}>
                    Available Letters
                  </h1>
                  <p className="text-base-content/60 text-sm mt-2">
                    Select a letter type to start a new request or documentation workflow.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {LetterTypes.map((type) => (
                <div
                  key={type.slug}
                  className="group relative bg-base-50 p-6 rounded-2xl border border-base-200 hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col gap-4"
                >
                  <div className="bg-white p-3 rounded-xl shadow-sm w-fit border border-base-100 group-hover:scale-110 transition-transform duration-300">
                    {type.icon}
                  </div>

                  <div>
                    <h2 className={cn('text-xl font-bold text-primary mb-2', noah.className)}>
                      {type.label}
                    </h2>
                    <p className="text-sm text-base-content/60 leading-relaxed mb-6">
                      {type.description}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <Link
                      href={`/letters/${type.slug}/create`}
                      className="btn btn-primary btn-link"
                    >
                      Start Request
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-base-200 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="badge badge-outline badge-secondary opacity-50 px-4 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Looking for more options? Contact HR.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-base-content/40 text-xs">
        <p>&copy; {new Date().getFullYear()} Doha Oasis Admin System. All rights reserved.</p>
      </div>
    </div>
  )
}
