'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { formatTimeDisplay } from '@/utilities/helper/trip-scheduling-utils'
import { getUnifiedHistory } from '@/collections/trip-scheduling/io/get-unified-history'
import { requestHistoryCode } from '@/collections/trip-scheduling-history-codes/actions/request-code'
import { verifyHistoryCode } from '@/collections/trip-scheduling-history-codes/actions/verify-code'
import { signOutHistory } from '@/collections/trip-scheduling-history-codes/actions/sign-out'
import type { HistoryViewer } from '@/utilities/trip-scheduling-history-session'

export interface UnifiedRequest {
  id: string
  originType: 'booking' | 'adhoc'
  employeeName: string
  email: string
  phone: string
  purpose: string
  pickupLocation: string
  dropoffLocation: string
  requestedDate: string
  requestedTime: string
  bookingStatus:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'completed'
    | 'expired'
    | 'declined'
  operatorName: string
  vehicleName: string
  driverName: string
  driverPhone: string
  declineReason: string
  tripCost?: number | string
  zoneNumber?: string | number
  district?: string
  completedAt: string | null
  isTripSettled: boolean
}

export type ModeFilterType = 'All' | 'booking' | 'adhoc'

export type HistoryAuthStep = 'email' | 'code' | 'authorized'

const RESEND_COOLDOWN_SECONDS = 60
const CODE_SENT_MESSAGE =
  'If this email is authorized, a code has been sent. It may take up to a minute to arrive.'
const GENERIC_ERROR = 'Something went wrong. Please try again.'
// Must match the failure message getUnifiedHistory returns when there is no valid session.
const NOT_AUTHORIZED = 'Not authorized'

