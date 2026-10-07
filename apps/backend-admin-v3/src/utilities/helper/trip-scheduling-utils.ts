// src/utilities/helper/trip-scheduling-utils.ts
import { CollectionSlug, Payload } from 'payload'

export const extractFieldString = (field: any, defaultStr = ''): string => {
  if (!field) return defaultStr
  if (typeof field === 'object') {
    return field.name || field.fullName || field.driverName || field.title || defaultStr
  }
  return String(field)
}

export const formatTimeDisplay = (timeInput: any): string => {
  if (!timeInput) return '--:--'
  const str = String(timeInput).trim()
  if (str.includes(':')) return str
  const padded = str.padStart(4, '0')
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`
}

export const getTimelineWeight = (dateStr: string, timeStr: string): number => {
  if (!timeStr) return 0
  const cleanTime = timeStr.includes(':') ? timeStr : formatTimeDisplay(timeStr)
  const [hours, minutes] = cleanTime.split(':').map(Number)
  const totalMinutes = (hours || 0) * 60 + (minutes || 0)

  const PIVOT_MINUTES = 300 // 05:00 AM
  const dailyWeight =
    totalMinutes >= PIVOT_MINUTES
      ? totalMinutes - PIVOT_MINUTES
      : totalMinutes + 1440 - PIVOT_MINUTES
  const dateWeight = dateStr ? new Date(dateStr).getTime() / 100000 : 0
  return dateWeight + dailyWeight
}

// Safely extract Zone, District, and Trip Cost from the populated 'zones' relationship or fallbacks
export const extractZoneDetails = (d: any) => {
  const zoneObj = typeof d.zones === 'object' && d.zones !== null ? d.zones : null
  const zoneNumber = zoneObj?.zoneNumber || zoneObj?.indexNumber || d.zoneNumber || ''
  const district = zoneObj?.district || d.district || ''
  const tripCost = d.tripCost ?? zoneObj?.tripCost ?? d.cost ?? 0

  return { zoneNumber, district, tripCost }
}

export const normalizeBookingDoc = (d: any) => {
  const { zoneNumber, district, tripCost } = extractZoneDetails(d)
  return {
    id: d.id,
    originType: 'booking' as const,
    employeeName: d.fullName || 'Unknown Personnel',
    email: d.email || '',
    phone: d.phone || '',
    purpose: extractFieldString(d.tripCategory, 'Standard Route Booking'),
    pickupLocation: d.pickupLocation || 'Property Ground',
    dropoffLocation: d.destination || 'Assigned Housing',
    requestedDate: d.travelDate ? d.travelDate.split('T')[0] : '',
    requestedTime: d.travelTime || '',
    bookingStatus: d.status || 'pending',
    operatorName: extractFieldString(d.operator),
    vehicleName: extractFieldString(d.vehicleNeeded),
    driverName: extractFieldString(d.driver),
    driverPhone:
      d.driverPhone ||
      (d.driver && typeof d.driver === 'object'
        ? d.driver.phone || d.driver.driverPhone || ''
        : '') ||
      'N/A',
    declineReason: d.declineReason || '',
    zoneNumber,
    district,
    tripCost,
    completedAt: d.completedAt || null,
    isTripSettled: !!d.is_trip_settled,
  }
}

export const normalizeAdhocDoc = (d: any) => {
  const { zoneNumber, district, tripCost } = extractZoneDetails(d)
  return {
    id: d.id,
    originType: 'adhoc' as const,
    employeeName: d.fullName || 'Ad-Hoc Requester',
    email: d.email || '',
    phone: d.phone || '',
    purpose: extractFieldString(d.reason, 'Ad-Hoc Movement Track'),
    pickupLocation: d.origin || 'Property Ground',
    dropoffLocation: d.destination || 'Dynamic Target',
    requestedDate: d.travelDate ? d.travelDate.split('T')[0] : '',
    requestedTime: d.pickupTime || '',
    bookingStatus: d.status || 'pending',
    operatorName: extractFieldString(d.operator),
    vehicleName: extractFieldString(d.vehicleNeeded),
    driverName: extractFieldString(d.driver),
    driverPhone:
      d.driverPhone ||
      (d.driver && typeof d.driver === 'object'
        ? d.driver.phone || d.driver.driverPhone || ''
        : '') ||
      'N/A',
    declineReason: d.declineReason || '',
    zoneNumber,
    district,
    tripCost,
    completedAt: d.completedAt || null,
    isTripSettled: !!d.is_trip_settled,
  }
}

// Shuttle schedules
export const formatPickupTime = (timeInput: number | string | undefined | null): string => {
  if (timeInput === undefined || timeInput === null || timeInput === 0 || timeInput === '')
    return '--:--'

  const timeStr = String(timeInput).trim()
  if (timeStr.includes(':')) return timeStr

  const padded = timeStr.padStart(4, '0')
  const hours = padded.slice(0, 2)
  const minutes = padded.slice(2, 4)
  return `${hours}:${minutes}`
}

/**
 * Safely extracts a primitive ID string from raw relationship data fields.
 * Hardened to protect against Payload v3 deep object mapping variations.
 */
export function relToId(raw: any): string | null {
  if (raw == null) return null

  if (typeof raw === 'object') {
    const extracted = raw.id ?? raw.value ?? raw._id
    if (extracted) return typeof extracted === 'object' ? relToId(extracted) : String(extracted)

    if (Array.isArray(raw) && raw.length > 0) return relToId(raw[0])

    return null
  }

  return String(raw).trim()
}

/**
 * Extracts minutes from midnight from a Date object, timestamp, or HH:mm string.
 */
export function getMinutesFromDate(dateInput: any): number {
  if (!dateInput) return 0

  if (typeof dateInput === 'string') {
    const cleanedInput = dateInput.trim()
    if (cleanedInput.includes(':')) {
      const parts = cleanedInput.split(':')
      if (parts.length >= 2) {
        const hrs = parseInt(parts[0], 10)
        const mins = parseInt(parts[1], 10)
        if (!isNaN(hrs) && !isNaN(mins)) {
          return hrs * 60 + mins
        }
      }
    }
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  return isNaN(date.getTime()) ? 0 : date.getHours() * 60 + date.getMinutes()
}

/**
 * Resolves descriptive readable identity fields from a collection row target.
 */
export async function resolveName(
  rel: any,
  collectionSlug: CollectionSlug,
  payload: Payload,
): Promise<string> {
  if (!rel) return ''
  const id = relToId(rel)
  if (!id) return ''

  try {
    const doc = await payload.findByID({
      collection: collectionSlug,
      id,
      depth: 0,
      overrideAccess: true,
    })
    return (doc as any)?.name || (doc as any)?.adminTitle || (doc as any)?.title || ''
  } catch {
    return ''
  }
}
