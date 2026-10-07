import { DEFAULT_FORM_CHILD_FIELDS } from '@/utilities/constant'
import { filterByOperator } from '@/utilities/filter-by-operator'
import { Block, Field } from 'payload'

// Fixed name so reports and invitations can always find the answer under `department`.
const lockedNameField: Field = {
  type: 'text',
  name: 'name',
  label: 'Name (lowercase, no special characters)',
  required: true,
  defaultValue: 'department',
  admin: { readOnly: true },
  hooks: { beforeValidate: [() => 'department'] },
}

const childFields: Field[] = DEFAULT_FORM_CHILD_FIELDS.map((field) => {
  if (field.type === 'row' && Array.isArray(field.fields)) {
    return {
      ...field,
      fields: field.fields.map((subField) => {
        if ('name' in subField && subField.name === 'name') {
          return lockedNameField
        }
        return subField
      }),
    }
  }
  return field
})

const SurveyDepartmentBlock: Block & { label: string } = {
  slug: 'survey-department',
  interfaceName: 'SurveyDepartmentBlock',
  labels: { plural: 'Departments (Survey)', singular: 'Department (Survey)' },
  label: 'Department (Survey)',
  fields: [
    ...childFields,
    {
      name: 'add_all',
      type: 'checkbox',
      label: 'Add all departments',
      defaultValue: false,
    },
    {
      name: 'selected_items',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => !siblingData?.add_all,
      },
      filterOptions: filterByOperator,
      validate: (value, { siblingData }) => {
        const addAll = (siblingData as { add_all?: boolean | null } | undefined)?.add_all
        if (!addAll && (!value || (Array.isArray(value) && value.length === 0))) {
          return 'Pick at least one department or tick Add all'
        }
        return true
      },
    },
  ],
}

export default SurveyDepartmentBlock
