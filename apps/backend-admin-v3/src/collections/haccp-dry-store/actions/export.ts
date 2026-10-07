'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getOutletPersonnel } from '@/common/components/haccp/utils/get-outlet-personnel'

export async function exportHaccpDryStoreAction(
  id: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const payload = await getPayload({ config })

    if (!id) {
      return { success: false, error: 'Document ID is required for export' }
    }

    const doc = await payload.findByID({
      collection: 'haccp-dry-store',
      id: id,
      depth: 2,
    })

    if (!doc) {
      return { success: false, error: 'Document not found' }
    }

    const { pic: checkedBy, hic: verifiedBy } = await getOutletPersonnel(payload, doc.outlet)

    const rows: string[] = []

    rows.push(
      [
        'Outlet',
        'Month & Year',
        'Day',
        'AM Temp (C)',
        'AM Hum (%)',
        'PM Temp (C)',
        'PM Hum (%)',
        'Corrective Action',
        'Initials',
        'Checked By',
        'Verified By',
      ].join(','),
    )

    const outletName =
      typeof doc.outlet === 'object' && doc.outlet !== null
        ? (doc.outlet as any).name || (doc.outlet as any).title || 'Outlet'
        : doc.outlet || 'N/A'

    const rawMonthYear: string = typeof doc.monthYear === 'string' ? doc.monthYear : 'N/A'
    const monthYear = `\t${rawMonthYear}`

    const dailyEntries = (doc as any).dailyEntries || []

    for (let i = 0; i < dailyEntries.length; i++) {
      const entry = dailyEntries[i]
      const isLastRow = i === dailyEntries.length - 1

      const rowCheckedBy = isLastRow ? checkedBy : ''
      const rowVerifiedBy = isLastRow ? verifiedBy : ''

      rows.push(
        [
          `"${outletName}"`,
          `"${monthYear}"`,
          entry.day || '',
          entry.tempAm ?? '',
          entry.humidityAm ?? '',
          entry.tempPm ?? '',
          entry.humidityPm ?? '',
          `"${(entry.correctiveAction || '').replace(/"/g, '""')}"`,
          `"${entry.initials || ''}"`,
          `"${rowCheckedBy}"`,
          `"${rowVerifiedBy}"`,
        ].join(','),
      )
    }

    const csvContent = '\uFEFF' + rows.join('\n')

    return { success: true, data: csvContent }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to generate export file' }
  }
}
