import type { CollectionBeforeChangeHook } from 'payload'
import { generateSecureHexToken } from '@/utilities/secure-token-generator'
import { driverTokenExpiry, travelDayKey } from '@/utilities/trip-scheduling-driver-token'

export const beforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
  operation,
}) => {
  if (!data) return data

  const currentStatus = data.status || 'pending'
  const previousStatus = originalDoc?.status || 'pending'

  // ==========================================
  // 1. GENERATE INITIAL APPROVAL TOKENS (ON CREATE)
  // ==========================================
  if (operation === 'create' && currentStatus === 'pending') {
    data.approvalToken = generateSecureHexToken()

    // Set explicit strict 48-hour operational window expiration
    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 48)
    data.tokenExpiration = expiry.toISOString()
  }

  // ==========================================
  // 2. UNIFIED TEMPORAL TIMESTAMP PARSING
  // ==========================================
  // Kept perfectly intact! This parses the text values passed by our interceptor
  if (data.travelDate && data.travelTime) {
    try {
      const baseDate = new Date(data.travelDate)
      const timeStr = data.travelTime.trim() // e.g., "09:00 AM" or "14:30"

      let hours = 0
      let minutes = 0

      if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
        // Parse 12-hour format
        const [time, modifier] = timeStr.split(' ')
        const [parsedHour, m] = time.split(':').map(Number)
        let h = parsedHour
        if (modifier.toUpperCase() === 'PM' && h < 12) h += 12
        if (modifier.toUpperCase() === 'AM' && h === 12) h = 0
        hours = h
        minutes = m
      } else {
        // Parse standard 24-hour format
        const [h, m] = timeStr.split(':').map(Number)
        hours = h
        minutes = m
      }

      baseDate.setHours(hours, minutes, 0, 0)
      data.tripStartTimestamp = baseDate.toISOString()

      // Allocate an estimated 4-hour operational padding window per booking
      const endDate = new Date(baseDate)
      endDate.setHours(endDate.getHours() + 4)
      data.tripEndTimestamp = endDate.toISOString()
    } catch (err) {
      req.payload.logger.error(
        `[Temporal Engine] Failed to parse travelTime execution grid: ${err}`,
      )
    }
  }

  // ==========================================
  // 3. FIRST-COME, FIRST-SERVED WINDOW CLOSE
  // ==========================================
  // The approval token is kept: the approval page validates it on every request, including to show
  // "already processed". The action refuses non-pending requests, so it cannot be reused.
  if (operation === 'update' && previousStatus === 'pending' && currentStatus !== 'pending') {
    data.tokenExpiration = null
  }

  // ==========================================
  // 4. DIFFERENTIAL DRIVER ASSIGNMENT GUARD
  // ==========================================
  if (operation === 'update') {
    const oldDriverId =
      originalDoc?.driver && typeof originalDoc.driver === 'object'
        ? originalDoc.driver.id
        : originalDoc?.driver
    const newDriverId = data.driver
    const travelDate = data.travelDate ?? originalDoc?.travelDate

    if (newDriverId && oldDriverId !== newDriverId) {
      data.driverToken = generateSecureHexToken()
      data.driverTokenExpiration = driverTokenExpiry(travelDate, req.payload.logger)
      data.__driverAssignedChanged = true
    } else {
      // Same driver: keep the token, but its expiry follows a changed travel date.
      if (
        originalDoc?.driverToken &&
        data.travelDate !== undefined &&
        travelDayKey(data.travelDate) !== travelDayKey(originalDoc.travelDate)
      ) {
        data.driverTokenExpiration = driverTokenExpiry(travelDate, req.payload.logger)
      }
      data.__driverAssignedChanged = false
    }
  }

  // Trips created with a driver (imports, admin create) also need a completion token. The cleanup below
  // still clears it unless the trip is approved or completed.
  if (operation === 'create' && data.driver) {
    data.driverToken = generateSecureHexToken()
    data.driverTokenExpiration = driverTokenExpiry(data.travelDate, req.payload.logger)
  }

  // ==========================================
  // 5. DATA CLEANUP SANITIZATION BASED ON STATUS
  // ==========================================
  if (data.status !== 'approved' && data.status !== 'completed') {
    data.driver = null
    data.driverPhone = null
    data.driverToken = null
    data.driverTokenExpiration = null
  }

  if (data.status !== 'declined') {
    data.declineReason = null
  }

  return data
}
