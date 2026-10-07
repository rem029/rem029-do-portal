'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { useAuth, Button } from '@payloadcms/ui'
import { User } from '@/payload-types'
import {
  fetchDashboardEnvelopes,
  createDashboardEnvelopeAction,
  createSigningViewAction,
  getDocuSignDashboardAccessAction,
  DashboardEnvelopeItem,
} from './actions'
import { EnvelopeStatusModal } from './components/envelope-status-modal'

interface FormRecipientState {
  name: string
  email: string
  role: 'signer' | 'approver' | 'cc'
  routingOrder: number
}

const inputClass =
  'w-full bg-(--theme-input-bg,var(--theme-elevation-0)) border border-(--theme-elevation-150) rounded px-3 py-2 text-[13.5px] text-(--theme-elevation-800) placeholder:text-(--theme-elevation-400) focus:border-(--theme-elevation-400) outline-none transition-colors'

const labelClass = 'block text-[12px] font-semibold text-(--theme-elevation-700) mb-1'

const getStatusBadge = (status: string) => {
  const normalized = (status || 'created').toLowerCase()
  switch (normalized) {
    case 'completed':
    case 'signed':
      return (
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[14px] font-semibold uppercase tracking-wider bg-(--theme-success-500)/10 text-(--theme-success-500) border border-(--theme-success-500)/20">
          Completed
        </span>
      )
    case 'sent':
      return (
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[14px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
          Sent
        </span>
      )
    case 'delivered':
      return (
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[14px] font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
          Delivered
        </span>
      )
    case 'declined':
    case 'voided':
      return (
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[14px] font-semibold uppercase tracking-wider bg-(--theme-error-500)/10 text-(--theme-error-500) border border-(--theme-error-500)/20">
          {normalized}
        </span>
      )
    case 'created':
    case 'draft':
    default:
      return (
        <span className="shrink-0 px-2 py-0.5 rounded-full text-[14px] font-semibold uppercase tracking-wider bg-(--theme-elevation-200) text-(--theme-elevation-600) border border-(--theme-elevation-300)">
          Draft
        </span>
      )
  }
}

type DashboardTab = 'sent' | 'action' | 'all'

const TAB_STORAGE_KEY = 'docusign_dashboard_active_tab'
const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'sent', label: 'Sent by you' },
  { id: 'action', label: 'For action' },
  { id: 'all', label: 'All' },
]

