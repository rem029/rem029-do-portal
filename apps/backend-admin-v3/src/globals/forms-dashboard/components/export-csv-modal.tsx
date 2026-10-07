'use client'

import React, { useState, useEffect } from 'react'
import { Button, Modal, useModal } from '@payloadcms/ui'
import { FormOption, exportSubmissionsToCSV } from './actions'

export const exportModalSlug = 'export-csv-modal'

export const ExportCSVModal: React.FC<{
  userId: string
  forms: FormOption[]
  initialFormId: string
  onExport: (startDate?: string, endDate?: string) => void
}> = ({ userId, forms, initialFormId, onExport }) => {
  const { closeModal } = useModal()
  const [exportFormId, setExportFormId] = useState(initialFormId)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Sync with initial selection when prop changes (e.g. if main dashboard filter changes)
  useEffect(() => {
    setExportFormId(initialFormId)
  }, [initialFormId])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportSubmissionsToCSV(
        userId,
        exportFormId || undefined,
        startDate,
        endDate,
        includeArchived,
      )
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `export-${exportFormId || 'all'}-${new Date().toISOString()}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        closeModal(exportModalSlug)
      } else {
        alert('Export failed: ' + result.error)
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred during export.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal slug={exportModalSlug} className="fixed inset-0 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => closeModal(exportModalSlug)}
      />
      <div className="relative w-full max-w-[400px] bg-(--theme-elevation-50) border border-(--theme-elevation-150) p-6 rounded-lg shadow-2xl z-10 text-(--theme-elevation-800)">
        <h3 className="text-lg font-bold mb-4">Export to CSV</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-elevation-400) mb-1">
              Select Form
            </label>
            <select
              className="w-full bg-transparent border border-(--theme-elevation-150) rounded px-3 py-2 text-sm text-(--theme-elevation-800) focus:border-(--theme-elevation-400) outline-none transition-colors"
              value={exportFormId}
              onChange={(e) => setExportFormId(e.target.value)}
            >
              <option value="" className="bg-(--theme-elevation-50) text-(--theme-elevation-800)">
                All Accessible Forms
              </option>
              {forms.map((f) => (
                <option
                  key={f.value}
                  value={f.value}
                  className="bg-(--theme-elevation-50) text-(--theme-elevation-800)"
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-elevation-400) mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full bg-transparent border border-(--theme-elevation-200) rounded px-3 py-2 text-sm text-(--theme-elevation-800) focus:border-(--theme-elevation-400) outline-none transition-colors"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-(--theme-elevation-400) mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full bg-transparent border border-(--theme-elevation-200) rounded px-3 py-2 text-sm text-(--theme-elevation-800) focus:border-(--theme-elevation-400) outline-none transition-colors"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-(--theme-elevation-700) cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="cursor-pointer"
            />
            Include archived submissions
          </label>
          <p className="text-[11px] text-(--theme-elevation-500)">
            Leave dates blank to export all matching submissions.
          </p>
        </div>
        <div className="mt-8 flex gap-2">
          <Button buttonStyle="secondary" onClick={() => closeModal(exportModalSlug)} className="flex-1">
            Cancel
          </Button>
          <Button buttonStyle="primary" onClick={handleExport} disabled={isExporting} className="flex-1">
            {isExporting ? 'Exporting...' : 'Download CSV'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
