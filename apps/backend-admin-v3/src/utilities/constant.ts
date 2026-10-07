import { Config } from '@/payload-types'
import { Field } from 'payload'

export const WEB_TYPE = process.env.WEB_TYPE || 'default'

export const ENV = process.env.NODE_ENV || 'development'
export const MAX_FILE_SIZE = process.env.PAYLOAD_PUBLIC_MAX_FILE_SIZE || 5000000
export const TOKEN_SECRET = process.env.TOKEN_SECRET

export const NODE_MAILER_USER = process.env.PAYLOAD_PUBLIC_NODE_MAILER_USER
export const NODE_MAILER_PASS = process.env.PAYLOAD_PUBLIC_NODE_MAILER_PASS
export const NODE_MAILER_FROM = process.env.PAYLOAD_PUBLIC_NODE_MAILER_FROM
export const NODE_MAILER_HOST = process.env.PAYLOAD_PUBLIC_NODE_MAILER_HOST
export const NODE_MAILER_PORT = process.env.PAYLOAD_PUBLIC_NODE_MAILER_PORT
export const NODE_MAILER_SECURE = process.env.PAYLOAD_PUBLIC_NODE_MAILER_SECURE === 'true'
export const NODE_MAILER_TLS_REJECT_UNAUTHORIZED =
  process.env.PAYLOAD_PUBLIC_NODE_MAILER_TLS_REJECT_UNAUTHORIZED === 'true'

export const CF_SECREY_KET = process.env.PAYLOAD_PUBLIC_CF_SECREY_KET || ''

export const TIMEZONE = 'Asia/Qatar'

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3015'
export const BACKEND_URL_WITH_BASE = BACKEND_URL + BASE_PATH

export const SLUGS_TO_TRACK: (keyof Config['collections'] | keyof Config['globals'])[] = [
  'users',
  'users-access',
  'operators',
  'departments',
  'media',
  'link-shortener',
  'workflow',
  'salary-deduction',
  'salary-deduction-settings',
  'forms',
  'form-submissions',
  'survey-invitations',
  'survey-send-invitation',
  'warnings',
  'warnings-settings',
  'audit-logs',
  'audit-log-settings',
  'analytics',
  'menu-media',
  'menu-allergens',
  'menu-tags',
  'menu-categories',
  'menu-items',
  'menu',
  'menu-pages',
  'fnb-import',
]

export const COLLECTION_SLUGS: (keyof Config['collections'])[] = [
  'media',
  'users',
  'users-access',
  'departments',
  'operators',
  'link-shortener',
  'link-shortener-media',
  'e-recognition',
  'internal-media',
  'workflow',
  'salary-deduction',
  'forms',
  'form-submissions',
  'survey-invitations',
  'audit-logs',
  'analytics',
  'menu-media',
  'menu-allergens',
  'menu-tags',
  'menu-categories',
  'menu-items',
  'menu',
  'menu-pages',
]

export const GLOBAL_SLUGS: (keyof Config['globals'])[] = [
  'h2a-oasys-settings',
  'salary-deduction-settings',
  'employee-history',
  'audit-log-settings',
  'forms-dashboard',
  'survey-send-invitation',
  'fnb-import',
]

export const nameField: Field = {
  type: 'text',
  name: 'name',
  label: 'Name (lowercase, no special characters)',
  required: true,
}

export const labelField: Field = {
  type: 'text',
  name: 'label',
  label: 'Label',
  localized: true,
}

export const widthField: Field = {
  type: 'number',
  name: 'width',
  label: 'Field Width (percentage)',
  min: 0,
  max: 100,
}

export const requiredField: Field = {
  type: 'checkbox',
  name: 'required',
  label: 'Required',
  defaultValue: false,
}

export const fieldVariantField: Field = {
  type: 'select',
  name: 'variant',
  label: 'Display Variant',
  defaultValue: 'default',
  options: [
    { label: 'Default', value: 'default' },
    { label: 'Label on Top', value: 'label-on-top' },
  ],
}

export const directionField: Field = {
  type: 'select',
  name: 'direction',
  label: 'Options Direction',
  defaultValue: 'column',
  options: [
    { label: 'Column (vertical)', value: 'column' },
    { label: 'Row (horizontal)', value: 'row' },
  ],
}

export const DEFAULT_FORM_CHILD_FIELDS: Field[] = [
  {
    type: 'row',
    fields: [nameField, labelField],
  },
  {
    type: 'row',
    fields: [widthField, fieldVariantField],
  },
  {
    type: 'row',
    fields: [requiredField],
  },
]
