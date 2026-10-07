import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import { getHistoryViewer } from '@/utilities/trip-scheduling-history-session'
import { BookingHistoryView } from './booking-history-view'

export const dynamic = 'force-dynamic'

export default async function BookingHistoryPage() {
  const [{ generalBackground }, viewer] = await Promise.all([
    getTripSchedulingPublicSettings(),
    getHistoryViewer(),
  ])

  return <BookingHistoryView backgroundImage={generalBackground} initialViewer={viewer} />
}
