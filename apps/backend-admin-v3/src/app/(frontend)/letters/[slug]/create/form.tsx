'use client'
import React, { useState, useEffect } from 'react'
import { fetchUsersAction, createLetterAction } from './actions'
import { useRouter } from 'next/navigation'
import { noah, poppinsNormal } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'
import { getCollectionConfig, FormFieldConfig } from '@/utilities/collection-meta'

interface FormProps {
  slug: string
  label: string
}

export default function LetterCreationForm({ slug, label }: FormProps) {
  const config = getCollectionConfig(slug)
  const formFields = config?.formFields || []

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = { employee: '' }
    formFields.forEach((f) => {
      if (f.name !== 'employee') {
        initial[f.name] = f.type === 'number' ? 0 : ''
      }
    })
    return initial
  })

  useEffect(() => {
    fetchUsersAction().then(setUsers)
  }, [])

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createLetterAction(slug, formData)
    if (result.success) {
      router.push(`/letters/${slug}/${result.id}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Static employee selection */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-bold text-primary italic uppercase tracking-wider text-xs">
            Target Employee
          </span>
        </label>
        <select
          className="select select-bordered select-primary w-full bg-base-50 focus:bg-white transition-all font-semibold"
          value={formData.employee}
          onChange={(e) => handleChange('employee', e.target.value)}
          required
        >
          <option value="" disabled>
            Select an employee...
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic fields */}
      {formFields
        .filter((f) => f.name !== 'employee' && f.type !== 'upload')
        .map((field) => (
          <div key={field.name} className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-primary italic uppercase tracking-wider text-xs">
                {field.label}
              </span>
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                className="input input-bordered input-primary w-full bg-base-50 focus:bg-white transition-all"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                className="input input-bordered input-primary w-full bg-base-50 focus:bg-white transition-all"
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, Number(e.target.value))}
                min={0}
                required={field.required}
              />
            )}

            {field.type === 'richText' && (
              <textarea
                className="textarea textarea-bordered textarea-primary h-40 w-full bg-base-50 focus:bg-white transition-all py-4"
                placeholder={`Enter detailed ${field.label.toLowerCase()}...`}
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
              />
            )}

            {field.description && (
              <label className="label">
                <span className="label-text-alt text-base-content/50 italic">
                  {field.description}
                </span>
              </label>
            )}
          </div>
        ))}

      {/* Placeholder for upload fields (simplified for now as server action currently expects JSON) */}
      {/* {formFields
        .filter((f) => f.type === 'upload')
        .map((field) => (
          <div
            key={field.name}
            className="alert alert-info py-2 px-4 text-xs opacity-70 bg-info/10 border-info/20 text-info select-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>File attachments can be added after the initial request is submitted.</span>
          </div>
        ))} */}

      <div className="pt-8">
        <button
          type="submit"
          className={cn(
            'btn btn-primary btn-block text-white font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all border-none',
            noah.className,
          )}
          disabled={loading}
        >
          {loading ? 'Processing...' : `Submit Request`}
        </button>
      </div>
    </form>
  )
}
