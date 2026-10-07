'use client'

import React, { useState } from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { Operator, TripSchedulingCategory, TripSchedulingVehicle, TripSchedulingZone } from '@/payload-types'
import { submitBookingRequest } from './actions'
import { FormDatePicker } from '../_components/form-date-picker'
import { FormTimeInput } from '../_components/form-time-input'
import { TripSchedulingFormCard } from '../_components/trip-scheduling-form-card'

interface BookingFormProps {
  operators: Operator[]
  categories: TripSchedulingCategory[]
  vehicles: TripSchedulingVehicle[]
  zones: TripSchedulingZone[]
}

export const BookingForm: React.FC<BookingFormProps> = ({ operators, categories, vehicles, zones }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    operator: '',
    tripCategory: '',
    passengers: 1,
    vehicleNeeded: '',
    pickupLocation: '',
    destination: '',
    zones: '',
    travelDate: '',
    travelTime: '',
    reason: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const result = await submitBookingRequest(formData)

    if (result.success) {
      setSuccessId(result.docId as string)
    } else {
      setErrorMessage(result.error || 'Failed to submit booking request.')
    }
    setIsSubmitting(false)
  }

  if (successId) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-center p-8 sm:p-12 space-y-4 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-[#00CF77]/10 text-[#00CF77] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-black text-[#143422] tracking-tight">Booking Submitted Successfully</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Your transport booking request has been registered and sent to the logistics approvers for review.
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setSuccessId(null)
              setFormData({
                fullName: '',
                email: '',
                phone: '',
                operator: '',
                tripCategory: '',
                passengers: 1,
                vehicleNeeded: '',
                pickupLocation: '',
                destination: '',
                zones: '',
                travelDate: '',
                travelTime: '',
                reason: '',
              })
            }}
            className="px-6 py-2.5 bg-[#143422] text-[#DEC37D] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#143422]/90 transition-all cursor-pointer border border-[#DEC37D]/30"
          >
            Submit Another Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <TripSchedulingFormCard title="Vehicle Booking Request">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 xl:px-10 xl:py-6 space-y-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {errorMessage && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* SECTION 1: REQUESTER INFO */}
        <div>
          <h3 className={cn('text-xs font-black uppercase tracking-wider text-slate-500 mb-3 pb-1 border-b border-slate-100', noah.className)}>
            Requester Info
          </h3>
          <div className="space-y-4 xl:grid xl:grid-cols-12 xl:gap-4 xl:space-y-0">
            <div className="xl:col-span-4">
              <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                Full Name <span className="text-[#ED1C24]">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Type here..."
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] focus:ring-2 focus:ring-[#DEC37D]/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:contents">
              <div className="xl:col-span-4">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Email <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="example@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] focus:ring-2 focus:ring-[#DEC37D]/20 transition-all"
                />
              </div>
              <div className="xl:col-span-4">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Phone Number <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+97400000000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] focus:ring-2 focus:ring-[#DEC37D]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: TRIP & FLEET DETAILS */}
        <div>
          <h3 className={cn('text-xs font-black uppercase tracking-wider text-slate-500 mb-3 pb-1 border-b border-slate-100', noah.className)}>
            Trip Details
          </h3>
          <div className="space-y-4 xl:grid xl:grid-cols-12 xl:gap-4 xl:space-y-0">
            
            {/* Row 1: Operator & Trip Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:contents">
              <div className="xl:col-span-2">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Operator <span className="text-[#ED1C24]">*</span>
                </label>
                <select
                  name="operator"
                  required
                  value={formData.operator}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-[#DEC37D] cursor-pointer ${
                    formData.operator ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <option value="" disabled className="text-slate-400">
                    Please select...
                  </option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id} className="text-slate-900">
                      {op.title || op.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-5">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Trip Category <span className="text-[#ED1C24]">*</span>
                </label>
                <select
                  name="tripCategory"
                  required
                  value={formData.tripCategory}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-[#DEC37D] cursor-pointer ${
                    formData.tripCategory ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <option value="" disabled className="text-slate-400">
                    Please select...
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-900">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Pickup Location & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:contents">
              <div className="xl:col-span-5">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Pickup Location <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  required
                  placeholder="Type here..."
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] transition-all"
                />
              </div>
              <div className="xl:col-span-5">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Destination <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="text"
                  name="destination"
                  required
                  placeholder="Type here..."
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] transition-all"
                />
              </div>
            </div>

            {/* Row 3: Zone & Passengers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:contents">
              <div className="xl:col-span-5">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Zone <span className="text-[#ED1C24]">*</span>
                </label>
                <select
                  name="zones"
                  required
                  value={formData.zones}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-[#DEC37D] cursor-pointer ${
                    formData.zones ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <option value="" disabled className="text-slate-400">
                    Please select...
                  </option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} className="text-slate-900">
                      Zone {z.zoneNumber} {z.district ? `(${z.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-2">
                <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                  Passengers <span className="text-[#ED1C24]">*</span>
                </label>
                <input
                  type="number"
                  name="passengers"
                  min={1}
                  required
                  value={formData.passengers}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] transition-all"
                />
              </div>
            </div>

            {/* Row 4: Vehicle Needed (Full Width) */}
            <div className="xl:col-span-6">
              <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                Vehicle Needed <span className="text-[#ED1C24]">*</span>
              </label>
              <select
                name="vehicleNeeded"
                required
                value={formData.vehicleNeeded}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-[#DEC37D] cursor-pointer ${
                  formData.vehicleNeeded ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <option value="" disabled className="text-slate-400">
                  Please select...
                </option>
                {vehicles
                  .filter((v: any) => v.category !== 'employee-transport')
                  .map((v) => (
                    <option key={v.id} value={v.id} className="text-slate-900">
                      {v.name} {v.capacity?.value ? `(${v.capacity.value} seats)` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Row 5: Travel Date & Travel Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:contents">
              <FormDatePicker
                className="xl:col-span-3"
                label="Travel Date"
                name="travelDate"
                required={true}
                value={formData.travelDate}
                onChange={handleChange}
              />
              <FormTimeInput
                className="xl:col-span-3"
                label="Travel Time"
                name="travelTime"
                required={true}
                value={formData.travelTime}
                onChange={handleChange}
              />
            </div>

            {/* Row 6: Reason For Trip */}
            <div className="xl:col-span-12">
              <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
                Reason For Trip <span className="text-[#ED1C24]">*</span>
              </label>
              <textarea
                name="reason"
                required
                rows={3}
                placeholder="Type here..."
                value={formData.reason}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 flex justify-center xl:justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-3 xl:min-w-[260px] xl:whitespace-nowrap bg-[#143422] text-[#DEC37D] font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-[#143422]/90 transition-all disabled:opacity-50 cursor-pointer border border-[#DEC37D]/30 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Processing Booking...' : 'Submit Booking Request'}
          </button>
        </div>
      </form>
    </TripSchedulingFormCard>
  )
}