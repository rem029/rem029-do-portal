import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { createIfMissing, emptySeedCount, type SeedCount } from './helpers/create-if-missing'

export const seedTripSchedulingVehicles = async (payload: Payload): Promise<SeedCount> => {
  payload.logger.info('  └─ Seeding Vehicles...')
  const vehicles: RequiredDataFromCollectionSlug<'trip-scheduling-vehicles'>[] = [
    {
      name: 'Bus 01 (Al Sadd)',
      category: 'employee-transport',
      capacity: { value: 30, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Bus 02 (Al Sadd)',
      category: 'employee-transport',
      capacity: { value: 30, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Bus 03 (Al Sadd)',
      category: 'employee-transport',
      capacity: { value: 30, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Van 01 (Al Sadd)',
      category: 'employee-transport',
      capacity: { value: 15, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Van 02 (Al Sadd)',
      category: 'employee-transport',
      capacity: { value: 15, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Bus 01 (Yasameen)',
      category: 'employee-transport',
      capacity: { value: 30, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Bus 02 (Yasameen)',
      category: 'employee-transport',
      capacity: { value: 30, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Bus 03 (Yasameen)',
      category: 'employee-transport',
      capacity: { value: 30, unit: 'people' },
      isActive: true,
    },
    { name: 'Toyota Hiace (Cargo)', category: 'cargo', isActive: true },
    {
      name: 'Toyota Passenger (13 Seater)',
      category: 'passenger',
      capacity: { value: 13, unit: 'people' },
      isActive: true,
    },
    { name: 'Nissan Chiller', category: 'freezer', isActive: true },
    {
      name: 'Nissan Passenger (12 Seater)',
      category: 'passenger',
      capacity: { value: 12, unit: 'people' },
      isActive: true,
    },
    { name: 'CMC Freezer', category: 'freezer', isActive: true },
    { name: 'Isuzu Truck Freezer (Large)', category: 'truck', isActive: true },
    { name: 'Audi A8 (Limousine - Guests Only)', category: 'limousine', isActive: true },
    { name: 'Mercedes Viano (Limousine - Guests Only)', category: 'limousine', isActive: true },
    {
      name: 'Mercedes Sprinter (7 Seater - Guests Only)',
      category: 'passenger',
      capacity: { value: 7, unit: 'people' },
      isActive: true,
    },
    {
      name: 'Mercedes Sprinter (11 Seater - Guests Only)',
      category: 'passenger',
      capacity: { value: 11, unit: 'people' },
      isActive: true,
    },
  ]

  const count = emptySeedCount()
  for (const v of vehicles) {
    count[await createIfMissing(payload, 'trip-scheduling-vehicles', { name: { equals: v.name } }, { ...v, isActive: true })]++
  }
  return count
}
