import { Block } from 'payload'
import TextFieldBlock from './text'
import NumberFieldBlock from './number'
import DateFieldBlock from './date'
import EmailFieldBlock from './email'
import TextareaFieldBlock from './textarea'
import SignatureFieldBlock from './signature'
import FileFieldBlock from './file'
import SelectFieldBlock from './select'
import SelectOperatorsFieldBlock from './select-operators'
import SelectRestaurantsFieldBlock from './select-restaurants'
import SelectDepartmentsFieldBlock from './select-departments'
import SelectStoreDepartmentsFieldBlock from './select-store-departments'
import SelectCrmCategoryFieldBlock from './select-crm-category'
import GlobalFieldRefBlock from './global-field-ref'

export const WorkflowFieldBlocksBase: Block[] = [
  TextFieldBlock,
  NumberFieldBlock,
  DateFieldBlock,
  EmailFieldBlock,
  TextareaFieldBlock,
  SignatureFieldBlock,
  FileFieldBlock,
  SelectFieldBlock,
  SelectOperatorsFieldBlock,
  SelectRestaurantsFieldBlock,
  SelectDepartmentsFieldBlock,
  SelectStoreDepartmentsFieldBlock,
  SelectCrmCategoryFieldBlock,
]

export const WorkflowFieldBlocksWithRef: Block[] = [...WorkflowFieldBlocksBase, GlobalFieldRefBlock]
