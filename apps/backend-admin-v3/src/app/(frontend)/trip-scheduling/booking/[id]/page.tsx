import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isTokenMatch } from '@/utilities/trip-scheduling-approval-token'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import { BookingActionForm } from './_component/booking-action-form'
import { TripSchedulingHeader } from '../../_components/trip-scheduling-header'

interface BookingApprovalPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

// One message for every failure (missing record, missing/wrong token, expired link) so the response
// never reveals whether a record exists or what state it is in.
const INVALID_LINK_MESSAGE = 'Invalid or expired security token.'

export default async function BookingApprovalPage({ params, searchParams }: BookingApprovalPageProps) {
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
        collection: 'trip-scheduling-bookings',
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
      `[Booking Approval Page Error]: ${err instanceof Error ? err.message : String(err)}`,
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
        
        <TripSchedulingHeader title="VEHICLE BOOKING REQUEST" subtitle={<>Status: {requestDoc.status}</>} />

        <div className="p-8 space-y-6 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
          
          {/* DETAILS GRID */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200">
            
            {/* Requester Info Section */}
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                &mdash; Requester Info:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Full Name:</span>
                  <p className="text-slate-900 font-medium">{requestDoc.fullName} <span className="text-slate-500 text-[11px] block">({requestDoc.phone || 'N/A'})</span></p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Total Passengers:</span>
                  <p className="text-slate-900 font-medium">{requestDoc.passengers} Person(s)</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-200 border-dashed" />

            {/* Trip Details Section */}
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                &mdash; Trip Details:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Operator:</span>
                  <p className="text-slate-900 font-medium">
                    {typeof requestDoc.operator === 'object' 
                      ? (requestDoc.operator?.title || requestDoc.operator?.name || 'N/A') 
                      : (requestDoc.operator || 'N/A')}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Trip Category:</span>
                  <p className="text-slate-900 font-medium">
                    {typeof requestDoc.tripCategory === 'object' 
                      ? (requestDoc.tripCategory?.name || requestDoc.tripCategory?.title || 'N/A') 
                      : (requestDoc.tripCategory || 'N/A')}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Pick-up Location:</span>
                  <p className="text-slate-900 font-medium">{requestDoc.pickupLocation || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Destination:</span>
                  <p className="text-slate-900 font-medium">{requestDoc.destination || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Zone:</span>
                  <p className="text-slate-900 font-medium">
                    {typeof requestDoc.zones === 'object' && requestDoc.zones !== null
                      ? `Zone ${requestDoc.zones.zoneNumber || ''} ${requestDoc.zones.district ? `(${requestDoc.zones.district})` : ''}`
                      : (requestDoc.zones || 'N/A')}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Vehicle Requested:</span>
                  <p className="text-slate-900 font-medium">{requestDoc.vehicleNeeded?.name || requestDoc.vehicleNeeded || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Trip Date:</span>
                  <p className="text-slate-900 font-medium">{formattedDate}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Trip Time:</span>
                  <p className="text-slate-900 font-medium">{requestDoc.travelTime || 'N/A'}</p>
                </div>
              </div>
            </div>

            {requestDoc.reason && (
              <div className="pt-2 border-t border-slate-200 pl-2">
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
            <BookingActionForm id={id} token={token || ''} drivers={driversResult.docs} />
          )}

        </div>
      </div>
    </main>
  )
}