export function useBookingHistoryLedger(initialViewer: HistoryViewer | null, itemsPerPage = 12) {
  const [step, setStep] = useState<HistoryAuthStep>(initialViewer ? 'authorized' : 'email')
  const [viewerEmail, setViewerEmail] = useState(initialViewer?.email ?? '')
  const [emailInput, setEmailInput] = useState('')
  const [codeInput, setCodeInputRaw] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)


  const [masterLedger, setMasterLedger] = useState<UnifiedRequest[]>([])
  const [displayLedger, setDisplayLedger] = useState<UnifiedRequest[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [ledgerError, setLedgerError] = useState<string | null>(null)

  const [typeFilter, setTypeFilter] = useState<ModeFilterType>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  const setCodeInput = (value: string) => setCodeInputRaw(value.replace(/\D/g, '').slice(0, 6))

  const resetToEmailStep = useCallback((message = '') => {
    setStep('email')
    setViewerEmail('')
    setCodeInputRaw('')
    setAuthError('')
    setAuthMessage(message)
    setResendCountdown(0)
    setMasterLedger([])
    setLedgerError(null)
  }, [])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // SERVER ACTION FETCH PIPELINE
  useEffect(() => {
    if (step !== 'authorized') return

    const fetchUnifiedLedger = async () => {
      setTableLoading(true)
      setLedgerError(null)
      try {
        const result = await getUnifiedHistory()

        if (result.success && Array.isArray(result.docs)) {
          setMasterLedger(result.docs as UnifiedRequest[])
        } else if (result.error === NOT_AUTHORIZED) {
          resetToEmailStep('Your session has ended. Please request a new code.')
        } else {
          console.error('Unified ledger fetch failed:', result.error)
          setLedgerError(result.error || 'Failed to load the history ledger.')
        }
      } catch (err) {
        console.error('Master Ledger Sync Exception triggered', err)
        setLedgerError('An unexpected error occurred while loading the history ledger.')
      } finally {
        setTableLoading(false)
      }
    }

    fetchUnifiedLedger()
  }, [step, resetToEmailStep])


  useEffect(() => {
    let dataset = [...masterLedger]

    if (typeFilter !== 'All') {
      dataset = dataset.filter((item) => item.originType === typeFilter)
    }
    if (statusFilter !== 'All') {
      dataset = dataset.filter((item) => item.bookingStatus === statusFilter)
    }
    if (searchTerm.trim()) {
      const match = searchTerm.toLowerCase()
      dataset = dataset.filter(
        (item) =>
          item.employeeName.toLowerCase().includes(match) ||
          item.purpose.toLowerCase().includes(match) ||
          item.pickupLocation.toLowerCase().includes(match) ||
          item.dropoffLocation.toLowerCase().includes(match) ||
          String(item.zoneNumber || '')
            .toLowerCase()
            .includes(match) ||
          String(item.district || '')
            .toLowerCase()
            .includes(match),
      )
    }

    setDisplayLedger(dataset)
    setCurrentPage(1)
  }, [masterLedger, typeFilter, statusFilter, searchTerm])

  const paginatedDocs = displayLedger.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )
  const totalPages = Math.ceil(displayLedger.length / itemsPerPage) || 1

  const sendCode = async (email: string) => {
    setAuthLoading(true)
    setAuthError('')
    try {
      // The server answers the same way for every email, so the UI always moves on to the code step.
      await requestHistoryCode(email)
      setStep('code')
      setAuthMessage(CODE_SENT_MESSAGE)
      setResendCountdown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[History Code Request Error]:', err)
      setAuthError(GENERIC_ERROR)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault()
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    setCodeInputRaw('')
    await sendCode(email)
  }

  const handleResendCode = async () => {
    const email = emailInput.trim().toLowerCase()
    if (!email || resendCountdown > 0) return
    await sendCode(email)
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    const email = emailInput.trim().toLowerCase()
    if (!email || codeInput.length !== 6) return

    setAuthLoading(true)
    setAuthError('')
    try {
      const result = await verifyHistoryCode(email, codeInput)
      if (result.ok) {
        setViewerEmail(email)
        setCodeInputRaw('')
        setAuthMessage('')
        setStep('authorized')
      } else {
        setAuthError(result.error)
      }
    } catch (err) {
      console.error('[History Code Verify Error]:', err)
      setAuthError(GENERIC_ERROR)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleUseDifferentEmail = () => resetToEmailStep()

  const handleSignOut = async () => {
    try {
      await signOutHistory()
    } catch (err) {
      console.error('[History Sign-out Error]:', err)
    }
    setEmailInput('')
    resetToEmailStep()
  }


  const handleExportTrigger = () => {
    if (displayLedger.length === 0) return

    const headers = [
      'Allocation Type',
      'ID',
      'Requester Name',
      'Email',
      'Phone',
      'Pickup Location',
      'Destination',
      'Zone Number',
      'District Name',
      'Operator',
      'Travel Date',
      'Travel Time',
      'Vehicle Needed',
      'Category / Reason',
      'Status',
      'Driver Name',
      'Driver Phone',
      'Decline Reason',
      'Trip Cost (QAR)',
      'Completed At',
      'Trip Settled',
    ]

    const escapeCSV = (val: string | number) => {
      const clean = String(val).replace(/"/g, '""')
      return `"${clean}"`
    }

    const csvRows = displayLedger.map((row) => {
      return [
        row.originType.toUpperCase(),
        row.id,
        row.employeeName,
        row.email,
        row.phone,
        row.pickupLocation,
        row.dropoffLocation,
        row.zoneNumber || 'N/A',
        row.district || 'N/A',
        row.operatorName || 'N/A',
        row.requestedDate,
        formatTimeDisplay(row.requestedTime),
        row.vehicleName || 'N/A',
        row.purpose,
        row.bookingStatus,
        row.driverName || 'Not Assigned',
        row.driverPhone || 'N/A',
        row.declineReason || 'N/A',
        row.tripCost !== undefined && row.tripCost !== null ? row.tripCost : '0',
        row.completedAt || 'N/A',
        row.isTripSettled ? 'Yes' : 'No',
      ]
        .map(escapeCSV)
        .join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n')
    const encodedUri = encodeURI(csvContent)

    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `doha-oasis-transport-ledger-${new Date().toISOString().split('T')[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    // auth
    step,
    viewerEmail,
    authLoading,
    authMessage,
    authError,
    emailInput,
    setEmailInput,
    codeInput,
    setCodeInput,
    resendCountdown,
    handleRequestCode,
    handleVerifyCode,
    handleResendCode,
    handleUseDifferentEmail,
    handleSignOut,
    // data
    displayLedger,
    tableLoading,
    ledgerError,
    // filters
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    // pagination
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedDocs,
    // export
    handleExportTrigger,
  }
}
