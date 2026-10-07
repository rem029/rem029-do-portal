'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  fetchEnvelopeLiveStatusAction,
  EnvelopeLiveStatusData,
} from '../actions'

const getStatusBadge = (status: string, large = false) => {
  const normalized = (status || 'created').toLowerCase()
  const baseClasses = large
    ? 'px-3 py-1 text-[12px] font-bold uppercase tracking-wider rounded-full'
    : 'px-2 py-0.5 text-[14px] font-semibold uppercase tracking-wider rounded-full'

  switch (normalized) {
    case 'completed':
    case 'signed':
      return (
        <span
          className={`${baseClasses} bg-(--theme-success-500)/10 text-(--theme-success-500) border border-(--theme-success-500)/20`}
        >
          {normalized === 'signed' ? 'Signed' : 'Completed'}
        </span>
      )
    case 'sent':
      return (
        <span
          className={`${baseClasses} bg-blue-500/10 text-blue-500 border border-blue-500/20`}
        >
          Sent
        </span>
      )
    case 'delivered':
      return (
        <span
          className={`${baseClasses} bg-purple-500/10 text-purple-500 border border-purple-500/20`}
        >
          Delivered
        </span>
      )
    case 'declined':
    case 'voided':
      return (
        <span
          className={`${baseClasses} bg-(--theme-error-500)/10 text-(--theme-error-500) border border-(--theme-error-500)/20`}
        >
          {normalized}
        </span>
      )
    case 'created':
    case 'draft':
    default:
      return (
        <span
          className={`${baseClasses} bg-(--theme-elevation-200) text-(--theme-elevation-600) border border-(--theme-elevation-300)`}
        >
          {normalized === 'created' ? 'Draft' : normalized}
        </span>
      )
  }
}

const getRoleLabel = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'signer':
      return 'Needs to Sign'
    case 'approver':
      return 'Approver'
    case 'cc':
      return 'Receives a Copy'
    default:
      return role || 'Signer'
  }
}

interface EnvelopeStatusModalProps {
  isOpen: boolean
  envelopeId: string | null
  onClose: () => void
}

