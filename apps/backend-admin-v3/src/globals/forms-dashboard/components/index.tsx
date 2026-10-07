'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth, useModal } from '@payloadcms/ui'
import { User } from '@/payload-types'
import {
  fetchAccessibleForms,
  fetchFormSubmissions,
  updateSubmissionStatus,
  updateSubmissionData,
  archiveSubmission,
  FormSubmissionRow,
  SubmissionStatusFilter,
} from './actions'
import { SubmissionDetailModal, detailModalSlug } from './submission-detail-modal'
import { ExportCSVModal } from './export-csv-modal'
import { DashboardToolbar } from './dashboard-toolbar'
import { FormsSidebar } from './forms-sidebar'
import { SubmissionsTable, DynamicField } from './submissions-table'
import { ColumnSelector } from './column-selector'
import { extractFormFields } from '@/utilities/forms-dashboard'

const LS_FORM = 'fdb-selected-form'
const LS_START = 'fdb-start-date'
const LS_END = 'fdb-end-date'
const LS_STATUS_FILTER = 'fdb-status-filter'
const LS_COLUMNS = (formId: string) => `fdb-columns-${formId}`
const LS_ORDER = (formId: string) => `fdb-order-${formId}`

const FormsDashboardField: React.FC = () => {
  const { user, fetchFullUser } = useAuth<User>()
  const { openModal, closeModal } = useModal()

  const [forms, setForms] = useState<ReturnType<typeof fetchAccessibleForms> extends Promise<infer T> ? T : never>([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [submissions, setSubmissions] = useState<FormSubmissionRow[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    totalPages: 0,
    hasPrevPage: false,
    hasNextPage: false,
  })
  const [loadingForms, setLoadingForms] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>('active')
  const [formsInitialized, setFormsInitialized] = useState(false)
  // null = not yet loaded for this form; Set = explicit selection (may be empty)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<string> | null>(null)
  const [fieldOrder, setFieldOrder] = useState<string[]>([])

  useEffect(() => {
    fetchFullUser()
  }, [fetchFullUser])

  useEffect(() => {
    setStartDate(localStorage.getItem(LS_START) || '')
    setEndDate(localStorage.getItem(LS_END) || '')
    const savedStatus = localStorage.getItem(LS_STATUS_FILTER) as SubmissionStatusFilter | null
    if (savedStatus === 'active' || savedStatus === 'archived' || savedStatus === 'all') {
      setStatusFilter(savedStatus)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoadingForms(true)
      try {
        const result = await fetchAccessibleForms(user.id)
        setForms(result)
      } finally {
        setLoadingForms(false)
      }
    }
    load()
  }, [user?.id])

  useEffect(() => {
    if (loadingForms) return
    if (forms.length === 0) {
      setFormsInitialized(true)
      return
    }
    const saved = localStorage.getItem(LS_FORM) || ''
    const isValid = saved && forms.some((f) => f.value === saved)
    setSelectedFormId(isValid ? saved : forms[0].value)
    setFormsInitialized(true)
  }, [forms, loadingForms])

  const loadSubmissions = useCallback(async () => {
    if (!user?.id || !selectedFormId) return
    setLoadingSubmissions(true)
    try {
      const result = await fetchFormSubmissions(
        user.id,
        selectedFormId,
        page,
        limit,
        startDate || undefined,
        endDate || undefined,
        debouncedSearchQuery || undefined,
        statusFilter,
      )
      setSubmissions(result.docs)
      setPagination({
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      })
    } finally {
      setLoadingSubmissions(false)
    }
  }, [user?.id, selectedFormId, page, limit, startDate, endDate, debouncedSearchQuery, statusFilter])

  useEffect(() => {
    if (user?.id && selectedFormId) loadSubmissions()
  }, [loadSubmissions, user?.id, selectedFormId])

  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId)
    localStorage.setItem(LS_FORM, formId)
    setPage(1)
    setSidebarOpen(false)
  }

  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    localStorage.setItem(LS_START, val)
    setPage(1)
  }

  const handleEndDateChange = (val: string) => {
    setEndDate(val)
    localStorage.setItem(LS_END, val)
    setPage(1)
  }

  const handleStatusFilterChange = (val: SubmissionStatusFilter) => {
    setStatusFilter(val)
    localStorage.setItem(LS_STATUS_FILTER, val)
    setPage(1)
  }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery])

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    if (!user?.id) return
    const res = await updateSubmissionStatus(user.id, submissionId, newStatus)
    if (res.success) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, formStatus: newStatus } : s)),
      )
    } else {
      alert(`Error updating status: ${res.error}`)
    }
  }

  const handleDataSave = async (submissionId: string, updatedData: any[]) => {
    if (!user?.id) return
    const res = await updateSubmissionData(user.id, submissionId, updatedData)
    if (res.success) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, submissionData: updatedData } : s)),
      )
    } else {
      alert(`Error updating data: ${res.error}`)
      throw new Error(res.error)
    }
  }

  const handleArchiveToggle = async (submissionId: string, archived: boolean) => {
    if (!user?.id) return
    const res = await archiveSubmission(user.id, submissionId, archived)
    if (res.success) {
      // Archiving/unarchiving may move the row out of the current status filter, so refetch.
      await loadSubmissions()
    } else {
      alert(`Error ${archived ? 'archiving' : 'unarchiving'} submission: ${res.error}`)
    }
  }

  const displayedSubmissions = submissions

  // Derived from the form definition — stable regardless of which submissions are loaded/filtered
  const dynamicFields = useMemo((): DynamicField[] => {
    const selected = forms.find((f) => f.value === selectedFormId)
    if (!selected?.fields) return []
    return extractFormFields(selected.fields as any[]).map((f) => ({
      key: f.key,
      label: f.isList ? `${f.label} (Count)` : f.label,
      type: f.isList ? 'list' : 'flat',
      parentKey: f.parentKey,
      parentLabel: f.parentLabel,
    }))
  }, [forms, selectedFormId])

  // Load stored column visibility whenever the form or its field set changes
  useEffect(() => {
    if (!selectedFormId || dynamicFields.length === 0) {
      setVisibleColumnKeys(null)
      return
    }
    const stored = localStorage.getItem(LS_COLUMNS(selectedFormId))
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[]
        const allKeys = new Set(dynamicFields.map((f) => f.key))
        const valid = new Set(parsed.filter((k) => allKeys.has(k)))
        setVisibleColumnKeys(valid.size > 0 ? valid : new Set(dynamicFields.map((f) => f.key)))
      } catch {
        setVisibleColumnKeys(new Set(dynamicFields.map((f) => f.key)))
      }
    } else {
      setVisibleColumnKeys(new Set(dynamicFields.map((f) => f.key)))
    }
  }, [selectedFormId, dynamicFields])

  const handleColumnsChange = (keys: Set<string>) => {
    setVisibleColumnKeys(new Set(keys))
    if (selectedFormId) {
      localStorage.setItem(LS_COLUMNS(selectedFormId), JSON.stringify([...keys]))
    }
  }

  // Load stored column order when form or its field set changes
  useEffect(() => {
    if (!selectedFormId || dynamicFields.length === 0) { setFieldOrder([]); return }
    try {
      const stored = localStorage.getItem(LS_ORDER(selectedFormId))
      setFieldOrder(stored ? (JSON.parse(stored) as string[]) : [])
    } catch {
      setFieldOrder([])
    }
  }, [selectedFormId, dynamicFields])

  const handleReorder = (reordered: DynamicField[]) => {
    const order = reordered.map((f) => f.key)
    setFieldOrder(order)
    if (selectedFormId) localStorage.setItem(LS_ORDER(selectedFormId), JSON.stringify(order))
  }

  // Apply stored order to dynamicFields; new fields not in stored order go to the end
  const orderedDynamicFields = useMemo(() => {
    if (fieldOrder.length === 0) return dynamicFields
    const byKey = new Map(dynamicFields.map((f) => [f.key, f]))
    const result: DynamicField[] = []
    for (const key of fieldOrder) {
      const f = byKey.get(key)
      if (f) result.push(f)
    }
    for (const f of dynamicFields) {
      if (!fieldOrder.includes(f.key)) result.push(f)
    }
    return result
  }, [dynamicFields, fieldOrder])

  const visibleDynamicFields = useMemo(
    () =>
      visibleColumnKeys === null
        ? orderedDynamicFields
        : orderedDynamicFields.filter((f) => visibleColumnKeys.has(f.key)),
    [orderedDynamicFields, visibleColumnKeys],
  )

  const selectedForm = forms.find((f) => f.value === selectedFormId)
  const showStatusColumn = selectedForm?.enable_form_status || false

  const handleOpenDetail = (filteredIndex: number) => {
    setSelectedSubmissionIndex(filteredIndex)
    openModal(detailModalSlug)
  }

  const handleCloseDetail = () => {
    setSelectedSubmissionIndex(null)
    closeModal(detailModalSlug)
  }

  const handlePrevDetail = () => {
    if (selectedSubmissionIndex !== null && selectedSubmissionIndex > 0) {
      setSelectedSubmissionIndex(selectedSubmissionIndex - 1)
    }
  }

  const handleNextDetail = () => {
    if (
      selectedSubmissionIndex !== null &&
      selectedSubmissionIndex < displayedSubmissions.length - 1
    ) {
      setSelectedSubmissionIndex(selectedSubmissionIndex + 1)
    }
  }

  return (
    <div className="p-6">
      <DashboardToolbar
        selectedForm={selectedForm}
        loadingForms={loadingForms}
        searchQuery={searchQuery}
        startDate={startDate}
        endDate={endDate}
        statusFilter={statusFilter}
        onOpenSidebar={() => setSidebarOpen(true)}
        onSearchChange={setSearchQuery}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onStatusFilterChange={handleStatusFilterChange}
        onClearDates={() => {
          handleStartDateChange('')
          handleEndDateChange('')
        }}
      />

      <ExportCSVModal
        userId={user?.id || ''}
        forms={forms}
        initialFormId={selectedFormId}
        onExport={() => {}}
      />

      <SubmissionDetailModal
        submission={
          selectedSubmissionIndex !== null ? displayedSubmissions[selectedSubmissionIndex] : null
        }
        onClose={handleCloseDetail}
        onPrev={handlePrevDetail}
        onNext={handleNextDetail}
        hasPrev={selectedSubmissionIndex !== null && selectedSubmissionIndex > 0}
        hasNext={
          selectedSubmissionIndex !== null &&
          selectedSubmissionIndex < displayedSubmissions.length - 1
        }
        onStatusChange={handleStatusChange}
        onDataSave={handleDataSave}
        onArchiveToggle={async (submissionId, archived) => {
          await handleArchiveToggle(submissionId, archived)
          handleCloseDetail()
        }}
      />

      <FormsSidebar
        open={sidebarOpen}
        forms={forms}
        loadingForms={loadingForms}
        selectedFormId={selectedFormId}
        onSelect={handleFormSelect}
        onClose={() => setSidebarOpen(false)}
      />

      {!formsInitialized ? (
        <div className="text-center py-12 text-(--theme-elevation-400) text-[13px]">
          Loading forms…
        </div>
      ) : !selectedFormId ? (
        <div className="text-center py-16 px-8 text-(--theme-elevation-400) text-sm">
          Please select a form to view submissions.
        </div>
      ) : (
        <>
          {/* Column visibility strip */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-(--theme-elevation-500)">
              {displayedSubmissions.length}{' '}
              {displayedSubmissions.length === 1 ? 'submission' : 'submissions'}
            </span>
            <ColumnSelector
              fields={orderedDynamicFields}
              visibleKeys={visibleColumnKeys ?? new Set(orderedDynamicFields.map((f) => f.key))}
              onChange={handleColumnsChange}
              onReorder={handleReorder}
            />
          </div>

          <SubmissionsTable
            displayedSubmissions={displayedSubmissions}
            dynamicFields={visibleDynamicFields}
            showStatusColumn={showStatusColumn}
            loadingSubmissions={loadingSubmissions}
            searchQuery={searchQuery}
            pagination={pagination}
            page={page}
            limit={limit}
            onRowClick={handleOpenDetail}
            onStatusChange={handleStatusChange}
            onArchiveToggle={handleArchiveToggle}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </>
      )}
    </div>
  )
}

export default FormsDashboardField
