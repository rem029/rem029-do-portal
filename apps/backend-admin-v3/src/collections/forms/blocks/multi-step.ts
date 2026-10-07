import { Block } from 'payload'
import FilesBlock from './files'
import SignatureBlock from './signature'
import GroupedBlock from './group'
import ListBlock from './list'
import ConditionalBlock from './conditional'
import PhoneBlock from './phone'
import SelectRestaurantsBlock from './select-restaurants'
import SelectOperatorsBlock from './select-operators'
import SelectStoreDepartmentsBlock from './select-store-departments'
import SelectCrmCategoryBlock from './select-crm-category'
import { fields } from '@payloadcms/plugin-form-builder'
import { enhanceBlocks } from '@/utilities/forms-enhanced-fields'
import TimeBlock from './time'
import RatingBlock from './rating'
import ScaleBlock from './scale'
import SurveyDepartmentBlock from './survey-department'

// Mirror the same FORM_BLOCKS pattern used in group.ts / list.ts:
// custom blocks first (not in plugin defaults), then spread plugin's built-in fields.
// CountryBlock and TimeBlock are intentionally excluded here because `country`
// already exists in the plugin's `fields` — adding them again causes DuplicateFieldName.
const STEP_FIELD_BLOCKS: Block[] = [
  FilesBlock,
  SignatureBlock,
  PhoneBlock,
  GroupedBlock,
  ListBlock,
  ConditionalBlock,
  SelectRestaurantsBlock,
  SelectOperatorsBlock,
  SelectStoreDepartmentsBlock,
  SelectCrmCategoryBlock,
  TimeBlock,
  RatingBlock,
  ScaleBlock,
  SurveyDepartmentBlock,
  ...(Object.keys(fields).map((k) => fields[k]) as Block[]).filter(
    (b): b is Block => typeof b === 'object' && 'slug' in b,
  ),
]

const MultiStepBlock: Block & { label: string } = {
  slug: 'multi-step',
  interfaceName: 'FormMultiStepBlock',
  labels: { plural: 'Multi-Step Forms', singular: 'Multi-Step Form' },
  label: 'Multi-Step Form',
  fields: [
    {
      type: 'array',
      name: 'steps',
      label: 'Steps',
      minRows: 2,
      fields: [
        {
          type: 'text',
          name: 'label',
          label: 'Step Label',
          required: true,
          localized: true,
          admin: {
            description: 'Short name shown in the progress bar (e.g. "Personal Info", "Documents")',
          },
        },
        {
          type: 'blocks',
          name: 'fields',
          label: 'Fields',
          blocks: enhanceBlocks(STEP_FIELD_BLOCKS),
        },
      ],
    },
  ],
}

export default MultiStepBlock
