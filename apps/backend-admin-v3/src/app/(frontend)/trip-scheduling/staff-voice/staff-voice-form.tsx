'use client'

import React, { useState } from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { submitStaffVoice, type StaffVoiceSubmissionInput } from './actions'
import { TripSchedulingFormCard } from '../_components/trip-scheduling-form-card'

const EMPTY_FORM: StaffVoiceSubmissionInput = {
  fullName: '',
  email: '',
  category: '',
  subject: '',
  message: '',
}

const CATEGORY_OPTIONS = [
  { value: 'suggestion', label: 'Suggestion / Idea' },
  { value: 'concern', label: 'Service / Route Concern' },
  { value: 'compliment', label: 'Compliment / Praise' },
  { value: 'inquiry', label: 'General Inquiry' },
] as const satisfies ReadonlyArray<{
  value: Exclude<StaffVoiceSubmissionInput['category'], ''>
  label: string
}>

// Same fonts and field styling as the ad-hoc booking form.
const POPPINS_STYLE = { fontFamily: 'Poppins, sans-serif' }

const INPUT_CLASS =
  'w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-[#DEC37D] focus:ring-2 focus:ring-[#DEC37D]/20 transition-all'

const SELECT_CLASS =
  'w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-[#DEC37D] cursor-pointer'

// Keep in sync with the length limits enforced in actions.ts.
const MAX_LENGTH = { fullName: 150, email: 254, subject: 200, message: 5000 }

interface SectionProps {
  title: string
  children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div>
    <h3
      className={cn('text-xs font-black uppercase tracking-wider text-slate-500 mb-3 pb-1 border-b border-slate-100', noah.className)}
    >
      {title}
    </h3>
    <div className="space-y-4 xl:grid xl:grid-cols-12 xl:gap-4 xl:space-y-0">{children}</div>
  </div>
)

interface FieldProps {
  label: string
  htmlFor: string
  className?: string
  children: React.ReactNode
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, className, children }) => (
  <div className={className}>
    <label
      htmlFor={htmlFor}
      className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}
    >
      {label} <span className="text-[#ED1C24]">*</span>
    </label>
    {children}
  </div>
)

export const StaffVoiceForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const [formData, setFormData] = useState<StaffVoiceSubmissionInput>(EMPTY_FORM)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await submitStaffVoice(formData)

      if (result.success) {
        setSuccessId(result.docId)
      } else {
        setErrorMessage(result.error || 'Failed to submit feedback.')
      }
    } catch {
      setErrorMessage('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-center p-8 sm:p-12 space-y-4 max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-[#00CF77]/10 text-[#00CF77] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-black text-[#143422] tracking-tight">
          Feedback Submitted Successfully
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Thank you for sharing your thoughts. Your feedback has been registered and sent to the
          logistics team for review. You will also receive a confirmation email shortly.
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setSuccessId(null)
              setFormData(EMPTY_FORM)
            }}
            className="px-6 py-2.5 bg-[#143422] text-[#DEC37D] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#143422]/90 transition-all cursor-pointer border border-[#DEC37D]/30"
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    )
  }

  return (
    <TripSchedulingFormCard title="Staff Voice">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 xl:px-10 xl:py-6 space-y-6" style={POPPINS_STYLE}>
        {errorMessage && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r-lg">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* SECTION 1: STAFF INFO */}
        <Section title="Staff Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:contents">
            <Field label="Full Name" htmlFor="fullName" className="xl:col-span-6">
              <input
                id="fullName"
                type="text"
                name="fullName"
                required
                maxLength={MAX_LENGTH.fullName}
                placeholder="Type here..."
                value={formData.fullName}
                onChange={handleChange}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Staff Email" htmlFor="email" className="xl:col-span-6">
              <input
                id="email"
                type="email"
                name="email"
                required
                maxLength={MAX_LENGTH.email}
                placeholder="example@domain.com"
                value={formData.email}
                onChange={handleChange}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 2: YOUR FEEDBACK */}
        <Section title="Your Feedback">
          <Field label="Category" htmlFor="category" className="xl:col-span-5">
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className={`${SELECT_CLASS} ${formData.category ? 'text-slate-900' : 'text-slate-400'}`}
            >
              <option value="" disabled className="text-slate-400">
                Please select...
              </option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject" htmlFor="subject" className="xl:col-span-7">
            <input
              id="subject"
              type="text"
              name="subject"
              required
              maxLength={MAX_LENGTH.subject}
              placeholder="Type here..."
              value={formData.subject}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Message" htmlFor="message" className="xl:col-span-12">
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              maxLength={MAX_LENGTH.message}
              placeholder="Type here..."
              value={formData.message}
              onChange={handleChange}
              className={`${INPUT_CLASS} resize-none`}
            />
          </Field>
        </Section>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 flex justify-center xl:justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-3 xl:min-w-[260px] xl:whitespace-nowrap bg-[#143422] text-[#DEC37D] font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-[#143422]/90 transition-all disabled:opacity-50 cursor-pointer border border-[#DEC37D]/30 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Sending Feedback...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </TripSchedulingFormCard>
  )
}
