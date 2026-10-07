import type { CollectionBeforeValidateHook } from 'payload'

export const beforeValidate: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return data

  const publicZoneInput = data.public_zone_input

  if (publicZoneInput !== undefined && publicZoneInput !== null && publicZoneInput !== '') {
    const zoneNameString = String(publicZoneInput).trim()

    if (zoneNameString) {
      const existingZones = await req.payload.find({
        collection: 'trip-scheduling-zones' as any,
        where: { name: { equals: zoneNameString } },
        limit: 1,
        overrideAccess: true,
      })

      let zoneId: string | number

      if (existingZones.docs && existingZones.docs.length > 0) {
        zoneId = existingZones.docs[0].id
      } else {
        const newZone = await req.payload.create({
          collection: 'trip-scheduling-zones' as any,
          data: {
            name: zoneNameString,
            cost: 0,
            isActive: true,
          } as any,
          req,
        })
        zoneId = newZone.id
      }

      data.zone = zoneId
      data.public_zone_input = null
    }
  }

  return data
}
