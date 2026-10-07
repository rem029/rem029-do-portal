'use client'

import React from 'react'
import Link from 'next/link'
import { type EmployeeHistoryItem } from './actions'
import { formatDate, getCollectionLabel, getStatusStyle } from './utils'

export const EmployeeHistoryTable: React.FC<{ items: EmployeeHistoryItem[] }> = ({ items }) => {
  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}
    >
      <table
        style={{
          width: '100%',
          minWidth: '1000px',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--theme-elevation-100)',
              borderBottom: '1px solid var(--theme-elevation-200)',
            }}
          >
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Type
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Employee
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Subject
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Days
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Last Comment
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Created
            </th>
            <th
              style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: 'var(--theme-elevation-900)',
              }}
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={`${item.collection}-${item.id}`}
              style={{
                borderBottom: '1px solid var(--theme-elevation-200)',
              }}
            >
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                }}
              >
                {getCollectionLabel(item.collection)}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item.userName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-600)' }}>
                  {item.userEmail}
                </div>
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                }}
              >
                {item.subject}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                  textAlign: 'center',
                }}
              >
                {item.days_deducted !== undefined ? item.days_deducted : '-'}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                }}
              >
                <span style={getStatusStyle(item.workflow_status)}>{item.workflow_status}</span>
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                  maxWidth: '300px',
                }}
              >
                {item.lastComment ? (
                  <div style={{ fontSize: '0.875rem' }}>
                    <div style={{ fontStyle: 'italic', marginBottom: '0.25rem' }}>
                      &quot;{item.lastComment}&quot;
                    </div>
                    {item.reviewedBy && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--theme-elevation-600)' }}>
                        by {item.reviewedBy}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.75rem' }}>
                    No comments yet
                  </span>
                )}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  color: 'var(--theme-elevation-800)',
                }}
              >
                {formatDate(item.createdAt)}
              </td>
              <td
                style={{
                  padding: '0.75rem',
                }}
              >
                <Link
                  href={`/admin/collections/${item.collection}/${item.id}`}
                  style={{
                    color: 'var(--theme-primary-500)',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
