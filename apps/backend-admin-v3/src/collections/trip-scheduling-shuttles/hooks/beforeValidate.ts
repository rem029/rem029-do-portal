// apps/backend-admin-v3/src/collections/trip-scheduling-shuttles/hooks/beforeValidate.ts
import type { CollectionBeforeValidateHook } from 'payload'
import { relToId, resolveName, getMinutesFromDate, formatTimeDisplay } from '@/utilities/helper/trip-scheduling-utils'

export const beforeValidate: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const vehicleId = relToId(data.vehicle ?? originalDoc?.vehicle)
  const driverId = relToId(data.driver ?? originalDoc?.driver)
  const routeId = relToId(data.route ?? originalDoc?.route)
  const direction = data.direction ?? originalDoc?.direction

  // 1. Time Normalization
  const finalDepTime = data.departureTime ?? originalDoc?.departureTime
  const finalArrTime = data.arrivalTime ?? originalDoc?.arrivalTime

  const depMins = getMinutesFromDate(finalDepTime)
  let arrMins = getMinutesFromDate(finalArrTime)

  /**
   * 1.1 Logical Time Check (Enhanced for Turnaround Loops and Midnight Rollovers)
   */
  if (depMins > 0 && arrMins > 0) {
    // 🌙 Real-World Scenario: Midnight Rollover Check
    // If arrival minutes are numerically lower than departure minutes, the clock rolled past midnight.
    if (arrMins < depMins) {
      arrMins += 1440 // Add 24 hours worth of minutes to validate across calendar boundaries
    }

    // 🔄 Real-World Scenario: Turnaround/Return Loops Check
    // Allow turnaround loops (where departure matches arrival exactly), but block backwards entries.
    if (finalDepTime !== finalArrTime && arrMins <= depMins) {
      throw new Error(
        `Arrival time (${finalArrTime}) must be chronologically after departure time (${finalDepTime}).`,
      )
    }
  }

  // 2. Driver Phone Snapshot
  if (driverId && (data.driver || !data.driverPhone)) {
    const driverDoc = await req.payload.findByID({
      collection: 'trip-scheduling-drivers',
      id: driverId,
      depth: 0,
    })
    if (driverDoc) data.driverPhone = (driverDoc as any).phone || ''
  }

  // 3. Admin Title Generation (Including Direction for context)
  const routeName = await resolveName(routeId, 'trip-scheduling-routes', req.payload)
  const timeStr = formatTimeDisplay(finalDepTime)
  const dirLabel = direction === 'from-office' ? 'From Office' : 'To Office'

  data.adminTitle = `[${dirLabel}] ${routeName || 'Unassigned Route'} @ ${timeStr || 'No Time'}`

  return data
}
