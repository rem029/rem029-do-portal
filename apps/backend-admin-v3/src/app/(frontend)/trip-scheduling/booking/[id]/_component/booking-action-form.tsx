'use client'

import React, { useState } from 'react'
import { processBookingWorkflow } from '@/collections/trip-scheduling-bookings/actions/action-workflow'
import { checkDriverDayForToken } from '@/collections/trip-scheduling/actions/driver-day-check'
import {
  DriverDayNotice,
  useDriverDayAssignments,
} from '@/common/components/trip-scheduling/driver-day-notice'

export function BookingActionForm({ 
  id, 
  token, 
  drivers 
}: { 
  id: string, 
  token: string, 
  drivers: any[] 
}) {
  const [mode, setMode] = useState<'idle' | 'approving' | 'declining'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const driverDayAssignments = useDriverDayAssignments(selectedDriverId, (driverId) =>
    checkDriverDayForToken({ slug: 'trip-scheduling-bookings', id, token, driverId }),
  )

  const handleAction = async (actionType: 'approve' | 'decline', e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const driverId = formData.get('driverId') as string
    const declineReason = formData.get('declineReason') as string
    const approverNotes = formData.get('approverNotes') as string

    try {
      const result = await processBookingWorkflow({
        id,
        token,
        status: actionType === 'approve' ? 'approved' : 'declined',
        driverId: driverId || undefined,
        declineReason: declineReason || undefined,
        approverNotes: approverNotes || undefined,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to process request.')
      }

      setSuccessMessage(actionType === 'approve' ? 'Booking Approved & Driver Assigned!' : 'Booking Successfully Declined.')
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred.')
      setIsSubmitting(false)
    }
  }

  if (successMessage) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold space-y-1">
        <p className="uppercase text-sm">{successMessage}</p>
        <p className="text-[11px] font-normal text-emerald-600">Updating portal view...</p>
      </div>
    )
  }

  if (mode === 'approving') {
    return (
      <form onSubmit={(e) => handleAction('approve', e)} className="space-y-4">
        {errorMessage && <p className="text-red-600 font-bold text-[11px]">{errorMessage}</p>}
        
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 uppercase tracking-wide text-[11px]">
            Assign Driver <span className="text-[#ED1C24]">*</span>
          </label>
          <select
            name="driverId"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#DEC37D] font-medium"
          >
            <option value="">Select a driver...</option>
            {drivers.map((driver: any) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} {driver.phone ? `(${driver.phone})` : ''}
              </option>
            ))}
          </select>
          <DriverDayNotice assignments={driverDayAssignments} />
        </div>

        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 uppercase tracking-wide text-[11px]">
            Approver Notes / Special Instructions
          </label>
          <input
            type="text"
            name="approverNotes"
            disabled={isSubmitting}
            placeholder="Optional instructions or notes for the driver..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#DEC37D]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-[#143422] text-[#DEC37D] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#143422]/90 transition-all cursor-pointer border border-[#DEC37D]/30 flex items-center justify-center shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Processing Approval...' : 'Confirm & Approve'}
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            disabled={isSubmitting}
            className="py-3 px-4 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  if (mode === 'declining') {
    return (
      <form onSubmit={(e) => handleAction('decline', e)} className="space-y-4">
        {errorMessage && <p className="text-red-600 font-bold text-[11px]">{errorMessage}</p>}

        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 uppercase tracking-wide text-[11px]">
            Reason for Declining <span className="text-[#ED1C24]">*</span>
          </label>
          <input
            type="text"
            name="declineReason"
            required
            disabled={isSubmitting}
            placeholder="Provide a reason for rejection..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-[#DEC37D]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-[#ED1C24] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#c9141b] transition-all cursor-pointer flex items-center justify-center shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Processing Decline...' : 'Confirm Decline'}
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            disabled={isSubmitting}
            className="py-3 px-4 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-4 pt-2">
      <button
        type="button"
        onClick={() => setMode('approving')}
        className="flex-1 py-3 bg-[#143422] text-[#DEC37D] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#143422]/90 transition-all cursor-pointer border border-[#DEC37D]/30 flex items-center justify-center shadow-sm"
      >
        Approve & Assign Driver
      </button>
      <button
        type="button"
        onClick={() => setMode('declining')}
        className="py-3 px-6 bg-red-50 text-red-700 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all cursor-pointer border border-red-200 flex items-center justify-center"
      >
        Decline
      </button>
    </div>
  )
}