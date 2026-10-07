import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CATEGORY_LABELS } from '@/collections/trip-scheduling-staff-voice/emails'
import { StaffVoiceResponseForm } from './_component/staff-voice-response-form'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import { isReviewLinkValid } from './review-token'
import { TripSchedulingHeader } from '../../_components/trip-scheduling-header'

interface StaffVoiceReviewPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

const formatQatarDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    timeZone: 'Asia/Qatar',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

function AccessRestricted({
  message,
  pageBackground,
}: {
  message: string
  pageBackground: React.CSSProperties
}) {
  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={pageBackground}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 relative z-10">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600">{message}</p>
      </div>
    </main>
  )
}

export default async function StaffVoiceReviewPage({
  params,
  searchParams,
}: StaffVoiceReviewPageProps) {
  const { id } = await params
  const { token } = await searchParams

  const { generalBackground } = await getTripSchedulingPublicSettings()
  const pageBackground = {
    backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
  }
  const payload = await getPayload({ config })

  // A missing document and a bad token look the same to the visitor.
  const doc = await payload
    .findByID({ collection: 'trip-scheduling-staff-voice', id, depth: 0, overrideAccess: true })
    .catch(() => null)

  if (!doc || !isReviewLinkValid(doc, token)) {
    return (
      <AccessRestricted
        message="Invalid or expired security token."
        pageBackground={pageBackground}
      />
    )
  }

  const categoryLabel = CATEGORY_LABELS[doc.category] ?? doc.category

  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={pageBackground}
    >
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        <TripSchedulingHeader title="STAFF VOICE SUBMISSION" subtitle={categoryLabel} />

        <div className="p-8 space-y-6 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {/* DETAILS GRID */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  From:
                </span>
                <p className="text-slate-900 font-medium">
                  {doc.fullName}{' '}
                  <span className="text-slate-500 text-[11px] block">({doc.email})</span>
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Submitted:
                </span>
                <p className="text-slate-900 font-medium">{formatQatarDate(doc.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Subject:
                </span>
                <p className="text-slate-900 font-medium">{doc.subject}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                Message:
              </span>
              <p className="text-slate-700 italic mt-0.5 whitespace-pre-wrap">{`"${doc.message}"`}</p>
            </div>
          </div>

          {doc.respondedAt ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
              This submission has already been responded to on {formatQatarDate(doc.respondedAt)}.
            </div>
          ) : (
            <StaffVoiceResponseForm id={id} token={token ?? ''} requesterEmail={doc.email} />
          )}
        </div>
      </div>
    </main>
  )
}
