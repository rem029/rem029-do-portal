import { Payload } from 'payload'
import { createIfMissing, emptySeedCount, type SeedCount } from './helpers/create-if-missing'

export const seedTripSchedulingCategories = async (payload: Payload): Promise<SeedCount> => {
  payload.logger.info('  └─ Seeding Trip Categories...')
  const categories = [
    'Staff Pickup & Drop-off',
    'Staff Pickup/Drop-off to Airport',
    'Emergency Staff Transport',
    'Inter-branch Staff Transfer',
    'Guest Pickup / Drop-off (Airport / Hotel)',
    'VIP / Management Transportation',
    'Visitor Transportation',
    'Home Delivery',
    'Catering Delivery',
    'Parcel / Document Delivery',
    'Inter-office Delivery',
    'Material Delivery (Stores / Warehouse)',
    'Laundry / Linen Delivery',
    'Purchasing (Market / Supermarket / Suppliers)',
    'Store-to-Store Supply Transfer',
    'Procurement Support',
    'Car Service / Repair / Maintenance',
    'Vehicle Inspection (Fahes)',
    'Fueling Requests',
    'Technical / Maintenance Team Transport',
    'Event Setup / Dismantling Transportation',
    'Catering Event Transportation',
    'Outdoor Events / Activation Support',
    'Hospital / Clinic Transport',
    'Emergency Transport',
    'Drop / Pick for Medical Commission',
    'Accommodation / Staff Move-in & Move-out',
    'Apartment / Building Transfer',
    'Bank Visits',
    'Certificate / Training Support (Drop & Pick)',
    'Food Handler Certification Support',
    'Courier Service',
    'Custom Requests / Other',
  ]

  const count = emptySeedCount()
  for (const cat of categories) {
    count[await createIfMissing(payload, 'trip-scheduling-categories', { name: { equals: cat } }, { name: cat })]++
  }
  return count
}
