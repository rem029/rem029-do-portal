'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { HaccpBuffetTemperature as BuffetDoc } from '@/payload-types'
import { getOutletPersonnel } from '@/common/components/haccp/utils/get-outlet-personnel'

export async function exportHaccpBuffetAction(
  id: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const payload = await getPayload({ config })

    if (!id) {
      return { success: false, error: 'Document ID is required for export' }
    }

    const doc = (await payload.findByID({
      collection: 'haccp-buffet-temperature',
      id: id,
      depth: 2,
    })) as BuffetDoc

    if (!doc) {
      return { success: false, error: 'Document not found' }
    }

    const { pic: checkedBy, hic: verifiedBy } = await getOutletPersonnel(payload, doc.outlet)

    const rows: string[] = []

    rows.push(
      [
        'Outlet',
        'Checklist Date',
        'Function Type',
        'Food Item',
        'Pickup Time',
        'Initial Temp (C)',
        'Temp After 2 hrs (C)',
        'Temp After 4 hrs (C)',
        'Corrective Action',
        'Initials',
        'Checked By',
        'Verified By',
      ].join(','),
    )

    const outletName =
      typeof doc.outlet === 'object' && doc.outlet !== null
        ? (doc.outlet as { name?: string; title?: string }).name ||
          (doc.outlet as { name?: string; title?: string }).title ||
          'Outlet'
        : doc.outlet || 'N/A'

    const checklistDate = doc.date ? new Date(doc.date).toISOString().split('T')[0] : 'N/A'
    const functionType = doc.functionType || 'N/A'
    const items = doc.items || []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const isLastRow = i === items.length - 1

      const rowCheckedBy = isLastRow ? checkedBy : ''
      const rowVerifiedBy = isLastRow ? verifiedBy : ''

      rows.push(
        [
          `"${outletName}"`,
          `"${checklistDate}"`,
          `"${functionType}"`,
          `"${item.foodItem || ''}"`,
          `"${item.pickupTime || ''}"`,
          item.initialTemp ?? '',
          item.tempAfter2Hrs ?? '',
          item.tempAfter4Hrs ?? '',
          `"${item.correctiveAction || 'none'}"`,
          `"${item.initials || ''}"`,
          `"${rowCheckedBy}"`,
          `"${rowVerifiedBy}"`,
        ].join(','),
      )
    }

    const csvContent = '\uFEFF' + rows.join('\n')

    return { success: true, data: csvContent }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export buffet temperature record' }
  }
}
