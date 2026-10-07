'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Gutter, useAuth } from '@payloadcms/ui'
import {
  dohaDate,
  dohaStartOfMonth,
} from '@/globals/fnb-orders-report/components/reports/formatters'
import { RefreshIcon } from '@/globals/fnb-orders-report/components/reports/icons'
import type { User } from '@/payload-types'
import { fetchSurveyReport, fetchSurveyReportContext } from './actions'
import { getDatePresets, SurveyReportToolbar } from './report-toolbar'
import { SummaryCards } from './summary-cards'
import { ReportTabs, type ReportTab } from './report-tabs'
import { emptyState, notice, secondaryButton, surface } from './ui'
import type {
  SurveyReportBlockedReason,
  SurveyReportContext,
  SurveyReportData,
  SurveyReportFilters,
} from './types'

const BLOCKED_MESSAGES: Record<SurveyReportBlockedReason, string> = {
  no_department_field: 'This survey has no department question',
  department_not_offered: "Your department isn't part of this survey",
  no_user_department: 'Your account has no department. Ask an admin to set one.',
}

const STORAGE_KEY = 'survey-report-active-tab'

function getSavedTab(): ReportTab {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'text' || saved === 'charts') return saved
  } catch {
    // Ignore localStorage errors
  }
  return 'charts'
}

function saveTab(tab: ReportTab) {
  try {
    localStorage.setItem(STORAGE_KEY, tab)
  } catch {
    // Ignore localStorage errors
  }
}

const FILTERS_KEY = 'survey-report-filters'

interface SavedFilters {
  userId: string
  formId: string
  departmentId: string | null
  from: string
  to: string
  // A preset is re-derived on load so "Today"/"This month" roll forward instead of freezing old dates
  preset: string | null
}

function getSavedFilters(userId: string | undefined): SavedFilters | null {
  if (!userId) return null
  try {
    const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) ?? 'null') as SavedFilters | null
    return saved?.userId === userId ? saved : null
  } catch {
    return null
  }
}

function saveFilters(saved: SavedFilters) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(saved))
  } catch {
    // Ignore localStorage errors
  }
}

function initialFilters(saved: SavedFilters | null): SurveyReportFilters {
  const defaults = { formId: '', from: dohaStartOfMonth(), to: dohaDate(0), departmentId: null }
  if (!saved) return defaults
  const preset = saved.preset ? getDatePresets().find((p) => p.id === saved.preset) : undefined
  return {
    ...defaults,
    departmentId: saved.departmentId,
    from: preset?.from ?? saved.from ?? defaults.from,
    to: preset?.to ?? saved.to ?? defaults.to,
  }
}

export const SurveyReportView: React.FC = () => {
  const { user } = useAuth<User>()

  const [context, setContext] = useState<SurveyReportContext | null>(null)
  const [contextLoading, setContextLoading] = useState(true)

  // Read once on mount; the context fetch below starts from the saved survey
  const [savedFilters] = useState(() => getSavedFilters(user?.id ? String(user.id) : undefined))

  const [filters, setFilters] = useState<SurveyReportFilters>(() => initialFilters(savedFilters))

  const [data, setData] = useState<SurveyReportData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [requestedFormId, setRequestedFormId] = useState<string | undefined>(
    savedFilters?.formId || undefined,
  )

  const [activeTab, setActiveTab] = useState<ReportTab>('charts')

  // Restore saved tab choice on mount
  useEffect(() => {
    setActiveTab(getSavedTab())
  }, [])

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab)
    saveTab(tab)
  }

  // The survey select only requests a survey; filters.formId follows once its context has loaded
  useEffect(() => {
    if (!user?.id) {
      setContextLoading(false)
      return
    }

    let mounted = true
    setContextLoading(true)

    fetchSurveyReportContext(String(user.id), requestedFormId).then((res) => {
      if (!mounted) return
      setContext(res)
      setContextLoading(false)
      if (!res) return

      setFilters((prev) => ({
        ...prev,
        formId: res.selectedFormId ?? '',
        departmentId: res.departmentLocked
          ? res.lockedDepartmentId
          : res.departments.some((d) => d.id === prev.departmentId)
            ? prev.departmentId
            : null,
      }))
    })

    return () => {
      mounted = false
    }
  }, [user?.id, requestedFormId, refreshCount])

  useEffect(() => {
    if (
      !user?.id ||
      !context ||
      context.blockedReason ||
      !filters.formId ||
      context.selectedFormId !== filters.formId
    ) {
      if (!contextLoading) {
        setData(null)
        setInitialLoading(false)
        setUpdating(false)
      }
      return
    }

    let mounted = true
    setUpdating(true)

    const timer = setTimeout(async () => {
      const res = await fetchSurveyReport(String(user.id), filters)
      if (!mounted) return

      setUpdating(false)
      setInitialLoading(false)

      if (res.success) {
        setData(res.data)
        setError(null)
      } else {
        setError(res.error)
      }
    }, 200)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [user?.id, context, contextLoading, filters])

  // Only persist filters that the loaded context accepted (formId follows the context)
  useEffect(() => {
    if (!user?.id || !filters.formId) return
    const preset = getDatePresets().find((p) => p.from === filters.from && p.to === filters.to)
    saveFilters({
      userId: String(user.id),
      formId: filters.formId,
      departmentId: context?.departmentLocked ? null : (filters.departmentId ?? null),
      from: filters.from,
      to: filters.to,
      preset: preset?.id ?? null,
    })
  }, [user?.id, filters, context?.departmentLocked])

  const handleFilterChange = useCallback((next: Partial<SurveyReportFilters>) => {
    const { formId, ...rest } = next
    if (formId !== undefined) setRequestedFormId(formId)
    if (Object.keys(rest).length) setFilters((prev) => ({ ...prev, ...rest }))
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshCount((c) => c + 1)
  }, [])

  if (user === undefined || (contextLoading && !context)) {
    return (
      <Gutter className="py-8">
        <div className="w-full font-light">
          <div className={notice}>Loading…</div>
        </div>
      </Gutter>
    )
  }

  if (!user || context === null) {
    return (
      <Gutter className="py-8">
        <div className="w-full font-light">
          <div className={notice}>You don&apos;t have access to survey reports</div>
        </div>
      </Gutter>
    )
  }

  if (context.surveys.length === 0) {
    return (
      <Gutter className="py-8">
        <div className="w-full font-light">
          <div className={notice}>No surveys available.</div>
        </div>
      </Gutter>
    )
  }

  return (
    <Gutter className="py-8">
      <div className="w-full">
        <p className="m-0 mb-6 text-[15px] text-(--theme-elevation-600)">
          Survey response metrics, choice distribution, and text feedback.
        </p>

        <SurveyReportToolbar
          userId={String(user.id)}
          context={context}
          filters={{ ...filters, formId: requestedFormId ?? filters.formId }}
          onChange={handleFilterChange}
          onRefresh={handleRefresh}
          disabled={Boolean(context.blockedReason)}
        />

        {context.blockedReason ? (
          <div className={notice}>
            {BLOCKED_MESSAGES[context.blockedReason] || 'You cannot view this report.'}
          </div>
        ) : error ? (
          <div className="mb-4 p-4 rounded-lg border border-(--theme-error-500)/30 bg-(--theme-error-500)/8 text-(--theme-error-700) flex items-center justify-between gap-3">
            <span className="text-[15px] font-normal">{error || "Couldn't load the report."}</span>
            <button type="button" onClick={handleRefresh} className={secondaryButton}>
              <RefreshIcon size={15} />
              Retry
            </button>
          </div>
        ) : initialLoading && !data ? (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`h-28 ${surface} animate-pulse`} />
              ))}
            </div>
            <div className={`h-12 ${surface} animate-pulse`} />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-52 ${surface} animate-pulse`} />
              ))}
            </div>
          </div>
        ) : data ? (
          <div className="relative">
            {updating && (
              <div className="absolute -top-8 right-0 z-10 px-3 py-1 rounded-full bg-(--admin-color-primary) text-(--admin-color-primary-content) text-[13px] font-normal shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
                Updating…
              </div>
            )}

            <div
              className={`flex flex-col transition-opacity duration-200 ${
                updating ? 'opacity-60' : ''
              }`}
            >
              {/* Summary Cards */}
              <SummaryCards
                summary={data.summary}
                departmentFilterActive={data.departmentFilterActive}
              />

              {data.summary.responded === 0 ? (
                <div className={emptyState}>No responses in this range.</div>
              ) : (
                <ReportTabs
                  data={data}
                  hasDepartmentField={context.hasDepartmentField}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Gutter>
  )
}

export default SurveyReportView
