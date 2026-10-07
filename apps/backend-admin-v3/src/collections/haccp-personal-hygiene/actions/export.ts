'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getOutletPersonnel } from '@/common/components/haccp/utils/get-outlet-personnel'

export async function exportHaccpPersonalHygieneAction(
  id: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const payload = await getPayload({ config })

    if (!id) {
      return { success: false, error: 'Document ID is required for export' }
    }

    const doc = await payload.findByID({
      collection: 'haccp-personal-hygiene',
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
        'Checklist Date',
        'Staff Name',
        'Hair',
        'Nails',
        'Uniform',
        'Shoes',
        'Jewellery',
        'Symptoms of Sickness',
        'Medical Card',
        'Remarks',
        'Checked By',
        'Verified By',
      ].join(','),
    )

    const outletName =
      typeof doc.outlet === 'object' && doc.outlet !== null
        ? (doc.outlet as any).name || (doc.outlet as any).title || 'Outlet'
        : doc.outlet || 'N/A'

    const checklistDate = doc.date
      ? new Date(doc.date as string).toISOString().split('T')[0]
      : 'N/A'

    const entries = (doc as any).entries || []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const isLastRow = i === entries.length - 1

      const rowCheckedBy = isLastRow ? checkedBy : ''
      const rowVerifiedBy = isLastRow ? verifiedBy : ''

      rows.push(
        [
          `"${outletName}"`,
          `"${checklistDate}"`,
          `"${entry.staffName || ''}"`,
          `"${entry.hair || ''}"`,
          `"${entry.nails || ''}"`,
          `"${entry.uniform || ''}"`,
          `"${entry.shoes || ''}"`,
          entry.jewellery ? 'Yes' : 'No',
          entry.symptomsOfSick ? 'Yes' : 'No',
          entry.medicalCard ? 'Yes' : 'No',
          `"${(entry.remark || '').replace(/"/g, '""')}"`,
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
