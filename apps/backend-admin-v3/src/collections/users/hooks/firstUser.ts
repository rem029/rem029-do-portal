import { User } from '@/payload-types'
import { CollectionBeforeChangeHook } from 'payload'

const firstUserHook: CollectionBeforeChangeHook<User> = async ({ operation, req, data }) => {
  if (operation === 'create') {
    const users = await req.payload.find({ collection: 'users', limit: 0 })
    if (users.totalDocs === 0) {
      req.payload.logger.info('First user defaulting to superuser enabled')

      data = {
        ...data,
        super_user: true,
      }

      return data
    }
  }
}

export default firstUserHook
