'use client'

import React, { useState } from 'react'
import { completeTrip } from '@/collections/trip-scheduling/actions/complete-trip'
import type {
  TripCompletionLoad,
  TripCompletionSlug,
  TripCompletionView as TripDetails,
} from '@/collections/trip-scheduling/actions/complete-trip-load'
import { TripSchedulingHeader } from './trip-scheduling-header'

type ViewState = TripCompletionLoad['state'] | 'success'

// Same wording as the approval pages: one message for every failure.
const INVALID_LINK_MESSAGE = 'Invalid or expired security token.'

const mainClass =
  'min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative'

const pageBackground = (backgroundImage: string) => ({
  backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${backgroundImage}`,
})

function AccessRestricted({ backgroundImage }: { backgroundImage: string }) {
  return (
    <main className={mainClass} style={pageBackground(backgroundImage)}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 relative z-10">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600">{INVALID_LINK_MESSAGE}</p>
      </div>
    </main>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">{label}:</span>
      <p className="text-slate-900 font-medium">{children}</p>
    </div>
  )
}

function TripDetailsGrid({ trip }: { trip: TripDetails }) {
  return (
    <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Detail label="Requester">
          {trip.requesterName || 'N/A'}{' '}
          <span className="text-slate-500 text-[11px] block">({trip.requesterPhone || 'N/A'})</span>
        </Detail>
        <Detail label="Passengers">{trip.passengers ?? 'N/A'}</Detail>
        <Detail label="Operator">{trip.operator || 'N/A'}</Detail>
        <Detail label="Vehicle Required">{trip.vehicle || 'N/A'}</Detail>
        <Detail label="Route">
          {trip.pickup || 'N/A'} &rarr; {trip.destination || 'N/A'}
        </Detail>
        {trip.zone && <Detail label="Zone">{trip.zone}</Detail>}
        <Detail label="Travel Date">{trip.travelDate || 'N/A'}</Detail>
        <Detail label="Pick-up Time">{trip.travelTime || 'N/A'}</Detail>
        {trip.category && <Detail label="Category">{trip.category}</Detail>}
        <Detail label="Assigned Driver">{trip.driverName || 'N/A'}</Detail>
      </div>
      {trip.reason && (
        <div className="pt-2 border-t border-slate-200">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Reason:</span>
          <p className="text-slate-700 italic mt-0.5">&quot;{trip.reason}&quot;</p>
        </div>
      )}
      {trip.specialNotes && (
        <div className="pt-2 border-t border-slate-200">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
            Special Notes:
          </span>
          <p className="text-slate-700 mt-0.5 whitespace-pre-line">{trip.specialNotes}</p>
        </div>
      )}
    </div>
  )
}

function StateNotice({ state, travelDate }: { state: ViewState; travelDate: string }) {
  if (state === 'success') {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold space-y-1">
        <p className="uppercase text-sm">Trip marked as completed.</p>
        <p className="text-[11px] font-normal text-emerald-600">The approvers have been notified.</p>
      </div>
    )
  }
  if (state === 'completed') {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
        This trip has already been completed.
      </div>
    )
  }
  if (state === 'too-early') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-center font-bold">
        This trip can be marked as completed from {travelDate}.
      </div>
    )
  }
  return null
}

export function TripCompletionView({
  slug,
  id,
  token,
  load,
  backgroundImage,
  title,
}: {
  slug: TripCompletionSlug
  id: string
  token: string
  load: TripCompletionLoad
  backgroundImage: string
  title: string
}) {
  const [state, setState] = useState<ViewState>(load.state)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (load.state === 'invalid' || state === 'invalid') {
    return <AccessRestricted backgroundImage={backgroundImage} />
  }

  const { trip } = load

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const result = await completeTrip({ slug, id, token })
      setState(result.ok ? 'success' : result.state)
    } catch {
      setState('invalid')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={mainClass} style={pageBackground(backgroundImage)}>
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        <TripSchedulingHeader title={title} subtitle="Trip Completion" />

        <div className="p-8 space-y-6 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <TripDetailsGrid trip={trip} />

          {state === 'completable' ? (
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#143422] text-[#DEC37D] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#143422]/90 transition-all cursor-pointer border border-[#DEC37D]/30 flex items-center justify-center shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Marking as completed...' : 'Mark trip as completed'}
              </button>
            </div>
          ) : (
            <StateNotice state={state} travelDate={trip.travelDate} />
          )}
        </div>
      </div>
    </main>
  )
}
