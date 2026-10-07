import { Payload } from 'payload'
import { createIfMissing, emptySeedCount, type SeedCount } from './helpers/create-if-missing'

export const seedTripSchedulingDrivers = async (payload: Payload): Promise<SeedCount> => {
  payload.logger.info('  └─ Seeding Drivers...')
  const drivers = [
    { name: 'Sudheesh Gopi', email: 'sudheesh18483@gmail.com', phone: '3125-8330' },
    { name: 'Rohith Shetty', email: 'rohitshetty325@gmail.com', phone: '7477-8702' },
    { name: 'Mahammad Junaid', email: 'junnijunaid@gmail.com', phone: '5092-3630' },
    { name: 'Shahid Mahmud', email: 'shahid.mahmud@dohaoasis.com', phone: '5116-1006' },
    { name: 'Shyam Lal Chaudhary', email: 'chaudharyshyamlal31@gmail.com', phone: '7727-0951' },
    { name: 'Jeevakanth Sinthilnathan', email: 'jeeva04291997@gmail.com', phone: '7752-2652' },
    { name: 'MD Rajebul', email: 'rajbulmdrajebul@gmail.com', phone: '7043-9299' },
  ]

  const count = emptySeedCount()
  for (const d of drivers) {
    // email is the drivers' unique field
    count[await createIfMissing(payload, 'trip-scheduling-drivers', { email: { equals: d.email } }, { ...d, isActive: true })]++
  }
  return count
}
