'use client'

import React from 'react'
import Link from 'next/link'
import { type EmployeeHistoryItem } from './actions'
import { formatDate, getCollectionLabel, getStatusStyle } from './utils'

export const EmployeeHistoryListItem: React.FC<{ item: EmployeeHistoryItem }> = ({ item }) => {
  return (
    <div
      style={{
        padding: '1.25rem',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        backgroundColor: 'var(--theme-elevation-0)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
          gap: '0.75rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: 'var(--theme-elevation-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {getCollectionLabel(item.collection)}
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--theme-elevation-900)',
              marginTop: '0.25rem',
            }}
          >
            {item.subject}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-500)' }}>
            {formatDate(item.createdAt)}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={getStatusStyle(item.workflow_status)}>{item.workflow_status}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--theme-elevation-50)',
          padding: '0.625rem 0.875rem',
          borderRadius: '6px',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--theme-elevation-500)' }}>Employee: </span>
          <span style={{ fontWeight: '600', color: 'var(--theme-elevation-800)' }}>
            {item.userName}
          </span>
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--theme-elevation-500)' }}>Days: </span>
          <span style={{ fontWeight: '700', color: 'var(--theme-elevation-900)' }}>
            {item.days_deducted ?? '-'}
          </span>
        </div>
      </div>

      {item.lastComment ? (
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--theme-elevation-500)',
              marginBottom: '0.375rem',
            }}
          >
            Last Comment:
          </div>
          <div
            style={{
              fontStyle: 'italic',
              fontSize: '0.875rem',
              color: 'var(--theme-elevation-700)',
              paddingLeft: '0.75rem',
              borderLeft: '3px solid var(--theme-elevation-200)',
              lineHeight: '1.4',
            }}
          >
            &quot;{item.lastComment}&quot;
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--theme-elevation-500)',
                display: 'block',
                marginTop: '0.25rem',
                fontStyle: 'normal',
                fontWeight: '500',
              }}
            >
              — {item.reviewedBy}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--theme-elevation-400)',
            marginBottom: '1.25rem',
          }}
        >
          No comments yet
        </div>
      )}

      <Link
        href={`/admin/collections/${item.collection}/${item.id}`}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '0.625rem',
          backgroundColor: 'var(--theme-elevation-100)',
          color: 'var(--theme-primary-500)',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '0.875rem',
          borderRadius: '6px',
        }}
      >
        View Details
      </Link>
    </div>
  )
}
