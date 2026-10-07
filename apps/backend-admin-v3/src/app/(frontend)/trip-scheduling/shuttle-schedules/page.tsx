import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'
import { ShuttleSchedulesView } from './shuttle-schedules-view'

export const dynamic = 'force-dynamic'

export default async function ShuttleSchedulesPage() {
  const { generalBackground } = await getTripSchedulingPublicSettings()

  return <ShuttleSchedulesView backgroundImage={generalBackground} />
}
