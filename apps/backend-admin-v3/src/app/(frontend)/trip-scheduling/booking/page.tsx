import React from 'react'
import config from '@payload-config'
import { getPayload } from 'payload'
import { BookingForm } from './booking-form'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'

export const dynamic = 'force-dynamic'

export default async function BookingPage() {
  const { generalBackground } = await getTripSchedulingPublicSettings()
  const payload = await getPayload({ config })

  // Fetch operators, categories, vehicles, and zones concurrently for dropdowns
  const [operatorsRes, categoriesRes, vehiclesRes, zonesRes] = await Promise.all([
    payload.find({ collection: 'operators', pagination: false, overrideAccess: true }),
    payload.find({ collection: 'trip-scheduling-categories', pagination: false, overrideAccess: true }),
    payload.find({ collection: 'trip-scheduling-vehicles', pagination: false, overrideAccess: true }),
    payload.find({ collection: 'trip-scheduling-zones', pagination: false, overrideAccess: true }),
  ])

  return (
    <main
      className="min-h-screen py-12 xl:py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-2xl xl:max-w-[1180px] relative z-10">
        <BookingForm
          operators={operatorsRes.docs as any}
          categories={categoriesRes.docs as any}
          vehicles={vehiclesRes.docs as any}
          zones={zonesRes.docs as any}
        />
      </div>
    </main>
  )
}