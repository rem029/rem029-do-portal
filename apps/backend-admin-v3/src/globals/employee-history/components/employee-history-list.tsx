'use client'

import React from 'react'
import { type EmployeeHistoryItem } from './actions'
import { EmployeeHistoryListItem } from './employee-history-list-item'

export const EmployeeHistoryList: React.FC<{ items: EmployeeHistoryItem[] }> = ({ items }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item) => (
        <EmployeeHistoryListItem key={`${item.collection}-${item.id}`} item={item} />
      ))}
    </div>
  )
}