const DocusignDashboard: React.FC = () => {
  const { user, fetchFullUser } = useAuth<User>()

  const [envelopes, setEnvelopes] = useState<DashboardEnvelopeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDocuSignAdmin, setIsDocuSignAdmin] = useState(false)
  const [notDocuSignUser, setNotDocuSignUser] = useState(false)
  const [tabConsentRequired, setTabConsentRequired] = useState<{
    required: boolean
    url?: string
  }>({ required: false })

  // Filtering & Tab State
  const [activeTab, setActiveTab] = useState<DashboardTab>('sent')
  const [tabRestored, setTabRestored] = useState(false)
  const [dateWindow, setDateWindow] = useState<'7d' | '1mo' | '3mo'>('7d')
  const [pageSize, setPageSize] = useState<number>(10)
  const [startPosition, setStartPosition] = useState<number>(0)
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined)
  const [nextStartPosition, setNextStartPosition] = useState<number | undefined>(undefined)

  // Detail Modal State
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(null)

  // Create Modal & Iframe state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [setSigningOrder, setSetSigningOrder] = useState(true)
  const [recipients, setRecipients] = useState<FormRecipientState[]>([
    { name: '', email: '', role: 'signer', routingOrder: 1 },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [consentAuthUrl, setConsentAuthUrl] = useState<string | null>(null)
  const [senderViewUrl, setSenderViewUrl] = useState<string | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const popupWindowRef = useRef<Window | null>(null)
  const signingWindowRef = useRef<Window | null>(null)
  const [signingEnvelopeId, setSigningEnvelopeId] = useState<string | null>(null)
  const loadRequestIdRef = useRef(0)

  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    fetchFullUser()
  }, [fetchFullUser])

  useEffect(() => {
    if (!user?.id) return
    getDocuSignDashboardAccessAction()
      .then(setHasAccess)
      .catch(() => setHasAccess(false))
  }, [user?.id])

  const loadEnvelopes = useCallback(
    async (
      targetStartPos = startPosition,
      targetDateWindow = dateWindow,
      targetPageSize = pageSize,
      targetTab = activeTab,
    ) => {
      // Tab/filter switches can overlap; only the latest request may update state
      const requestId = ++loadRequestIdRef.current
      setLoading(true)
      setError(null)
      setNotDocuSignUser(false)
      setTabConsentRequired({ required: false })
      try {
        const res = await fetchDashboardEnvelopes({
          tab: targetTab,
          dateWindow: targetDateWindow,
          count: targetPageSize,
          startPosition: targetStartPos,
        })
        if (requestId !== loadRequestIdRef.current) return
        if (res.success) {
          setEnvelopes(res.docs)
          setIsDocuSignAdmin(res.isDocuSignAdmin)
          setTotalCount(res.totalCount)
          setNextStartPosition(res.nextStartPosition)
          setStartPosition(targetStartPos)
          if (res.notDocuSignUser) {
            setNotDocuSignUser(true)
          }
        } else {
          if (res.consentRequired && res.authorizationUrl) {
            setTabConsentRequired({ required: true, url: res.authorizationUrl })
          } else {
            setError(res.error || 'Failed to load DocuSign envelopes')
          }
        }
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Failed to load envelopes')
      } finally {
        if (requestId === loadRequestIdRef.current) setLoading(false)
      }
    },
    [startPosition, dateWindow, pageSize, activeTab],
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY)
      if (saved === 'sent' || saved === 'action' || saved === 'all') setActiveTab(saved)
    } catch {
      // storage unavailable (private mode etc.) - keep the default tab
    }
    setTabRestored(true)
  }, [])

  useEffect(() => {
    if (user && tabRestored && hasAccess) {
      loadEnvelopes(0, dateWindow, pageSize, activeTab)
    }
  }, [user, tabRestored, hasAccess, dateWindow, pageSize, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for DocuSign return postMessage from the tab opened for tagging/sending or signing
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data && event.data.type === 'DOCUSIGN_EMBEDDED_SENDING_COMPLETE') {
        popupWindowRef.current?.close()
        popupWindowRef.current = null
        setSenderViewUrl(null)
        setPopupBlocked(false)
        setIsCreateOpen(false)
        resetCreateForm()
        loadEnvelopes(0, dateWindow, pageSize, activeTab)
      } else if (event.data && event.data.type === 'DOCUSIGN_SIGNING_COMPLETE') {
        signingWindowRef.current?.close()
        signingWindowRef.current = null
        loadEnvelopes(startPosition, dateWindow, pageSize, activeTab)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [loadEnvelopes, startPosition, dateWindow, pageSize, activeTab])

  // Detect the user closing the DocuSign tab manually without a postMessage completion signal
  useEffect(() => {
    const interval = setInterval(() => {
      if (senderViewUrl && !popupBlocked && popupWindowRef.current?.closed) {
        popupWindowRef.current = null
        setSenderViewUrl(null)
        setIsCreateOpen(false)
        resetCreateForm()
        loadEnvelopes(0, dateWindow, pageSize, activeTab)
      }
      if (signingWindowRef.current?.closed) {
        signingWindowRef.current = null
        loadEnvelopes(startPosition, dateWindow, pageSize, activeTab)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [senderViewUrl, popupBlocked, loadEnvelopes, startPosition, dateWindow, pageSize, activeTab])

  const handleSignEnvelope = async (envelopeId: string) => {
    if (signingEnvelopeId) return
    setSigningEnvelopeId(envelopeId)
    setError(null)

    // Open popup synchronously in the click handler to avoid popup blockers
    const popup = window.open('about:blank', 'docusign-signing-view')
    signingWindowRef.current = popup

    try {
      const res = await createSigningViewAction(envelopeId)

      if (!res.success) {
        popup?.close()
        signingWindowRef.current = null
        if (res.consentRequired && res.authorizationUrl) {
          setTabConsentRequired({ required: true, url: res.authorizationUrl })
        } else {
          setError(res.message || 'Failed to open signing session')
        }
        return
      }

      if (res.signingUrl) {
        if (popup && !popup.closed) {
          popup.location.href = res.signingUrl
          popup.focus()
        } else {
          window.open(res.signingUrl, '_blank')
        }
      }
    } catch (err) {
      popup?.close()
      signingWindowRef.current = null
      setError(err instanceof Error ? err.message : 'An error occurred opening the signing view')
    } finally {
      setSigningEnvelopeId(null)
    }
  }

  // User visibility check
  // No usable DocuSign account (not a member, or integration not configured) - hide the widget
  if (!user || !hasAccess || notDocuSignUser) return null

  const resetCreateForm = () => {
    setSelectedFile(null)
    setDocumentName('')
    setEmailSubject('')
    setEmailMessage('')
    setSetSigningOrder(true)
    setRecipients([{ name: '', email: '', role: 'signer', routingOrder: 1 }])
    setCreateError(null)
    setConsentAuthUrl(null)
    setSenderViewUrl(null)
    setPopupBlocked(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenCreate = () => {
    resetCreateForm()
    setIsCreateOpen(true)
  }

  const handleCloseCreate = () => {
    if (isSubmitting) return
    const wasAwaitingSenderView = Boolean(senderViewUrl)
    popupWindowRef.current?.close()
    popupWindowRef.current = null
    setPopupBlocked(false)
    setIsCreateOpen(false)
    resetCreateForm()
    if (wasAwaitingSenderView) {
      loadEnvelopes(0, dateWindow, pageSize, activeTab)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      setDocumentName(baseName)
      setEmailSubject(`Please sign ${baseName}`)
    }
  }

  const handleAddRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      {
        name: '',
        email: '',
        role: 'signer',
        routingOrder: prev.length + 1,
      },
    ])
  }

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length <= 1) return
    setRecipients((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((r, idx) => ({ ...r, routingOrder: idx + 1 }))
    })
  }

  const handleRecipientChange = (
    index: number,
    field: keyof FormRecipientState,
    value: string | number,
  ) => {
    setRecipients((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setCreateError('Please select a document file to upload.')
      return
    }

    if (!documentName.trim()) {
      setCreateError('Document name is required.')
      return
    }

    for (let i = 0; i < recipients.length; i++) {
      if (!recipients[i].name.trim()) {
        setCreateError(`Recipient #${i + 1} requires a name.`)
        return
      }
      if (!recipients[i].email.trim()) {
        setCreateError(`Recipient #${i + 1} requires a valid email.`)
        return
      }
    }

    setIsSubmitting(true)
    setCreateError(null)
    setConsentAuthUrl(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const metadata = {
        documentName: documentName.trim(),
        emailSubject: emailSubject.trim() || `Please sign ${documentName.trim()}`,
        emailMessage: emailMessage.trim(),
        recipients: recipients.map((r, i) => ({
          name: r.name.trim(),
          email: r.email.trim(),
          role: r.role,
          routingOrder: setSigningOrder ? r.routingOrder : i + 1,
        })),
      }

      formData.append('metadata', JSON.stringify(metadata))

      const result = await createDashboardEnvelopeAction(formData)

      if (!result.success) {
        if (result.consentRequired && result.authorizationUrl) {
          setConsentAuthUrl(result.authorizationUrl)
        } else {
          setCreateError(result.message || 'Failed to create envelope')
        }
        setIsSubmitting(false)
        return
      }

      if (result.senderViewUrl) {
        setSenderViewUrl(result.senderViewUrl)
        setIsSubmitting(false)

        // Attempt automatic popup open immediately (browser activation may be expired, fallback link provided)
        const popup = window.open(result.senderViewUrl, 'docusign-sender-view')
        if (popup && !popup.closed) {
          popupWindowRef.current = popup
          popup.focus()
          setPopupBlocked(false)
        } else {
          setPopupBlocked(true)
        }
      } else {
        setIsCreateOpen(false)
        resetCreateForm()
        loadEnvelopes(0, dateWindow, pageSize, activeTab)
        setIsSubmitting(false)
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const handleTabChange = (newTab: DashboardTab) => {
    setActiveTab(newTab)
    setStartPosition(0)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, newTab)
    } catch {
      // storage unavailable - selection just won't persist
    }
  }

  const handlePrevPage = () => {
    const newPos = Math.max(0, startPosition - pageSize)
    loadEnvelopes(newPos, dateWindow, pageSize, activeTab)
  }

  const handleNextPage = () => {
    const newPos = nextStartPosition ?? startPosition + pageSize
    loadEnvelopes(newPos, dateWindow, pageSize, activeTab)
  }

  const handleDateWindowChange = (newWindow: '7d' | '1mo' | '3mo') => {
    setDateWindow(newWindow)
    setStartPosition(0)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setStartPosition(0)
  }

  const canGoPrev = startPosition > 0
  const canGoNext =
    nextStartPosition !== undefined ||
    (typeof totalCount === 'number' && startPosition + pageSize < totalCount)

  const displayStart = envelopes.length > 0 ? startPosition + 1 : 0
  const displayEnd =
    typeof totalCount === 'number'
      ? Math.min(startPosition + envelopes.length, totalCount)
      : startPosition + envelopes.length

  const getSubtitle = () => {
    if (activeTab === 'sent') return 'Showing envelopes sent by you'
    if (activeTab === 'action') return 'Showing envelopes awaiting your signature'
    return isDocuSignAdmin
      ? 'Showing all company envelopes'
      : 'Showing your envelopes (sent & for action)'
  }

  const dateWindowLabel =
    dateWindow === '7d' ? 'last 7 days' : dateWindow === '1mo' ? 'last 1 month' : 'last 3 months'

  return (
    <div className="twp mb-8 p-0 font-sans">
      {/* Widget Container */}
      <div className="bg-(--theme-elevation-50) shadow-sm rounded-lg p-5 border border-(--theme-elevation-150) flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-(--theme-elevation-150)">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-(--admin-color-accent)/10 border border-(--admin-color-accent)/20 flex items-center justify-center text-(--admin-color-accent)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16.5px] font-bold text-(--theme-elevation-800) m-0">
                  DocuSign Envelopes
                </h3>
                {typeof totalCount === 'number' && (
                  <span className="px-2 py-0.5 text-[12px] font-semibold rounded-full bg-(--theme-elevation-150) text-(--theme-elevation-600)">
                    {totalCount}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-(--theme-elevation-400) m-0">
                {getSubtitle()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadEnvelopes(startPosition, dateWindow, pageSize, activeTab)}
              disabled={loading}
              className="p-2 rounded border border-(--theme-elevation-200) text-(--theme-elevation-600) hover:bg-(--theme-elevation-100) hover:text-(--theme-elevation-800) disabled:opacity-40 transition-colors"
              title="Refresh envelopes"
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
            <Button buttonStyle="primary" size="small" onClick={handleOpenCreate}>
              + Create Envelope
            </Button>
          </div>
        </div>

        {/* Filter Controls & Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-[12px]">
          {/* Date Window Options */}
          <div className="flex items-center gap-2">
            <span className="text-(--theme-elevation-400) font-medium">Time range:</span>
            <div className="inline-flex rounded-md border border-(--theme-elevation-200) bg-(--theme-elevation-100) p-0.5">
              <button
                type="button"
                onClick={() => handleDateWindowChange('7d')}
                className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
                  dateWindow === '7d'
                    ? 'bg-(--theme-elevation-0) text-(--admin-color-accent) shadow-xs'
                    : 'text-(--theme-elevation-600) hover:text-(--theme-elevation-900)'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleDateWindowChange('1mo')}
                className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
                  dateWindow === '1mo'
                    ? 'bg-(--theme-elevation-0) text-(--admin-color-accent) shadow-xs'
                    : 'text-(--theme-elevation-600) hover:text-(--theme-elevation-900)'
                }`}
              >
                Last 1 Month
              </button>
              <button
                type="button"
                onClick={() => handleDateWindowChange('3mo')}
                className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors ${
                  dateWindow === '3mo'
                    ? 'bg-(--theme-elevation-0) text-(--admin-color-accent) shadow-xs'
                    : 'text-(--theme-elevation-600) hover:text-(--theme-elevation-900)'
                }`}
              >
                Last 3 Months
              </button>
            </div>
          </div>

          {/* Page Size & Pagination Controls */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-(--theme-elevation-400)">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-(--theme-input-bg,var(--theme-elevation-0)) border border-(--theme-elevation-200) rounded px-2 py-1 text-[12px] text-(--theme-elevation-800) outline-none cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            {envelopes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-(--theme-elevation-500) text-[12px]">
                  {displayStart}–{displayEnd}
                  {typeof totalCount === 'number' ? ` of ${totalCount}` : ''}
                </span>

                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={!canGoPrev || loading}
                    className="px-2 py-1 rounded border border-(--theme-elevation-200) bg-(--theme-elevation-100) hover:bg-(--theme-elevation-150) disabled:opacity-30 disabled:cursor-not-allowed text-(--theme-elevation-700) font-medium"
                    title="Previous page"
                  >
                    &larr; Prev
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={!canGoNext || loading}
                    className="px-2 py-1 rounded border border-(--theme-elevation-200) bg-(--theme-elevation-100) hover:bg-(--theme-elevation-150) disabled:opacity-30 disabled:cursor-not-allowed text-(--theme-elevation-700) font-medium"
                    title="Next page"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-(--theme-elevation-150) pt-1 mb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-2 text-[12px] font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-(--admin-color-accent) text-(--admin-color-accent)'
                  : 'border-transparent text-(--theme-elevation-600) hover:text-(--theme-elevation-900)'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="mt-1">
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-(--theme-elevation-400)">
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
              <span className="text-[12px]">Loading envelopes from DocuSign...</span>
            </div>
          ) : tabConsentRequired.required && tabConsentRequired.url ? (
            <div className="py-8 px-4 text-center flex flex-col items-center justify-center bg-(--theme-elevation-50) rounded-lg border border-(--theme-elevation-200) max-w-lg mx-auto my-4">
              <h4 className="text-[13.5px] font-semibold text-(--theme-elevation-900) mb-2">
                DocuSign Authorization Required
              </h4>
              <p className="text-[12px] text-(--theme-elevation-500) mb-4">
                Your account ({user.email}) needs one-time authorization to view your DocuSign envelopes.
              </p>
              <Button el="anchor" url={tabConsentRequired.url} newTab buttonStyle="primary" size="small">
                Connect DocuSign Account &rarr;
              </Button>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-(--theme-error-50) border border-(--theme-error-200) text-(--theme-error-600) text-[13.5px] flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => loadEnvelopes(startPosition, dateWindow, pageSize, activeTab)}
                className="underline font-semibold hover:opacity-80 ml-4 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : envelopes.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-(--theme-elevation-100) rounded-lg border border-dashed border-(--theme-elevation-200)">
              <div className="w-12 h-12 rounded-full bg-(--theme-elevation-200) text-(--theme-elevation-500) flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-[13.5px] font-semibold text-(--theme-elevation-800) mb-1">
                {activeTab === 'sent'
                  ? 'No envelopes sent by you'
                  : activeTab === 'action'
                    ? 'Nothing awaiting your signature'
                    : 'No envelopes found'}
              </h4>
              <p className="text-[12px] text-(--theme-elevation-400) max-w-sm mb-4">
                {activeTab === 'sent'
                  ? `No envelopes sent by you in the ${dateWindowLabel}.`
                  : activeTab === 'action'
                    ? `Nothing awaiting your signature in the ${dateWindowLabel}.`
                    : `No DocuSign envelopes found in the ${dateWindowLabel}.`}
              </p>
              <Button buttonStyle="primary" size="small" onClick={handleOpenCreate}>
                + Create Envelope
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-(--theme-elevation-150) text-(--theme-elevation-400) uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">Document</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recipients</th>
                    <th className="py-2.5 px-3">Sender</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--theme-elevation-100)">
                  {envelopes.map((env) => (
                    <tr
                      key={env.id}
                      className="hover:bg-(--theme-elevation-100) transition-colors text-(--theme-elevation-800)"
                    >
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[13.5px] text-(--theme-elevation-900) truncate max-w-xs">
                            {env.documentName}
                          </span>
                          {env.emailSubject && env.emailSubject !== env.documentName && (
                            <span className="text-[14px] text-(--theme-elevation-400) truncate max-w-xs">
                              {env.emailSubject}
                            </span>
                          )}
                          <span className="text-[13px] text-(--theme-elevation-400) font-mono">
                            {env.docusignEnvelopeId}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">{getStatusBadge(env.status)}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          <span className="font-medium text-(--theme-elevation-700)">
                            {env.recipientCount} {env.recipientCount === 1 ? 'Recipient' : 'Recipients'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {env.recipients.map((r, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[13px] bg-(--theme-elevation-150) text-(--theme-elevation-600)"
                                title={`${r.name} (${r.email}) - ${r.role || 'signer'}`}
                              >
                                {r.name.split(' ')[0] || r.email}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-(--theme-elevation-600)">
                          {env.senderName || env.senderEmail || '—'}
                        </div>
                        {env.senderName && env.senderEmail && (
                          <div className="text-[12px] text-(--theme-elevation-500)">{env.senderEmail}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-(--theme-elevation-500) whitespace-nowrap">
                        {env.createdAt
                          ? format(new Date(env.createdAt), 'MMM dd, yyyy HH:mm')
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedEnvelopeId(env.docusignEnvelopeId)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded border border-(--theme-elevation-200) text-(--theme-elevation-600) hover:bg-(--theme-elevation-150) hover:text-(--theme-elevation-900) focus:outline-none focus:ring-1 focus:ring-(--admin-color-accent) transition-colors cursor-pointer"
                            aria-label="View details"
                            title="View details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          {env.docusignUrl && (
                            <a
                              href={env.docusignUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-(--theme-elevation-500) hover:text-(--theme-elevation-800) hover:underline font-medium text-[12px]"
                              title="Opens in DocuSign in a new tab"
                              aria-label="Opens in DocuSign in a new tab"
                            >
                              DocuSign &#x2197;
                            </a>
                          )}
                          {env.canSign && (
                            <button
                              type="button"
                              disabled={signingEnvelopeId === env.docusignEnvelopeId}
                              onClick={() => handleSignEnvelope(env.docusignEnvelopeId)}
                              className="px-2.5 py-1 rounded bg-(--admin-color-primary) text-(--admin-color-primary-content) hover:opacity-90 font-semibold text-[12px] transition-opacity disabled:opacity-50 cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            >
                              {signingEnvelopeId === env.docusignEnvelopeId ? (
                                <>
                                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span>Opening…</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span>Sign</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal Component */}
      <EnvelopeStatusModal
        isOpen={Boolean(selectedEnvelopeId)}
        envelopeId={selectedEnvelopeId}
        onClose={() => setSelectedEnvelopeId(null)}
      />

      {/* Blocking Create Progress Overlay while creating */}
      {isSubmitting && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto select-none" />
          <div className="relative w-full max-w-md bg-(--theme-elevation-50) border border-(--theme-elevation-150) rounded-xl shadow-2xl z-10 p-8 flex flex-col items-center justify-center text-center gap-4 text-(--theme-elevation-800)">
            <div className="w-12 h-12 rounded-full bg-(--admin-color-accent)/10 text-(--admin-color-accent) flex items-center justify-center">
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
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-[15px] font-bold text-(--theme-elevation-900) m-0">
                Creating your envelope…
              </h3>
              <p className="text-[12px] text-(--theme-elevation-500) max-w-xs m-0">
                Preparing draft and signature tags. You&apos;ll be taken to DocuSign in a new tab.
              </p>
            </div>

            <div className="w-full bg-(--theme-elevation-150) rounded-full h-1.5 overflow-hidden">
              <div className="bg-(--admin-color-accent) h-1.5 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Create Form or Embedded Sender View */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={isSubmitting ? undefined : handleCloseCreate}
          />

          <div
            className={`relative w-full ${
              senderViewUrl ? 'max-w-md' : 'max-w-2xl max-h-[90vh]'
            } bg-(--theme-elevation-50) border border-(--theme-elevation-150) rounded-xl shadow-2xl z-10 flex flex-col overflow-hidden text-(--theme-elevation-800)`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--theme-elevation-150) bg-(--theme-elevation-50)">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-(--admin-color-accent)/10 text-(--admin-color-accent) flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-(--theme-elevation-900) m-0">
                  {senderViewUrl ? `Tag & Send: ${documentName}` : 'Create DocuSign Envelope'}
                </h3>
              </div>

              {!isSubmitting && (
                <button
                  onClick={handleCloseCreate}
                  className="p-1 rounded-md text-(--theme-elevation-400) hover:text-(--theme-elevation-700) hover:bg-(--theme-elevation-150) transition-colors cursor-pointer"
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
              )}
            </div>

            {/* Modal Body */}
            {senderViewUrl ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 grow text-center">
                {popupBlocked ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <p className="text-[13.5px] font-semibold text-(--theme-elevation-800) m-0">
                      Ready to Tag &amp; Send in DocuSign
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // Open popup via button click to maintain user-activation and preserve window.opener
                        const popup = window.open(senderViewUrl, 'docusign-sender-view')
                        if (popup) {
                          popupWindowRef.current = popup
                          popup.focus()
                          setPopupBlocked(false)
                        }
                      }}
                      className="px-4 py-2 bg-(--admin-color-primary) text-(--admin-color-primary-content) rounded font-semibold text-[12px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                      Open DocuSign to Tag &amp; Send &rarr;
                    </button>
                    <p className="text-[12px] text-(--theme-elevation-400) max-w-sm m-0">
                      Your browser blocked the new tab — click above, or allow pop-ups for this site to open it automatically next time.
                    </p>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 animate-spin text-(--theme-elevation-400)"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
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
                    <p className="text-[13.5px] font-semibold text-(--theme-elevation-800) m-0">
                      Waiting for you to finish in DocuSign…
                    </p>
                    <p className="text-[12px] text-(--theme-elevation-500) max-w-sm m-0">
                      Place recipient signature tags and click <strong>Send</strong> over there —
                      this dialog updates automatically once you&apos;re done.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        buttonStyle="secondary"
                        size="small"
                        onClick={() => popupWindowRef.current?.focus()}
                      >
                        Switch to DocuSign Tab
                      </Button>
                    </div>
                  </>
                )}
                <div className="mt-2">
                  <Button buttonStyle="secondary" size="small" onClick={handleCloseCreate}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitCreate}
                className="flex flex-col grow overflow-y-auto p-6 gap-6"
              >
                {/* 1. Add Documents */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-(--theme-elevation-500) m-0">
                    1. Document
                  </h4>
                  <div
                    className="border-2 border-dashed border-(--theme-elevation-200) hover:border-(--admin-color-accent) rounded-lg p-5 flex flex-col items-center justify-center gap-2 bg-(--theme-elevation-100) cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-(--theme-elevation-200) text-(--theme-elevation-600) flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-[13.5px] font-semibold text-(--theme-elevation-900) m-0">
                          {selectedFile.name}
                        </p>
                        <p className="text-[12px] text-(--theme-elevation-400) m-0">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-[13.5px] font-semibold text-(--theme-elevation-800) m-0">
                          Click or drag a file to upload
                        </p>
                        <p className="text-[12px] text-(--theme-elevation-400) m-0">
                          Supports PDF, DOC, DOCX
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="mt-2">
                      <label className={labelClass}>Document Title</label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="e.g. Service Agreement"
                        required
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Add Recipients */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-(--theme-elevation-500) m-0">
                      2. Add Recipients
                    </h4>
                    <label className="flex items-center gap-1.5 text-[12px] text-(--theme-elevation-600) cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={setSigningOrder}
                        onChange={(e) => setSetSigningOrder(e.target.checked)}
                        className="rounded cursor-pointer"
                      />
                      Set signing order
                    </label>
                  </div>

                  <div className="space-y-3">
                    {recipients.map((recipient, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-(--theme-elevation-100) border border-(--theme-elevation-200) rounded-lg flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {setSigningOrder && (
                              <span className="w-5 h-5 rounded-full bg-(--theme-elevation-200) text-(--theme-elevation-700) text-[14px] font-bold flex items-center justify-center">
                                {recipient.routingOrder}
                              </span>
                            )}
                            <span className="text-[12px] font-semibold text-(--theme-elevation-700)">
                              Recipient #{idx + 1}
                            </span>
                          </div>

                          {recipients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(idx)}
                              className="text-[12px] text-(--theme-error-500) hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}>Name</label>
                            <input
                              type="text"
                              value={recipient.name}
                              onChange={(e) => handleRecipientChange(idx, 'name', e.target.value)}
                              placeholder="Full Name"
                              required
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Email</label>
                            <input
                              type="email"
                              value={recipient.email}
                              onChange={(e) => handleRecipientChange(idx, 'email', e.target.value)}
                              placeholder="email@example.com"
                              required
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Action / Role</label>
                            <select
                              value={recipient.role}
                              onChange={(e) =>
                                handleRecipientChange(
                                  idx,
                                  'role',
                                  e.target.value as 'signer' | 'approver' | 'cc',
                                )
                              }
                              className={inputClass}
                            >
                              <option value="signer">Needs to Sign</option>
                              <option value="approver">Approver</option>
                              <option value="cc">Receives a Copy</option>
                            </select>
                          </div>
                        </div>

                        {setSigningOrder && (
                          <div className="w-32">
                            <label className={labelClass}>Routing Order</label>
                            <input
                              type="number"
                              min="1"
                              value={recipient.routingOrder}
                              onChange={(e) =>
                                handleRecipientChange(
                                  idx,
                                  'routingOrder',
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="self-start text-[12px] font-semibold text-(--admin-color-accent) hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    + Add Recipient
                  </button>
                </div>

                {/* 3. Add Message */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-(--theme-elevation-500) m-0">
                    3. Message
                  </h4>
                  <div>
                    <label className={labelClass}>Email Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Please sign this document"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Message (Optional)</label>
                    <textarea
                      rows={2}
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Enter a message for all recipients..."
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Consent Flow (428) */}
                {consentAuthUrl && (
                  <div className="p-4 rounded-lg bg-(--theme-warning-50) border border-(--theme-warning-200) text-(--theme-warning-800) flex flex-col gap-2">
                    <p className="font-bold text-[13.5px] text-(--theme-warning-800)">
                      DocuSign Authorization Required
                    </p>
                    <p className="text-[12px] text-(--theme-warning-700)">
                      Your account ({user.email}) needs one-time authorization to impersonate and send
                      documents via DocuSign. Click below to grant access in a new window, then retry.
                    </p>
                    <div className="mt-1">
                      <Button
                        el="anchor"
                        url={consentAuthUrl}
                        newTab
                        buttonStyle="primary"
                        size="small"
                      >
                        Connect DocuSign Account &rarr;
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {createError && (
                  <div className="p-3 rounded bg-(--theme-error-50) border border-(--theme-error-200) text-(--theme-error-600) text-[12px]">
                    {createError}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="mt-4 pt-4 border-t border-(--theme-elevation-150) flex items-center justify-end gap-3">
                  <Button
                    buttonStyle="secondary"
                    onClick={handleCloseCreate}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    buttonStyle="primary"
                    disabled={isSubmitting || !selectedFile}
                  >
                    {isSubmitting ? 'Preparing Sender View...' : 'Prepare & Send Document'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocusignDashboard
