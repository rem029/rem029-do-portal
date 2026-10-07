'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { QuestionDef, TextAnswerRow } from './types'
import { control, emptyState, hairline, secondaryButton, surface } from './ui'

// Sticky header/column need border-separate (collapsed borders don't stick) and an opaque background
const th = `sticky top-0 z-10 px-4 py-3 bg-(--admin-card) text-(--theme-elevation-800) text-[14px] font-normal! border-b ${hairline}`
const td = `px-4 py-3.5 border-b ${hairline} align-top`
const stickyCol = 'sticky left-0 shadow-[1px_0_0_var(--theme-elevation-150)]'

// Tracks whether a horizontally overflowing element can scroll further left/right
function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [update])

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' })
  }

  return { ref, edges, update, scrollBy }
}

const ArrowIcon: React.FC<{ direction: 'left' | 'right' }> = ({ direction }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={direction === 'left' ? 'M12 4l-6 6 6 6' : 'M8 4l6 6-6 6'} />
  </svg>
)

export interface TextAnswersTableProps {
  rows: TextAnswerRow[]
  questions: QuestionDef[]
  hasDepartmentField: boolean
}

function formatQatarDateTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Qatar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return formatter.format(d)
  } catch {
    return isoString
  }
}

const PAGE_SIZE = 25

export const TextAnswersTable: React.FC<TextAnswersTableProps> = ({
  rows,
  questions,
  hasDepartmentField,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const scroller = useHorizontalScroll<HTMLDivElement>()

  const textQuestions = useMemo(() => questions.filter((q) => q.kind === 'text'), [questions])

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const sorted = [...rows].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )

    if (!query) return sorted

    return sorted.filter((row) => {
      const formattedDate = formatQatarDateTime(row.submittedAt).toLowerCase()
      if (formattedDate.includes(query)) return true
      if (hasDepartmentField && row.departmentTitle?.toLowerCase().includes(query)) return true
      return row.answers.some((ans) => ans.value.toLowerCase().includes(query))
    })
  }, [rows, searchQuery, hasDepartmentField])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const displayedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setPage(1)
  }

  if (textQuestions.length === 0) {
    return <div className={emptyState}>No text questions in this survey.</div>
  }

  return (
    <div className={`${surface} overflow-hidden flex flex-col`}>
      <div className={`p-4 border-b ${hairline} flex flex-wrap items-center justify-between gap-3`}>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search answers or departments…"
            aria-label="Search responses"
            className={`${control} w-full pr-9 placeholder:text-(--theme-elevation-500)`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-[28px] w-[28px] inline-flex items-center justify-center rounded-md bg-transparent border-0 text-(--theme-elevation-500) hover:text-(--admin-color-accent) cursor-pointer"
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-[14px] text-(--theme-elevation-600) tabular-nums">
          {(scroller.edges.left || scroller.edges.right) && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroller.scrollBy(-1)}
                disabled={!scroller.edges.left}
                aria-label="Scroll columns left"
                title="Scroll columns left"
                className={`${secondaryButton} w-[38px] justify-center px-0!`}
              >
                <ArrowIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={() => scroller.scrollBy(1)}
                disabled={!scroller.edges.right}
                aria-label="Scroll columns right"
                title="Scroll columns right"
                className={`${secondaryButton} w-[38px] justify-center px-0!`}
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          )}
          <span>
            {filteredRows.length === 0 ? (
              '0 responses'
            ) : (
              <>
                Showing <strong>{startIndex + 1}</strong>–
                <strong>{Math.min(startIndex + PAGE_SIZE, filteredRows.length)}</strong> of{' '}
                <strong>{filteredRows.length}</strong>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Height cap keeps the horizontal scrollbar on screen instead of below 25 tall rows */}
      <div
        ref={scroller.ref}
        onScroll={scroller.update}
        className="overflow-auto max-h-[70vh] overscroll-x-contain"
      >
        <table className="w-full text-left border-separate border-spacing-0 text-[15px]">
          <thead>
            <tr>
              <th scope="col" className={`${th} ${stickyCol} z-20 whitespace-nowrap`}>
                Submitted
              </th>
              {hasDepartmentField && (
                <th scope="col" className={`${th} whitespace-nowrap`}>
                  Department
                </th>
              )}
              {textQuestions.map((q) => (
                <th key={q.path} scope="col" className={`${th} min-w-[240px]`}>
                  {q.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={textQuestions.length + (hasDepartmentField ? 2 : 1)}
                  className="p-10 text-center text-[15px] text-(--theme-elevation-500)"
                >
                  {searchQuery ? 'No responses match your search.' : 'No text answers recorded.'}
                </td>
              </tr>
            ) : (
              displayedRows.map((row, idx) => (
                <tr
                  key={`${row.submittedAt}-${idx}`}
                  className="group hover:bg-(--admin-bg) transition-colors"
                >
                  <td
                    className={`${td} ${stickyCol} bg-(--theme-elevation-0) group-hover:bg-(--admin-bg) transition-colors text-[14px] text-(--theme-elevation-600) whitespace-nowrap tabular-nums`}
                  >
                    {formatQatarDateTime(row.submittedAt)}
                  </td>
                  {hasDepartmentField && (
                    <td
                      className={`${td} text-(--theme-elevation-800) font-normal! whitespace-nowrap`}
                    >
                      {row.departmentTitle || '—'}
                    </td>
                  )}
                  {textQuestions.map((q) => {
                    const ans = row.answers.find((a) => a.path === q.path)
                    const val = ans?.value?.trim()
                    return (
                      <td
                        key={q.path}
                        dir="auto"
                        className={`${td} text-(--theme-elevation-800) text-start leading-relaxed max-w-md break-words whitespace-pre-wrap`}
                      >
                        {val ? val : <span className="text-(--theme-elevation-500)">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between text-[14px] text-(--theme-elevation-600)">
          <span>
            Page <strong className="text-(--theme-elevation-800)">{safePage}</strong> of{' '}
            <strong className="text-(--theme-elevation-800)">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={secondaryButton}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={secondaryButton}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
