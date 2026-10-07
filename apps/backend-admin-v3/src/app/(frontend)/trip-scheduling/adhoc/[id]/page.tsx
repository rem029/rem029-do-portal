import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import { AdhocActionForm } from './_component/adhoc-action-form'
import { TripSchedulingHeader } from '../../_components/trip-scheduling-header'

interface ApprovalPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

// One message for every failure (missing record, missing/wrong token, expired link) so the response
// never reveals whether a record exists or what state it is in.
const INVALID_LINK_MESSAGE = 'Invalid or expired security token.'

export default async function AdhocApprovalPage({ params, searchParams }: ApprovalPageProps) {
  const { id } = await params
  const { token } = await searchParams

  let requestDoc: any = null
  let driversResult: any = { docs: [] }
  let errorMessage: string | null = null

  const { generalBackground } = await getTripSchedulingPublicSettings()
  const payload = await getPayload({ config })

  try {
    const [docResult, driverRes] = await Promise.allSettled([
      payload.findByID({
        collection: 'trip-scheduling-adhoc',
        id,
        depth: 1,
      }),
      payload.find({
        collection: 'trip-scheduling-drivers',
        where: { isActive: { equals: true } },
        pagination: false,
      }),
    ])

    if (docResult.status === 'fulfilled') {
      requestDoc = docResult.value
    }

    if (driverRes.status === 'fulfilled') {
      driversResult = driverRes.value
    }

    // The token is checked on every request, whatever the record's status. Details are only ever
    // rendered after it matches, including the "already processed" state.
    if (!requestDoc || !isTokenMatch(requestDoc.approvalToken, token)) {
      requestDoc = null
      errorMessage = INVALID_LINK_MESSAGE
    }
  } catch (err: any) {
    payload.logger.error(
      `[Approval Page Error]: ${err instanceof Error ? err.message : String(err)}`,
    )
    errorMessage = 'Unable to load request due to a server error.'
  }

  if (errorMessage || !requestDoc) {
    return (
      <main
        className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 relative z-10">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600">{errorMessage || 'Unable to load request.'}</p>
        </div>
      </main>
    )
  }

  const isPending = requestDoc.status === 'pending'

  // Bulletproof raw string date splitter preventing local timezone shift
  const formattedDate = requestDoc.travelDate 
    ? (() => {
        const raw = String(requestDoc.travelDate)
        // Grab the first 10 characters (YYYY-MM-DD) directly from the ISO string
        const datePart = raw.substring(0, 10)
        const parts = datePart.split('-')
        if (parts.length === 3) {
          const [yr, mo, dy] = parts
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
          const monthName = monthNames[parseInt(mo, 10) - 1]
          return `${monthName} ${parseInt(dy, 10)}, ${yr}`
        }
        return raw
      })()
    : 'N/A'

  return (
    <main
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
      }}
    >
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        
        <TripSchedulingHeader title="EMPLOYEE TRANSPORT AD-HOC REQUEST" subtitle={<>Status: {requestDoc.status}</>} />

        <div className="p-8 space-y-6 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
          
          {/* DETAILS GRID */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Requester:</span>
                <p className="text-slate-900 font-medium">
                  {requestDoc.fullName}{' '}
                  <span className="text-slate-500 text-[11px] block">
                    ({requestDoc.phone || 'N/A'})
                  </span>
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Passengers:</span>
                <p className="text-slate-900 font-medium">{requestDoc.passengers}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Operator:</span>
                <p className="text-slate-900 font-medium">
                  {typeof requestDoc.operator === 'object' 
                    ? (requestDoc.operator?.title || requestDoc.operator?.name || 'N/A') 
                    : (requestDoc.operator || 'N/A')}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Vehicle Required:</span>
                <p className="text-slate-900 font-medium">{requestDoc.vehicleNeeded?.name || requestDoc.vehicleNeeded || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Route:</span>
                <p className="text-slate-900 font-medium">{requestDoc.origin} &rarr; {requestDoc.destination}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Travel Date:</span>
                <p className="text-slate-900 font-medium">{formattedDate}</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Pick-up Time:</span>
                <p className="text-slate-900 font-medium">{requestDoc.pickupTime || 'N/A'}</p>
              </div>
            </div>
            {requestDoc.reason && (
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Reason:</span>
                <p className="text-slate-700 italic mt-0.5">&quot;{requestDoc.reason}&quot;</p>
              </div>
            )}
          </div>

          {!isPending ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
              {requestDoc.status === 'expired' ? (
                <>This request expired on {formattedDate} without a decision.</>
              ) : (
                <>
                  This request has already been processed and is currently{' '}
                  <span className="uppercase">{requestDoc.status}</span>.
                </>
              )}
            </div>
          ) : (
            <AdhocActionForm id={id} token={token || ''} drivers={driversResult.docs} />
          )}

        </div>
      </div>
    </main>
  )
}