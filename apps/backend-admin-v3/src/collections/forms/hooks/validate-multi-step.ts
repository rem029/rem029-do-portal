import { Form } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const validateMultiStepConstraint: CollectionBeforeChangeHook<Form> = ({ data }) => {
  const fields: Form['fields'] = data?.fields || []
  const hasMultiStep = fields.some((f: any) => f.blockType === 'multi-step')

  if (hasMultiStep && fields.length > 1) {
    const otherBlocks = fields
      .filter((f) => f.blockType !== 'multi-step')
      .map((f) => f.blockType)
      .join(', ')

    throw new APIError(
      `A Multi-Step form cannot be mixed with other fields (found: ${otherBlocks}). Move all fields inside the Multi-Step block's steps, or remove the Multi-Step block.`,
      400,
    )
  }

  return data
}
