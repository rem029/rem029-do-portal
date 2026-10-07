import { Payload } from 'payload'
import { formatForCSV, escapeCSV } from './helpers'
import { formatDateOnly } from '@/utilities/helper/datetime-utils'

/**
 * CORE LOGIC: exportTripAdhoc
 */
export const exportTripAdhoc = async (
  payload: Payload,
  collectionSlug: 'trip-scheduling-adhoc' | 'trip-scheduling-bookings' = 'trip-scheduling-adhoc',
) => {
  const { docs } = await payload.find({
    collection: collectionSlug,
    limit: 5000,
    depth: 1,
    sort: '-travelDate',
  })

  const headers = [
    'ID',
    'Requester',
    'Email',
    'Phone',
    'Origin',
    'Destination',
    'Travel Date',
    'Pickup Time',
    'Passengers',
    'Vehicle Needed',
    'Reason',
    'Status',
    'Driver',
    'Driver Phone',
    'Approver Notes',
    'Decline Reason',
  ]

  const rows = docs.map((doc: any) => {
    return [
      doc.adhocId || doc.id,
      doc.fullName || '',
      doc.email || '',
      doc.phone || '',
      doc.origin || '',
      doc.destination || '',
      formatForCSV(formatDateOnly(doc.travelDate)),
      doc.pickupTime || '',
      doc.passengers || '',
      doc.vehicleNeeded?.name || '',
      doc.reason || '',
      doc.status || '',
      doc.driver?.name || doc.driverName || '',
      doc.driverPhone || '',
      doc.approverNotes || '',
      doc.declineReason || '',
    ].map(escapeCSV)
  })

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

export const exportAdhocHandler = async (req: any) => {
  const { payload } = req
  const csv = await exportTripAdhoc(payload, 'trip-scheduling-adhoc')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="adhoc-requests-export.csv"',
    },
  })
}
