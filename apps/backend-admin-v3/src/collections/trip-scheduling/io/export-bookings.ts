import { Payload } from 'payload'
import { formatForCSV, escapeCSV } from './helpers'
import { formatDateOnly } from '@/utilities/helper/datetime-utils'

/**
 * CORE LOGIC: exportTripBookings
 */
export const exportTripBookings = async (
  payload: Payload,
  collectionSlug: 'trip-scheduling-bookings' | 'trip-scheduling-adhoc' = 'trip-scheduling-bookings',
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
    'Pickup Location',
    'Destination',
    'Operator',
    'Travel Date',
    'Travel Time',
    'Passengers',
    'Category',
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
      doc.id,
      doc.fullName || '',
      doc.email || '',
      doc.phone || '',
      doc.pickupLocation || '',
      doc.destination || '',
      doc.operator?.name || '',
      formatForCSV(formatDateOnly(doc.travelDate)),
      doc.travelTime || '',
      doc.passengers || '',
      doc.tripCategory?.name || '',
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

export const exportBookingsHandler = async (req: any) => {
  const { payload } = req
  const csv = await exportTripBookings(payload, 'trip-scheduling-bookings')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="trip-bookings-export.csv"',
    },
  })
}
