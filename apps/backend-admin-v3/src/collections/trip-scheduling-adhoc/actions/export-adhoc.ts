'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getHistoryViewer } from '@/utilities/trip-scheduling-history-session'

export async function exportAdhoc() {
  const payload = await getPayload({ config })

  try {
    const viewer = await getHistoryViewer()
    if (viewer?.via !== 'admin') {
      return { success: false, error: 'Not authorized', status: 403 }
    }

    const adhocResult = await payload.find({
      collection: 'trip-scheduling-adhoc',
      overrideAccess: true,
      depth: 1,
      sort: '-createdAt',
      limit: 1000,
    })

    const adhocRequests = adhocResult.docs

    const csvHeaders = [
      'Adhoc ID',
      'Status',
      'Requester Name',
      'Email',
      'Phone',
      'Operator',
      'Total Passengers',
      'Vehicle Requested',
      'Origin',
      'Destination',
      'Travel Date',
      'Pickup Time',
      'Assigned Driver',
      'Driver Contact Phone',
      'Reason',
      'Approver Notes',
      'Decline Reason',
      'Created At',
    ]

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return ''
      let str = typeof val === 'object' ? val.name || val.title || '' : String(val)
      str = str.replace(/"/g, '""')
      return `"${str}"`
    }

    const csvRows = adhocRequests.map((row: any) => {
      return [
        row.adhocId || row.id,
        row.status,
        row.fullName,
        row.email,
        row.phone,
        row.operator,
        row.passengers || 1,
        row.vehicleNeeded,
        row.origin,
        row.destination,
        row.travelDate ? new Date(row.travelDate).toLocaleDateString() : '',
        row.pickupTime || 'N/A',
        row.driver,
        row.driverPhone || 'N/A',
        row.reason || '',
        row.approverNotes || '',
        row.declineReason || '',
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      ]
        .map(escapeCSV)
        .join(',')
    })

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')
    const filename = `doha-oasis-adhoc-export-${new Date().toISOString().split('T')[0]}.csv`

    return {
      success: true,
      csvContent,
      filename,
    }
  } catch (err) {
    payload.logger.error(
      `[Adhoc CSV Export Action Failure]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return {
      success: false,
      error: 'Internal server error processing report file extraction loops.',
      status: 500,
    }
  }
}
