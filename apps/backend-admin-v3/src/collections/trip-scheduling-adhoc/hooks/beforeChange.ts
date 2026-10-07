import type { CollectionBeforeChangeHook } from 'payload'
import { TripSchedulingAdhoc, TripSchedulingVehicle } from '@/payload-types'
import { generateSecureHexToken } from '@/utilities/secure-token-generator'
import { driverTokenExpiry, travelDayKey } from '@/utilities/trip-scheduling-driver-token'

export const beforeChange: CollectionBeforeChangeHook<TripSchedulingAdhoc> = async ({
  data,
  req,
  originalDoc,
  operation,
}) => {
  if (!data) return data

  // Cast data to a record helper for custom or schema-extended fields
  const recordData = data as Record<string, unknown>

  const currentStatus = (recordData.status as string) || 'pending'
  const previousStatus = originalDoc?.status || 'pending'

  // ==========================================
  // 1. DOMAIN SPECIFIC VEHICLE CATEGORY GUARD
  // ==========================================
  if (recordData.vehicleNeeded) {
    const vehicleId =
      typeof recordData.vehicleNeeded === 'object' && recordData.vehicleNeeded !== null
        ? (recordData.vehicleNeeded as { id: string | number }).id
        : recordData.vehicleNeeded

    const vehicleDoc = await req.payload.findByID({
      collection: 'trip-scheduling-vehicles',
      id: vehicleId as string,
    })

    const vehicle = vehicleDoc as unknown as TripSchedulingVehicle

    if (vehicle && vehicle.category !== 'employee-transport') {
      throw new Error('Only Employee Transport vehicles may be used for Ad-hoc requests.')
    }
  }

  // ==========================================
  // 2. GENERATE INITIAL APPROVAL TOKENS (ON CREATE)
  // ==========================================
  if (operation === 'create' && currentStatus === 'pending') {
    recordData.approvalToken = generateSecureHexToken()

    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 48)
    recordData.tokenExpiration = expiry.toISOString()
  }

  // ==========================================
  // 3. UNIFIED TEMPORAL TIMESTAMP PARSING
  // ==========================================
  const travelDateVal = recordData.travelDate as string | undefined
  const travelTimeVal = recordData.travelTime as string | undefined

  if (travelDateVal && travelTimeVal) {
    try {
      const baseDate = new Date(travelDateVal)
      const timeStr = travelTimeVal.trim()

      let hours = 0
      let minutes = 0

      if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
        const [time, modifier] = timeStr.split(' ')
        const [hRaw, mRaw] = time.split(':').map(Number)
        let h = hRaw
        const m = mRaw
        if (modifier.toUpperCase() === 'PM' && h < 12) h += 12
        if (modifier.toUpperCase() === 'AM' && h === 12) h = 0
        hours = h
        minutes = m
      } else {
        const [h, m] = timeStr.split(':').map(Number)
        hours = h
        minutes = m
      }

      baseDate.setHours(hours, minutes, 0, 0)
      recordData.tripStartTimestamp = baseDate.toISOString()

      const endDate = new Date(baseDate)
      const paddingHours = recordData.estimatedDuration ? Number(recordData.estimatedDuration) : 4
      endDate.setHours(endDate.getHours() + paddingHours)
      recordData.tripEndTimestamp = endDate.toISOString()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      req.payload.logger.error(
        `[Adhoc Temporal Engine] Failed to parse travelTime execution grid: ${message}`,
      )
    }
  }

  // ==========================================
  // 4. FIRST-COME, FIRST-SERVED WINDOW CLOSE
  // ==========================================
  // The approval token is kept: the approval page validates it on every request, including to show
  // "already processed". The action refuses non-pending requests, so it cannot be reused.
  if (operation === 'update' && previousStatus === 'pending' && currentStatus !== 'pending') {
    recordData.tokenExpiration = null
  }

  // ==========================================
  // 5. DIFFERENTIAL DRIVER ASSIGNMENT GUARD
  // ==========================================
  if (operation === 'update') {
    const oldDriverId =
      originalDoc?.driver && typeof originalDoc.driver === 'object'
        ? originalDoc.driver.id
        : originalDoc?.driver
    const newDriverId = recordData.driver
    const travelDate = recordData.travelDate ?? originalDoc?.travelDate

    if (newDriverId && oldDriverId !== newDriverId) {
      recordData.driverToken = generateSecureHexToken()
      recordData.driverTokenExpiration = driverTokenExpiry(travelDate, req.payload.logger)

      recordData.__driverAssignedChanged = true
    } else {
      // Same driver: keep the token, but its expiry follows a changed travel date.
      if (
        originalDoc?.driverToken &&
        recordData.travelDate !== undefined &&
        travelDayKey(recordData.travelDate) !== travelDayKey(originalDoc.travelDate)
      ) {
        recordData.driverTokenExpiration = driverTokenExpiry(travelDate, req.payload.logger)
      }
      recordData.__driverAssignedChanged = false
    }
  }

  // Trips created with a driver (imports, admin create) also need a completion token. The cleanup below
  // still clears it unless the trip is approved or completed.
  if (operation === 'create' && recordData.driver) {
    recordData.driverToken = generateSecureHexToken()
    recordData.driverTokenExpiration = driverTokenExpiry(recordData.travelDate, req.payload.logger)
  }

  // ==========================================
  // 6. DATA CLEANUP SANITIZATION BASED ON STATUS
  // ==========================================
  if (currentStatus !== 'approved' && currentStatus !== 'completed') {
    recordData.driver = null
    recordData.driverPhone = null
    recordData.driverToken = null
    recordData.driverTokenExpiration = null
  }

  if (currentStatus !== 'declined') {
    recordData.declineReason = null
  }

  return data
}
