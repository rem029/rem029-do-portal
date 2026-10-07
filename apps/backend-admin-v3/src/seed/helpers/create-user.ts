import { Department, Operator, UsersAccess } from '@/payload-types'
import { Payload } from 'payload'
import { createDefaultUserAccess } from './create-user-access'

export const createUserIfNotExists = async (
  payload: Payload,
  email: string,
  operator: Operator,
  department?: Department,
  disableVerificationEmail?: boolean,
  isManagerOrName?: boolean | string,
  password?: string,
) => {
  disableVerificationEmail = disableVerificationEmail ?? true

  if (process.env.NODE_ENV === 'production') {
    payload.logger.warn(`Skipping user creation for ${email} in production mode.`)
    return
  }

  const existingUser = await payload.find({
    collection: 'users',
    where: {
      email: { equals: email },
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existingUser.totalDocs === 0) {
    const userAccess = await createDefaultUserAccess(payload, isManagerOrName)

    await payload.create({
      collection: 'users',
      data: {
        email: email,
        password: password ?? email,
        _verified: true,
        operator: operator.id,
        department: department?.id,
        access: userAccess.id,
      },
      overrideAccess: true,
      disableVerificationEmail,
    })
    console.log(`✓ Created user for: ${email}`)
  }
}
