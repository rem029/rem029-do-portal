'use client'
import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

const MenuRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ _title?: string }>()
  const label = data?._title || `Menu ${String((rowNumber ?? 0)).padStart(2, '0')}`
  return <span>{label}</span>
}

export default MenuRowLabel
