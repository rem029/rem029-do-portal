import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { seed } from '../src/seed'

async function run() {
  const payload = await getPayload({ config })

  await seed({ payload })

  console.log('Seed completed.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
