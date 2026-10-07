'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import React, { useState, useEffect, useCallback } from 'react'
import { Config, User, UsersAccess } from '@/payload-types'
import { fetchQuickViewDocs } from './actions'
import { useAuth } from '@payloadcms/ui'

interface CollectionToCheck {
  slug: keyof Config['collectionsSelect']
  label: string
  titleField: string
  statusField: string
  pathPrefix: string
}

interface QuickViewBoxProps {
  collection: CollectionToCheck
}

const QuickViewBox: React.FC<QuickViewBoxProps> = ({ collection }) => {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('in_review')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    hasPrevPage: false,
    hasNextPage: false,
    totalPages: 0,
  })
  const { user } = useAuth<User>()

  const isInitialMount = React.useRef(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchQuickViewDocs({
        collection: collection.slug,
        status: statusFilter,
        page,
        limit: 10,
      })

      if (result.success) {
        setDocs(result.docs || [])
        setPagination({
          totalDocs: result.pagination?.totalDocs || 0,
          hasPrevPage: result.pagination?.hasPrevPage || false,
          hasNextPage: result.pagination?.hasNextPage || false,
          totalPages: result.pagination?.totalPages || 0,
        })
      }
    } catch (e) {
      console.error(`Error loading ${collection.slug}:`, e)
    } finally {
      setLoading(false)
    }
  }, [collection.slug, statusFilter, page, user])

  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // Initial fetch on mount or when user/collection changes
  useEffect(() => {
    if (user) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, collection.slug])

  // Refresh when filters or page change, skipping initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (user) {
      refreshData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPage(1)
  }

  return (
    <div className="bg-(--theme-elevation-50) shadow-sm rounded-sm p-4 border border-(--theme-elevation-150) flex flex-col h-full">
      <div className="flex justify-between items-start mb-4 border-b pb-2 border-(--theme-elevation-150)">
        <h4 className="text-lg font-semibold text-(--theme-elevation-800) m-0">
          {collection.label}
        </h4>
        <div className="flex gap-1">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-[10px] py-1 px-2 rounded border border-(--theme-elevation-200) bg-transparent text-(--theme-elevation-600) outline-none"
          >
            <option value="in_review">Review</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 grow max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-(--theme-elevation-400)">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="py-8 text-center text-xs text-(--theme-elevation-400)">
            No items found
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              className="flex justify-between items-start p-3 bg-(--theme-elevation-100) rounded-lg hover:bg-(--theme-elevation-150) transition duration-150 ease-in-out"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <Link
                  href={`${collection.pathPrefix}/${doc.id}`}
                  className="text-(--theme-primary-500) font-medium hover:underline text-sm break-all"
                >
                  {doc[collection.titleField] || 'Untitled'}
                </Link>
                <span className="text-xs text-(--theme-elevation-400)">
                  {doc.employee_name || 'Untitled'}
                </span>
                <span className="text-xs text-(--theme-elevation-400)">
                  Created: {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <span
                className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ml-2 ${
                  doc[collection.statusField] === 'in_review'
                    ? 'bg-(--theme-warning-500)/10 text-(--theme-warning-500) border border-(--theme-warning-500)/20'
                    : doc[collection.statusField] === 'completed'
                      ? 'bg-(--theme-success-500)/10 text-(--theme-success-500) border border-(--theme-success-500)/20'
                      : 'bg-(--theme-error-500)/10 text-(--theme-error-500) border border-(--theme-error-500)/20'
                }`}
              >
                {doc[collection.statusField] && typeof doc[collection.statusField] === 'string'
                  ? doc[collection.statusField].replace('_', ' ')
                  : 'Unknown'}
              </span>
            </div>
          ))
        )}
      </div>

      {(pagination.hasPrevPage || pagination.hasNextPage) && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-(--theme-elevation-150)">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage || loading}
            className="px-3 py-1 text-xs font-medium rounded border border-(--theme-elevation-200) disabled:opacity-30 disabled:cursor-not-allowed hover:bg-(--theme-elevation-100) transition-colors"
          >
            Prev
          </button>
          <span className="text-[10px] text-(--theme-elevation-400)">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage || loading}
            className="px-3 py-1 text-xs font-medium rounded border border-(--theme-elevation-200) disabled:opacity-30 disabled:cursor-not-allowed hover:bg-(--theme-elevation-100) transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

const QuickViewDashboard = () => {
  const { user, fetchFullUser } = useAuth<User>()

  useEffect(() => {
    fetchFullUser()
  }, [fetchFullUser])

  if (!user) return null

  const isSuperUser = user.super_user === true
  const userAccess = user.access as UsersAccess
  const hasAccess = userAccess?.access?.some(
    (a) => a.slug === 'quick-view-dashboard' && a.read === true,
  )

  if (!isSuperUser && !hasAccess) return null

  const collectionsToCheck: CollectionToCheck[] = [
    {
      slug: 'disciplinary-actions',
      label: 'Disciplinary Actions',
      titleField: 'subject',
      statusField: 'workflow_status',
      pathPrefix: '/admin/collections/disciplinary-actions',
    },
    // Add more collections here as needed
  ]

  return (
    <div className="twp mb-8 p-0">
      <h2 className="text-2xl font-bold mb-6 text-(--theme-elevation-800)">Quick View</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collectionsToCheck.map((collection, index) => (
          <QuickViewBox key={index} collection={collection} />
        ))}
      </div>
    </div>
  )
}

export default QuickViewDashboard
