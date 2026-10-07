import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import {
  loadTripForCompletion,
  type TripCompletionLoad,
} from '@/collections/trip-scheduling/actions/complete-trip-load'
import { TripCompletionView } from '../../../_components/trip-completion-view'

interface CompletionPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function BookingCompletionPage({ params, searchParams }: CompletionPageProps) {
  const { id } = await params
  const { token } = await searchParams

  const payload = await getPayload({ config })
  const [{ generalBackground }, load] = await Promise.all([
    getTripSchedulingPublicSettings(),
    loadTripForCompletion(payload, { slug: 'trip-scheduling-bookings', id, token }).catch(
      (err): TripCompletionLoad => {
        payload.logger.error(
          `[Booking Completion Page Error]: ${err instanceof Error ? err.message : String(err)}`,
        )
        return { state: 'invalid' }
      },
    ),
  ])

  return (
    <TripCompletionView
      slug="trip-scheduling-bookings"
      id={id}
      token={token ?? ''}
      load={load}
      backgroundImage={generalBackground}
      title="VEHICLE BOOKING REQUEST"
    />
  )
}