export const EnvelopeStatusModal: React.FC<EnvelopeStatusModalProps> = ({
  isOpen,
  envelopeId,
  onClose,
}) => {
  const [data, setData] = useState<EnvelopeLiveStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    if (!envelopeId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetchEnvelopeLiveStatusAction(envelopeId)
      if (res.success && res.envelope) {
        setData(res.envelope)
      } else {
        setError(res.message || 'Could not fetch live DocuSign status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching status')
    } finally {
      setLoading(false)
    }
  }, [envelopeId])

  useEffect(() => {
    if (isOpen && envelopeId) {
      loadStatus()
    } else {
      setData(null)
      setError(null)
    }
  }, [isOpen, envelopeId, loadStatus])

  if (!isOpen || !envelopeId) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-(--theme-elevation-50) border border-(--theme-elevation-150) rounded-xl shadow-2xl z-10 flex flex-col overflow-hidden text-(--theme-elevation-800)">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-(--theme-elevation-150) bg-(--theme-elevation-50)">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-(--admin-color-accent)">
                DocuSign Live Status
              </span>
              <span className="text-[13px] text-(--theme-elevation-400)">•</span>
              <span className="text-[14px] text-(--theme-elevation-400) italic">
                Synced live from DocuSign
              </span>
            </div>

            <h3 className="text-[16.5px] font-bold text-(--theme-elevation-900) m-0">
              {data?.documentName || 'DocuSign Envelope Details'}
            </h3>

            {data?.emailSubject && (
              <p className="text-[12px] text-(--theme-elevation-500) m-0">
                Subject: {data.emailSubject}
              </p>
            )}

            <p className="text-[14px] text-(--theme-elevation-400) font-mono m-0">
              Envelope ID: {envelopeId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStatus}
              disabled={loading}
              className="p-1.5 rounded-md border border-(--theme-elevation-200) text-(--theme-elevation-600) hover:bg-(--theme-elevation-100) hover:text-(--theme-elevation-800) disabled:opacity-40 transition-colors"
              title="Refresh status from DocuSign"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-(--theme-elevation-400) hover:text-(--theme-elevation-700) hover:bg-(--theme-elevation-150) transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[12px] text-(--theme-elevation-400)">
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Retrieving live recipient and envelope status from DocuSign...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-(--theme-warning-50) border border-(--theme-warning-200) text-(--theme-warning-800) text-[12px] flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadStatus}
                className="underline font-semibold hover:opacity-80 ml-3"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="flex flex-col gap-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg bg-(--theme-elevation-100) border border-(--theme-elevation-200) flex flex-col gap-1">
                  <span className="text-[14px] font-semibold uppercase tracking-wider text-(--theme-elevation-500)">
                    Status
                  </span>
                  <div>{getStatusBadge(data.status, true)}</div>
                </div>

                <div className="p-3.5 rounded-lg bg-(--theme-elevation-100) border border-(--theme-elevation-200) flex flex-col gap-1">
                  <span className="text-[14px] font-semibold uppercase tracking-wider text-(--theme-elevation-500)">
                    Sender
                  </span>
                  <span className="text-[12px] font-medium text-(--theme-elevation-800) truncate">
                    {data.senderName || data.senderEmail || '—'}
                  </span>
                  {data.senderEmail && data.senderName && (
                    <span className="text-[13px] text-(--theme-elevation-400) truncate">
                      {data.senderEmail}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-(--theme-elevation-100) border border-(--theme-elevation-200) flex flex-col gap-1">
                  <span className="text-[14px] font-semibold uppercase tracking-wider text-(--theme-elevation-500)">
                    Last Activity
                  </span>
                  <span className="text-[12px] font-medium text-(--theme-elevation-800)">
                    {data.statusChangedDateTime
                      ? format(new Date(data.statusChangedDateTime), 'MMM dd, yyyy HH:mm:ss')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Recipient Tracking Table */}
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-(--theme-elevation-500) mb-2">
                  Recipients & Signing Progress
                </h4>

                {data.recipients.length === 0 ? (
                  <p className="text-[12px] text-(--theme-elevation-400)">No recipients recorded.</p>
                ) : (
                  <div className="overflow-x-auto border border-(--theme-elevation-150) rounded-lg bg-(--theme-elevation-0)">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-(--theme-elevation-150) text-(--theme-elevation-400) uppercase text-[13px] font-bold tracking-wider bg-(--theme-elevation-100)">
                          <th className="py-2 px-3 w-12 text-center">Order</th>
                          <th className="py-2 px-3">Recipient</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3 text-right">Individual Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--theme-elevation-100)">
                        {data.recipients.map((r, i) => (
                          <tr
                            key={i}
                            className="hover:bg-(--theme-elevation-50) transition-colors text-(--theme-elevation-800)"
                          >
                            <td className="py-2.5 px-3 text-center">
                              <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-(--theme-elevation-150) text-(--theme-elevation-700) text-[13px] font-bold">
                                {r.routingOrder ?? i + 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-(--theme-elevation-900)">
                                  {r.name}
                                </span>
                                <span className="text-[14px] text-(--theme-elevation-400)">
                                  {r.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[13px] bg-(--theme-elevation-150) text-(--theme-elevation-600) font-medium">
                                {getRoleLabel(r.role)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {getStatusBadge(r.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-(--theme-elevation-150) bg-(--theme-elevation-100) flex items-center justify-between">
          <div>
            {data?.docusignUrl && (
              <a
                href={data.docusignUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-(--admin-color-accent) hover:underline"
              >
                <span>Open in DocuSign</span>
                <span className="text-[12px]">&#x2197;</span>
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-(--theme-elevation-200) bg-(--theme-elevation-50) hover:bg-(--theme-elevation-150) text-[12px] font-medium text-(--theme-elevation-800) transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
