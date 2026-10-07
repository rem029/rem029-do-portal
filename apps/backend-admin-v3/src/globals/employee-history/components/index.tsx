'use client'

import React, { useState, useEffect } from 'react'
import type { UIField } from 'payload'
import { SelectInput, FieldLabel } from '@payloadcms/ui'
import {
  fetchEmployeeHistory,
  fetchAllUsers,
  type EmployeeHistoryItem,
  type UserOption,
} from './actions'
import { EmployeeHistoryList } from './employee-history-list'
import { EmployeeHistoryTable } from './employee-history-table'

const EmployeeHistoryHeader: React.FC<UIField> = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [historyItems, setHistoryItems] = useState<EmployeeHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [viewMode, setViewMode] = useState<'table' | 'list'>('table')

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        const users = await fetchAllUsers()
        setUserOptions(users)
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  // Switch to list view on small screens by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('list')
    }
  }, [])

  // Load history when filters change
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHistory(true)
      try {
        const items = await fetchEmployeeHistory(
          selectedUserId || undefined,
          fromDate || undefined,
          toDate || undefined,
        )
        setHistoryItems(items)
      } catch (error) {
        console.error('Error loading history:', error)
        setHistoryItems([])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadData()
  }, [selectedUserId, fromDate, toDate])

  const dateInputStyle: React.CSSProperties = {
    width: '100%',
    height: '38px',
    padding: '0 0.75rem',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: '4px',
    fontSize: '0.875rem',
    color: 'var(--theme-elevation-800)',
    backgroundColor: 'var(--theme-elevation-0)',
    outline: 'none',
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 250px' }}>
          <SelectInput
            path="employee_filter"
            name="employee_filter"
            label="Filter by Employee"
            required={false}
            options={userOptions}
            value={selectedUserId}
            onChange={(selectedOption: any) => setSelectedUserId(selectedOption?.value || '')}
            isClearable
          />
        </div>

        <div style={{ flex: '0 1 180px' }}>
          <FieldLabel label="From Date" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={dateInputStyle}
          />
        </div>

        <div style={{ flex: '0 1 180px' }}>
          <FieldLabel label="To Date" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={dateInputStyle}
          />
        </div>

        <div
          style={{
            display: 'flex',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            overflow: 'hidden',
            height: '38px',
            marginBottom: '1px', // Align with inputs
          }}
        >
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '0 1rem',
              border: 'none',
              backgroundColor: viewMode === 'table' ? 'var(--theme-elevation-200)' : 'transparent',
              color: 'var(--theme-elevation-800)',
              cursor: 'pointer',
              fontWeight: viewMode === 'table' ? '600' : '400',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
            }}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0 1rem',
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--theme-elevation-200)' : 'transparent',
              color: 'var(--theme-elevation-800)',
              cursor: 'pointer',
              fontWeight: viewMode === 'list' ? '600' : '400',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              borderLeft: '1px solid var(--theme-elevation-200)',
            }}
          >
            List
          </button>
        </div>
      </div>

      {loadingUsers && !selectedUserId && (
        <div
          style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', marginBottom: '1rem' }}
        >
          Loading employees...
        </div>
      )}

      {isLoadingHistory && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--theme-elevation-500)',
          }}
        >
          Loading history...
        </div>
      )}

      {!isLoadingHistory && historyItems.length === 0 && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--theme-elevation-500)',
            backgroundColor: 'var(--theme-elevation-50)',
            borderRadius: '4px',
          }}
        >
          {selectedUserId ? 'No history found for this employee' : 'No recent history found'}
        </div>
      )}

      {!isLoadingHistory && historyItems.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <EmployeeHistoryTable items={historyItems} />
          ) : (
            <EmployeeHistoryList items={historyItems} />
          )}
        </>
      )}
    </div>
  )
}

export default EmployeeHistoryHeader
