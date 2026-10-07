'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { exportHaccpPersonalHygieneAction } from '@/collections/haccp-personal-hygiene/actions/export'
import { exportHaccpDryStoreAction } from '@/collections/haccp-dry-store/actions/export'
import { exportHaccpDishwashingAction } from '@/collections/haccp-dishwashing/actions/export'
import { exportHaccpBuffetAction } from '@/collections/haccp-buffet/actions/export'

interface HaccpExportButtonProps {
  slug: string
  label?: string
}

const exportActionsMap: Record<
  string,
  (id: string) => Promise<{ success: boolean; data?: string; error?: string }>
> = {
  'haccp-personal-hygiene': exportHaccpPersonalHygieneAction,
  'haccp-dry-store': exportHaccpDryStoreAction,
  'haccp-dishwashing-temperature': exportHaccpDishwashingAction,
  'haccp-buffet-temperature': exportHaccpBuffetAction,
}

export function HaccpExportButton({ slug, label = 'Download (.csv)' }: HaccpExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { id } = useDocumentInfo()

  const handleExport = async () => {
    if (!id) {
      alert('Please save the document before exporting.')
      return
    }

    try {
      setIsExporting(true)
      const actionFn = exportActionsMap[slug]

      if (!actionFn) {
        alert('Export action not mapped for this collection.')
        return
      }

      const result = await actionFn(String(id))

      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${slug}-${id}-report.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert(result.error || 'Failed to generate export.')
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('An unexpected error occurred during export.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!id) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '1rem',
        marginTop: '0.5rem',
      }}
    >
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        style={{
          padding: '1px 8px',
          background: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-elevation-300)',
          borderRadius: '2px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          fontWeight: 400,
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          opacity: isExporting ? 0.7 : 1,
        }}
      >
        {isExporting ? '⏳ Exporting...' : `📥 ${label}`}
      </button>
    </div>
  )
}
