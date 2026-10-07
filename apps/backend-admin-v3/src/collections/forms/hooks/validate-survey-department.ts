import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'
import { walkFormFieldTree } from '@/utilities/form-field-tree'

export const validateSurveyDepartment: CollectionBeforeValidateHook = ({ data }) => {
  if (!data?.fields || !Array.isArray(data.fields)) {
    return data
  }

  let count = 0
  let invalidPlacement = false

  for (const { block, container } of walkFormFieldTree(data.fields)) {
    if (block?.blockType === 'survey-department') {
      count++
      if (container !== 'top' && container !== 'multi-step') {
        invalidPlacement = true
      }
    }
  }

  if (count > 1) {
    throw new ValidationError({
      errors: [
        {
          message: 'A form can have only one Department (Survey) field.',
          path: 'fields',
        },
      ],
    })
  }

  if (invalidPlacement) {
    throw new ValidationError({
      errors: [
        {
          message:
            'A Department (Survey) field can only be placed at the top level or directly inside a multi-step step.',
          path: 'fields',
        },
      ],
    })
  }

  return data
}
