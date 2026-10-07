'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth, useModal } from '@payloadcms/ui'
import { User } from '@/payload-types'
import { fetchWorkflowSubmissions, fetchWorkflowForms, WorkflowSubmissionRow } from './actions'
import { WorkflowDashboardToolbar } from './dashboard-toolbar'
import { WorkflowSubmissionsTable } from './submissions-table'
import { WorkflowColumnSelector, WORKFLOW_COLUMNS, WorkflowColumnKey } from './column-selector'
import { WorkflowDetailModal, workflowDetailModalSlug } from './detail-modal'
import { ExportCSVModal } from './export-csv-modal'

export default function WorkflowDashboardField() {
  const { user, fetchFullUser } = useAuth<User>()
  const { openModal, closeModal } = useModal()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [versionFilter, setVersionFilter] = useState<'v1' | 'v2' | 'all'>('all')
  const [formFilter, setFormFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Data state
  const [forms, setForms] = useState<
    { id: string; title: string; slug: string; version: 'v1' | 'v2' }[]
  >([])
  const [rows, setRows] = useState<WorkflowSubmissionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    totalPages: 0,
    hasPrevPage: false,
    hasNextPage: false,
  })

  // Selection state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Debounce search input so we don't re-query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Guards against out-of-order responses overwriting fresher results
  const requestIdRef = useRef(0)

  // Column visibility — default all visible
  const [visibleColumns, setVisibleColumns] = useState<Set<WorkflowColumnKey>>(
    new Set(WORKFLOW_COLUMNS.map((c) => c.key as WorkflowColumnKey)),
  )

  useEffect(() => {
    fetchFullUser()
  }, [fetchFullUser])

  // Load accessible workflow forms
  useEffect(() => {
    if (!user?.id) return
    fetchWorkflowForms(user.id).then(setForms)
  }, [user?.id])

  // Load submissions whenever filters / page / limit change
  const loadRows = useCallback(async () => {
    if (!user?.id) return
    const requestId = ++requestIdRef.current
    setLoading(true)
    try {
      const result = await fetchWorkflowSubmissions(user.id, {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        workflowVersion: versionFilter === 'all' ? undefined : versionFilter,
        formId: formFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit,
      })
      if (requestId !== requestIdRef.current) return // a newer request superseded this one
      setRows(result.docs)
      setPagination({
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
      })
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [
    user?.id,
    debouncedSearch,
    statusFilter,
    versionFilter,
    formFilter,
    startDate,
    endDate,
    page,
    limit,
  ])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const handleRowClick = (index: number) => {
    setSelectedIndex(index)
    openModal(workflowDetailModalSlug)
  }

  const handleClose = () => {
    setSelectedIndex(null)
    closeModal(workflowDetailModalSlug)
  }

  return (
    <div className="p-6">
      <WorkflowDetailModal
        row={selectedIndex !== null ? rows[selectedIndex] : null}
        userId={user?.id || ''}
        onClose={handleClose}
        onPrev={() => {
          if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1)
        }}
        onNext={() => {
          if (selectedIndex !== null && selectedIndex < rows.length - 1)
            setSelectedIndex(selectedIndex + 1)
        }}
        hasPrev={selectedIndex !== null && selectedIndex > 0}
        hasNext={selectedIndex !== null && selectedIndex < rows.length - 1}
      />

      <ExportCSVModal
        userId={user?.id || ''}
        forms={forms}
        initialFormId={formFilter}
        initialStatus={statusFilter}
      />

      <WorkflowDashboardToolbar
        searchQuery={searchQuery}
        status={statusFilter}
        workflowVersion={versionFilter}
        formId={formFilter}
        startDate={startDate}
        endDate={endDate}
        forms={forms}
        onSearchChange={(v) => {
          setSearchQuery(v)
          setPage(1)
        }}
        onStatusChange={(v) => {
          setStatusFilter(v)
          setPage(1)
        }}
        onWorkflowVersionChange={(v) => {
          setVersionFilter(v)
          setPage(1)
        }}
        onFormChange={(v) => {
          setFormFilter(v)
          setPage(1)
        }}
        onStartDateChange={(v) => {
          setStartDate(v)
          setPage(1)
        }}
        onEndDateChange={(v) => {
          setEndDate(v)
          setPage(1)
        }}
        onClearDates={() => {
          setStartDate('')
          setEndDate('')
          setPage(1)
        }}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-(--theme-elevation-500)">
          {pagination.totalDocs} submission{pagination.totalDocs === 1 ? '' : 's'}
        </span>
        <WorkflowColumnSelector visibleKeys={visibleColumns} onChange={setVisibleColumns} />
      </div>

      <WorkflowSubmissionsTable
        rows={rows}
        visibleColumns={visibleColumns}
        loading={loading}
        searchQuery={searchQuery}
        pagination={pagination}
        page={page}
        limit={limit}
        onRowClick={handleRowClick}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l)
          setPage(1)
        }}
      />
    </div>
  )
}
