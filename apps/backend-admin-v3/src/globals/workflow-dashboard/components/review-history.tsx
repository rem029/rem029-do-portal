'use client'

import React, { useState } from 'react'
import { NormalizedReview } from './actions'

function BadgePill({ response, isSkipped }: { response: string; isSkipped: boolean }) {
  const label = isSkipped
    ? 'skipped'
    : response === 'auto_completed'
      ? 'auto completed'
      : response

  let style: React.CSSProperties = {}
  if (isSkipped || response === 'pending') {
    style = {
      color: 'var(--theme-elevation-500)',
      borderColor: 'var(--theme-elevation-300)',
      background: 'transparent',
    }
  } else if (
    response === 'approved' ||
    response === 'acknowledged' ||
    response === 'auto_completed'
  ) {
    style = { color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }
  } else if (response === 'rejected') {
    style = { color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }
  } else if (response === 'skipped') {
    style = { color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }
  }

  return (
    <span
      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border whitespace-nowrap shrink-0"
      style={style}
    >
      {label}
    </span>
  )
}

export const ReviewHistory: React.FC<{
  reviews: NormalizedReview[]
  currentStepSlug: string | null
  status: string
}> = ({ reviews, currentStepSlug, status }) => {
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    setExpandedIndexes((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  if (reviews.length === 0) {
    return (
      <div className="text-xs text-(--theme-elevation-400) py-4 text-center">
        No review history available.
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-(--theme-elevation-400) border-b border-(--theme-elevation-150) pb-1 mb-3">
        Review History
      </h4>
      <div className="space-y-3">
        {reviews.map((review, index) => {
          const isCompleted = review.response !== 'pending'
          const isActive = review.statusSlug === currentStepSlug
          const isSkipped =
            !isCompleted && (status === 'completed' || status === 'rejected')
          const isExpanded = expandedIndexes.has(index)

          return (
            <div
              key={index}
              className={`p-3 rounded border transition-all duration-200 ${
                isActive
                  ? 'border-(--theme-elevation-500) bg-(--theme-elevation-100)'
                  : 'border-(--theme-elevation-150) bg-(--theme-elevation-50)'
              }`}
              style={isActive ? { borderLeftWidth: '3px' } : {}}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-(--theme-elevation-800) leading-tight">
                    {review.label}
                  </p>
                  <p className="text-[11px] text-(--theme-elevation-500) mt-0.5">
                    Reviewer: {review.reviewer}
                  </p>
                </div>
                <BadgePill response={review.response} isSkipped={isSkipped} />
              </div>

              {isCompleted && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(index)}
                    className="mt-2 text-[11px] text-(--theme-elevation-500) underline underline-offset-2 bg-transparent border-none cursor-pointer p-0"
                  >
                    {isExpanded ? 'View Less ▲' : 'View More ▼'}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-(--theme-elevation-150) space-y-2 text-[12px]">
                      {review.comments && (
                        <p className="italic text-(--theme-elevation-700)">
                          &quot;{review.comments}&quot;
                        </p>
                      )}
                      {review.customFieldResponses && review.customFieldResponses.length > 0 && (
                        <dl className="grid grid-cols-1 gap-1">
                          {review.customFieldResponses.map((r, ri) => (
                            <div key={ri} className="flex flex-col">
                              <dt className="text-[10px] font-semibold text-(--theme-elevation-500) uppercase tracking-wide">
                                {r.label ?? r.name}
                              </dt>
                              <dd className="text-[12px] text-(--theme-elevation-800) font-medium">
                                {String(r.value ?? '—')}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {review.attachments && review.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {review.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] px-2 py-0.5 rounded border border-(--theme-elevation-200) bg-(--theme-elevation-100) hover:bg-(--theme-elevation-150) text-(--theme-elevation-700) transition-colors flex items-center gap-1"
                            >
                              📎 {att.filename || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      )}
                      {review.signature && (
                        <div className="mt-1">
                          <p className="text-[10px] text-(--theme-elevation-500) mb-1 uppercase font-semibold">
                            Signature
                          </p>
                          <img
                            src={review.signature}
                            alt="Signature"
                            style={{
                              maxHeight: '60px',
                              display: 'block',
                              border: '1px solid var(--theme-elevation-200)',
                              borderRadius: '4px',
                              padding: '2px',
                              background: 'white',
                            }}
                          />
                        </div>
                      )}
                      {review.reviewedAt && (
                        <p className="text-[10px] text-(--theme-elevation-500)">
                          Reviewed by {review.reviewedBy || review.reviewer} at{' '}
                          {new Date(review.reviewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {review.reviewerTokens && review.reviewerTokens.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-(--theme-elevation-150)">
                      <p className="text-[10px] font-semibold text-(--theme-elevation-500) uppercase tracking-wide mb-1">
                        Approver Responses
                      </p>
                      <div className="space-y-1">
                        {review.reviewerTokens.map((t, ti) => (
                          <div
                            key={ti}
                            className="flex items-center justify-between text-[11px] bg-(--theme-elevation-100) rounded px-2 py-1"
                          >
                            <span className="text-(--theme-elevation-700)">{t.email}</span>
                            <span className="text-(--theme-elevation-500) uppercase">
                              {t.response === 'pending' ? 'no response' : t.response}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
