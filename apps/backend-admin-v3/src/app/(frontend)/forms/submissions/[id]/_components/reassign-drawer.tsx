'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { searchUsersForReassign, reassignInstanceReviewerAction, UserResult } from '../actions'

interface ReassignDrawerProps {
  isOpen: boolean
  onClose: () => void
  instanceId: string
  submissionId: string
  currentStepLabel: string
  token?: string
}

export function ReassignDrawer({
  isOpen,
  onClose,
  instanceId,
  submissionId,
  currentStepLabel,
  token,
}: ReassignDrawerProps) {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [selected, setSelected] = useState<UserResult | null>(null)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [isSearching, startSearch] = useTransition()
  const [isSubmitting, startSubmit] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSelected(null)
      setMessage(null)
    }
  }, [isOpen])

  const handleSearch = (q: string) => {
    setQuery(q)
    setSelected(null)
    if (q.length < 2) {
      setResults([])
      return
    }
    startSearch(async () => {
      try {
        const users = await searchUsersForReassign(q, token ? { instanceId, token } : undefined)
        setResults(users)
      } catch {
        setResults([])
      }
    })
  }

  const handleSelect = (u: UserResult) => {
    setSelected(u)
    setResults([])
    setQuery(u.full_name || u.email)
  }

  const handleConfirm = () => {
    if (!selected) return
    startSubmit(async () => {
      try {
        await reassignInstanceReviewerAction(instanceId, submissionId, selected.email, token)
        setMessage({ text: `Reassigned to ${selected.email}`, isError: false })
        setTimeout(onClose, 1500)
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : 'Reassign failed',
          isError: true,
        })
      }
    })
  }

  const isEmailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim())
  const directEmailOption = isEmailLike && !results.some((u) => u.email === query.trim())

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        data-theme="dohaoasis-new"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-base-100 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div>
            <h2 className="font-bold text-base text-base-content">Reassign Reviewer</h2>
            <p className="text-xs text-base-content/50 mt-0.5">{currentStepLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-base-content/60">
            Search for a user to reassign the current step. The new reviewer will receive a
            notification email with the same access link.
          </p>

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input input-bordered w-full pr-8"
              autoFocus={isOpen}
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs text-base-content/40" />
            )}
          </div>

          {/* Results */}
          {(results.length > 0 || directEmailOption) && (
            <ul className="divide-y divide-base-200 rounded-box border border-base-200 overflow-hidden max-h-64 overflow-y-auto">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(u)}
                    className="w-full text-left px-4 py-3 hover:bg-base-200 transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-bold text-sm text-base-content">
                      {u.full_name || u.email}
                    </span>
                    <span className="text-xs text-base-content/50 font-normal">{u.email}</span>
                    {u.designation && (
                      <span className="text-xs text-base-content/50 font-normal">{u.designation}</span>
                    )}
                    {u.department && (
                      <span className="text-xs text-base-content/50 font-normal">{u.department}</span>
                    )}
                  </button>
                </li>
              ))}
              {directEmailOption && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelect({ id: '', email: query.trim(), full_name: null })}
                    className="w-full text-left px-4 py-3 hover:bg-base-200 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-base-content">
                      Assign to <span className="font-bold">{query.trim()}</span>
                    </span>
                  </button>
                </li>
              )}
            </ul>
          )}

          {/* Selected user preview */}
          {selected && (
            <div className="alert alert-info alert-soft py-3 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0"
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
              <span className="text-xs text-base-content/50">
                Reassigning to{' '}
                <strong>
                  {selected.full_name
                    ? `${selected.full_name} (${selected.email})`
                    : selected.email}
                </strong>
              </span>
            </div>
          )}

          {/* Error/success message */}
          {message && (
            <div
              className={`alert ${message.isError ? 'alert-error' : 'alert-success'} alert-soft py-3 text-sm`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-base-200 flex gap-2 justify-end">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!selected || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting && <span className="loading loading-spinner loading-xs" />}
            {isSubmitting ? 'Reassigning...' : 'Confirm Reassign'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
