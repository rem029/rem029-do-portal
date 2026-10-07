import { FieldConfig } from '@/common/components/service-item-details'
import { CollectionSlugs } from './helper/create-if-not-exists'

export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'richText' | 'upload'
  required?: boolean
  description?: string
}

interface CollectionMetaData {
  slug: CollectionSlugs
  label: string
  settingsSlug: string
  displayFields: FieldConfig[]
  formFields: FormFieldConfig[]
}

const collectionConfigs: Record<string, CollectionMetaData> = {
  'salary-deduction': {
    slug: 'salary-deduction',
    label: 'Salary Deduction',
    settingsSlug: 'salary-deduction-settings',
    displayFields: [
      { label: 'Employee Name', path: 'employee_name', type: 'text' },
      { label: 'Employee Email', path: 'employee_email', type: 'text' },
      { label: 'Employee ID', path: 'employee_h2a_id', type: 'text' },
      { label: 'Designation', path: 'employee_designation', type: 'text' },
      { label: 'Department', path: 'employee_department_name', type: 'text' },
      { label: 'Days Deducted', path: 'days_deducted', type: 'text' },
      { label: 'Subject', path: 'subject', type: 'text', fullWidth: true },
      { label: 'Description', path: 'description', type: 'richText', fullWidth: true },
      { label: 'Requested By', path: 'created_by', type: 'relationship' },
      { label: 'Date', path: 'createdAt', type: 'date' },
      { label: 'Attachments', path: 'attachments', type: 'upload', fullWidth: true },
    ],
    formFields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      {
        name: 'description',
        label: 'Description',
        type: 'richText',
        required: true,
        description: 'Provide a detailed description for the salary deduction request.',
      },
      {
        name: 'days_deducted',
        label: 'Days Deducted',
        type: 'number',
        required: true,
        description: "Number of days to be deducted from the employee's salary.",
      },
      {
        name: 'attachments',
        label: 'Attachments',
        type: 'upload',
        description: 'Upload relevant documents for the Salary deduction request.',
      },
    ],
  },
  warnings: {
    slug: 'warnings',
    label: 'Warnings',
    settingsSlug: 'warnings-settings',
    displayFields: [
      { label: 'Employee Name', path: 'employee_name', type: 'text' },
      { label: 'Employee Email', path: 'employee_email', type: 'text' },
      { label: 'Employee ID', path: 'employee_h2a_id', type: 'text' },
      { label: 'Designation', path: 'employee_designation', type: 'text' },
      { label: 'Department', path: 'employee_department_name', type: 'text' },
      { label: 'Subject', path: 'subject', type: 'text', fullWidth: true },
      { label: 'Description', path: 'description', type: 'richText', fullWidth: true },
      { label: 'Requested By', path: 'created_by', type: 'relationship' },
      { label: 'Date', path: 'createdAt', type: 'date' },
      { label: 'Attachments', path: 'attachments', type: 'upload', fullWidth: true },
    ],
    formFields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      {
        name: 'description',
        label: 'Description',
        type: 'richText',
        required: true,
        description: 'Provide a detailed description for the warning request.',
      },
      {
        name: 'attachments',
        label: 'Attachments',
        type: 'upload',
        description: 'Upload relevant documents for the warning request.',
      },
    ],
  },
  notices: {
    slug: 'notices',
    label: 'Notices',
    settingsSlug: 'notices-settings',
    displayFields: [
      {
        label: 'Notice Type',
        path: 'type',
        type: 'select',
        options: [
          { label: 'Salary Deduction', value: 'salary-deduction' },
          { label: 'Warnings', value: 'warnings' },
        ],
      },
      { label: 'Employee Name', path: 'employee_name', type: 'text' },
      { label: 'Employee Email', path: 'employee_email', type: 'text' },
      { label: 'Employee ID', path: 'employee_h2a_id', type: 'text' },
      { label: 'Designation', path: 'employee_designation', type: 'text' },
      { label: 'Department', path: 'employee_department_name', type: 'text' },
      { label: 'Days Deducted', path: 'days_deducted', type: 'text' },
      { label: 'Subject', path: 'subject', type: 'text', fullWidth: true },
      { label: 'Description', path: 'description', type: 'richText', fullWidth: true },
      { label: 'Requested By', path: 'created_by', type: 'relationship' },
      { label: 'Date', path: 'createdAt', type: 'date' },
      { label: 'Attachments', path: 'attachments', type: 'upload', fullWidth: true },
    ],
    formFields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      {
        name: 'description',
        label: 'Description',
        type: 'richText',
        required: true,
        description: 'Provide a detailed description for the notice request.',
      },
      {
        name: 'days_deducted',
        label: 'Days Deducted',
        type: 'number',
        required: false,
        description: "Number of days to be deducted from the employee's salary.",
      },
      {
        name: 'attachments',
        label: 'Attachments',
        type: 'upload',
        description: 'Upload relevant documents for the notice request.',
      },
    ],
  },
  'disciplinary-actions': {
    slug: 'disciplinary-actions',
    label: 'Disciplinary Actions',
    settingsSlug: 'disciplinary-actions-settings',
    displayFields: [
      { label: 'Employee Name', path: 'employee_name', type: 'text' },
      { label: 'Employee Email', path: 'employee_email', type: 'text' },
      { label: 'Employee ID', path: 'employee_h2a_id', type: 'text' },
      { label: 'Designation', path: 'employee_designation', type: 'text' },
      { label: 'Department', path: 'employee_department_name', type: 'text' },
      { label: 'Subject', path: 'subject', type: 'text', fullWidth: true },
      { label: 'Description', path: 'description', type: 'richText', fullWidth: true },
      { label: 'Requested By', path: 'created_by', type: 'relationship' },
      { label: 'Date', path: 'createdAt', type: 'date' },
      { label: 'Attachments', path: 'attachments', type: 'upload', fullWidth: true },
    ],
    formFields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      {
        name: 'description',
        label: 'Description',
        type: 'richText',
        required: true,
        description: 'Provide a detailed description for the disciplinary action request.',
      },
      {
        name: 'attachments',
        label: 'Attachments',
        type: 'upload',
        description: 'Upload relevant documents for the disciplinary action request.',
      },
    ],
  },
  'form-submissions': {
    slug: 'form-submissions',
    label: 'Form Submission',
    settingsSlug: 'form-submissions-settings',
    displayFields: [
      { label: 'Submitted By', path: 'created_by', type: 'relationship' },
      { label: 'Submitted At', path: 'createdAt', type: 'date' },
    ],
    formFields: [],
  },
}

export const getCollectionConfig = (slug: string): CollectionMetaData | undefined => {
  return collectionConfigs[slug]
}
