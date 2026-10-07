'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { HaccpDishwashingTemperature as DishwashingDoc } from '@/payload-types'
import { getOutletPersonnel } from '@/common/components/haccp/utils/get-outlet-personnel'

export async function exportHaccpDishwashingAction(
  id: string,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const payload = await getPayload({ config })

    if (!id) {
      return { success: false, error: 'Document ID is required for export' }
    }

    const doc = (await payload.findByID({
      collection: 'haccp-dishwashing-temperature',
      id: id,
      depth: 2,
    })) as DishwashingDoc

    if (!doc) {
      return { success: false, error: 'Document not found' }
    }

    const { pic: checkedBy, hic: verifiedBy } = await getOutletPersonnel(payload, doc.outlet)

    const rows: string[] = []

    rows.push(
      [
        'Outlet',
        'Unit / Machine ID',
        'Month & Year',
        'Day',
        'Breakfast Wash (C)',
        'Breakfast Rinse (C)',
        'Breakfast Initials',
        'Lunch Wash (C)',
        'Lunch Rinse (C)',
        'Lunch Initials',
        'Dinner Wash (C)',
        'Dinner Rinse (C)',
        'Dinner Initials',
        'Supper Wash (C)',
        'Supper Rinse (C)',
        'Supper Initials',
        'Cleanliness: Wash Arms',
        'Cleanliness: Inside Machine',
        'Corrective Action',
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

    const unit = doc.unit || 'N/A'

    const rawMonthYear: string = typeof doc.monthYear === 'string' ? doc.monthYear : 'N/A'
    let formattedMonthYear = rawMonthYear
    if (/^\d{2}-\d{2}$/.test(formattedMonthYear)) {
      const [m, y] = formattedMonthYear.split('-')
      formattedMonthYear = `${m}-20${y}`
    } else if (/^[A-Za-z]+-\d{2}$/.test(formattedMonthYear)) {
      const [m, y] = formattedMonthYear.split('-')
      formattedMonthYear = `${m}-20${y}`
    }
    const monthYear: string = `\t${formattedMonthYear}`

    const dailyEntries = doc.dailyEntries || []
    const docCorrectiveAction = doc.correctiveAction || ''

    for (let i = 0; i < dailyEntries.length; i++) {
      const entry = dailyEntries[i]
      const isLastRow = i === dailyEntries.length - 1

      const rowCheckedBy = isLastRow ? checkedBy : ''
      const rowVerifiedBy = isLastRow ? verifiedBy : ''

      rows.push(
        [
          `"${outletName}"`,
          `"${unit}"`,
          `"${monthYear}"`,
          entry.day || '',
          entry.breakfastWash ?? '',
          entry.breakfastFinalRinse ?? '',
          `"${entry.breakfastInitials || ''}"`,
          entry.lunchWash ?? '',
          entry.lunchFinalRinse ?? '',
          `"${entry.lunchInitials || ''}"`,
          entry.dinnerWash ?? '',
          entry.dinnerFinalRinse ?? '',
          `"${entry.dinnerInitials || ''}"`,
          entry.supperWash ?? '',
          entry.supperFinalRinse ?? '',
          `"${entry.supperInitials || ''}"`,
          `"${entry.cleanlinessWashArms || ''}"`,
          `"${entry.cleanlinessInsideMachine || ''}"`,
          `"${docCorrectiveAction.replace(/"/g, '""')}"`,
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
