import { CollectionBeforeChangeHook } from 'payload'

const FB_FIELDS = [
  'fb_sales.sky_view',
  'fb_sales.shisha_garden',
  'fb_sales.sushi_bar',
  'fb_sales.traiteur',
  'fb_sales.odc_special_contracts',
  'fb_sales.di_capri',
  'fb_sales.le_cigalon',
  'fb_sales.lobby_lounge',
  'fb_sales.mini_bar',
  'fb_sales.orangery',
  'fb_sales.room_service',
  'fb_sales.banquets',
  'fb_sales.ramadan_tent',
]

// Identify the new guest fields for summation
const GUEST_FIELDS = FB_FIELDS.map((field) => `${field}_guests`)

const MISC_FIELDS = [
  'misc.telephone',
  'misc.business_center',
  'misc.laundry',
  'misc.spa_and_recreation',
  'misc.hotel_taxi',
  'misc.cigar_shop',
  'misc.space_rental',
  'misc.flower_shop',
  'misc.other_misc',
]

const sumValues = (fields: string[], data: any) =>
  fields.reduce((acc, path) => {
    const val = path.split('.').reduce((o, k) => o?.[k], data)
    return acc + (Number(val) || 0)
  }, 0)

export const storeReportTotals: CollectionBeforeChangeHook = ({ data }) => {
  const fbSum = sumValues(FB_FIELDS, data)
  const guestSum = sumValues(GUEST_FIELDS, data) // Summing the new guests
  const miscSum = sumValues(MISC_FIELDS, data)
  const roomsSum = Number(data?.rooms?.rooms_revenue) || 0

  // Update the data object with the new totals
  data.total_fb_sales = fbSum
  data.total_fb_guests = guestSum // This field needs to be added to the Collection too!
  data.total_misc_sales = miscSum
  data.grand_total_column = fbSum + miscSum + roomsSum

  return data
}
