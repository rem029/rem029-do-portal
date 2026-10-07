import { Operator } from '@/payload-types'
import { createCollectionIfNotExists } from '@/utilities/helper/create-if-not-exists'

import type { Payload } from 'payload'

export const INITIAL_OPERATORS: Pick<
  Operator,
  'title' | 'slug' | 'super_user' | 'h2a_division_id'
>[] = [
  { title: 'Doha Oasis', slug: 'doha-oasis', super_user: false, h2a_division_id: 'DOA' },
  { title: 'Doha Quests', slug: 'doha-quest', super_user: false, h2a_division_id: 'DOQ' },
  { title: 'Printemps', slug: 'printemps', super_user: false, h2a_division_id: 'PTM' },
]

export const seedOperator = async ({
  payload,
}: {
  payload: Payload
}): Promise<Operator[] | undefined> => {
  const logger = payload.logger
  logger.info('Creating operators...')

  try {
    const operators: Operator[] = []
    for (const operator of INITIAL_OPERATORS) {
      logger.info(
        `Creating or checking for existing operator slug ${operator.slug}... with data ${JSON.stringify(operator, null, 4)}`,
      )
      try {
        const newOperator = await createCollectionIfNotExists<'operators'>({
          payload,
          collection: 'operators',
          where: { slug: { equals: operator.slug } },
          data: { ...operator },
          overrideAccess: true,
        })
        if (!operator.h2a_division_id) continue
        operators.push(newOperator)
      } catch (error) {
        logger.error(`Error creating operator: ${JSON.stringify(error, null, 4)}`)
        continue
      }
    }
    return operators
  } catch (error) {
    logger.error(`Error creating operators: ${JSON.stringify(error, null, 4)}`)
    throw error
  }
}
