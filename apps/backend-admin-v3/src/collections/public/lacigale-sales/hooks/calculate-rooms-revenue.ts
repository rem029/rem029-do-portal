import { CollectionBeforeChangeHook } from 'payload'

/**
 * Hook to handle Room Revenue and Occupancy logic.
 * Location: src/collections/public/lacigale-sales/hooks/
 */
export const calculateRoomsRevenue: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.rooms) {
    const occupied = Number(data.rooms.no_rooms_occupied) || 0
    const complimentary = Number(data.rooms.complimentary_house_use) || 0
    const rate = Number(data.rooms.average_room_rate) || 0

    // 1. Calculate Rooms Revenue (Existing)
    data.rooms.rooms_revenue = occupied * rate

    /**
     * FUTURE AUTOMATION: % OF OCCUPANCY
     * To enable: Uncomment the block below.
     * Note: This uses 225 as the total physical room baseline.
     */
    /*
    const TOTAL_ROOMS_CONSTANT = 225
    const sellableCapacity = TOTAL_ROOMS_CONSTANT - complimentary
    
    if (sellableCapacity > 0) {
      data.rooms.occupancy_percentage = Number(
        ((occupied / sellableCapacity) * 100).toFixed(2)
      )
    } else {
      data.rooms.occupancy_percentage = 0
    }
    */
  }
  return data
}
