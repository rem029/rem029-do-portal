import { Field } from 'payload'
import { SlugFieldProps } from '../components/slug'
import { slugBeforeDuplicate } from '../hooks/slug-before-duplicate'

export const Slug: (operatorSlug: boolean, slugProps?: SlugFieldProps) => Field[] = (
  operatorSlug,
  slugProps,
) => {
  let fields: Field[] = [
    {
      type: 'text',
      unique: operatorSlug && operatorSlug === true ? false : true,
      required: true,
      name: 'slug',
      label: 'Slug',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/common/components/slug',
            clientProps: { slugProps },
          },
        },
        description: 'Unique identifier. eg. marketing, information-technology, it or hr',
      },
      hooks: {
        beforeDuplicate: [slugBeforeDuplicate],
      },
    },
  ]

  if (operatorSlug) {
    fields = [
      ...fields,
      {
        type: 'text',
        unique: true,
        required: true,
        name: 'operator_slug',
        label: 'Operator Slug',
        admin: {
          position: 'sidebar',
          readOnly: true,
          description:
            'Unique identifier with operator name. eg. marketing, information-technology, it or hr',
        },
      },
    ]
  }

  return fields
}
