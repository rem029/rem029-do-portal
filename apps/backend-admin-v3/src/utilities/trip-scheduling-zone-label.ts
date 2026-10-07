import type { TripSchedulingZone } from '@/payload-types'

// Same label as the booking form's Zone dropdown: "Zone 28 (Al Doha Al Jadeeda)", or "Zone 28" without a district.
export const formatZoneLabel = (zone: TripSchedulingZone | null | undefined): string | null => {
  if (!zone) return null
  const zoneNumber = zone.zoneNumber || ''
  return zone.district ? `Zone ${zoneNumber} (${zone.district})` : `Zone ${zoneNumber}`
}
