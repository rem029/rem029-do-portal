'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getHistoryViewer } from '@/utilities/trip-scheduling-history-session'

export async function exportBookings() {
  const payload = await getPayload({ config })

  try {
    const viewer = await getHistoryViewer()
    if (viewer?.via !== 'admin') {
      return { success: false, error: 'Not authorized', status: 403 }
    }

    const bookingsResult = await payload.find({
      collection: 'trip-scheduling-bookings',
      overrideAccess: true,
      depth: 1,
      sort: '-createdAt',
      limit: 1000,
    })

    const bookings = bookingsResult.docs

    const csvHeaders = [
      'Booking ID',
      'Status',
      'Requester Name',
      'Email',
      'Phone',
      'Operator',
      'Trip Category',
      'Passengers',
      'Vehicle Requested',
      'Pickup Location',
      'Destination',
      'Travel Date',
      'Travel Time',
      'Assigned Driver',
      'Driver Contact Phone',
      'Created At',
    ]

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return ''
      let str = typeof val === 'object' ? val.name || val.title || '' : String(val)
      str = str.replace(/"/g, '""')
      return `"${str}"`
    }

    const csvRows = bookings.map((row: any) => {
      return [
        row.id,
        row.status,
        row.fullName,
        row.email,
        row.phone,
        row.operator,
        row.tripCategory,
        row.passengers || 1,
        row.vehicleNeeded,
        row.pickupLocation,
        row.destination,
        row.travelDate ? new Date(row.travelDate).toLocaleDateString() : '',
        row.travelTime,
        row.driver,
        row.driverPhone || 'N/A',
        row.createdAt ? new Date(row.createdAt).toLocaleString() : '',
      ]
        .map(escapeCSV)
        .join(',')
    })

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')
    const filename = `doha-oasis-bookings-export-${new Date().toISOString().split('T')[0]}.csv`

    return {
      success: true,
      csvContent,
      filename,
    }
  } catch (err) {
    payload.logger.error(
      `[CSV Export Action Failure]: ${err instanceof Error ? err.message : String(err)}`,
    )
    return {
      success: false,
      error: 'Internal server error processing report file extraction loops.',
      status: 500,
    }
  }
}
