import 'dotenv/config'
import { initH2ADatabase, upsertEmployeeInfo } from '../src/services/h2a-database'

const DUMMY_DIVISION_ID = 'DEV-DUMMY'

async function run() {
  await initH2ADatabase()

  await upsertEmployeeInfo(DUMMY_DIVISION_ID, {
    'E.N': 'DEV-0001',
    NAME: 'Default Payload',
    DESIGNATION: 'Administrator',
    DEPARTMENT: 'IT',
    'Sub Department': 'Platform',
    DOJ: '2024-01-01',
    'COMPANY EMAIL': 'default@payload.com',
    'PERSONAL EMAIL': 'default@payload.com',
    NATIONALITY: 'Qatari',
    GENDER: 'Male',
    'QID NUMBER': '00000000000',
  })

  console.log(`Seeded dummy H2A employee info for default@payload.com (division ${DUMMY_DIVISION_ID}).`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
