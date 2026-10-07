import { h2aOasysTest } from './endpoints/test'
import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import { GlobalConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'

const SLUG = 'h2a-oasys-settings'

const H2AOasysSettings: GlobalConfig = {
  slug: SLUG,
  label: 'H2A Oasys',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: true }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: true }),
  },
  admin: {
    hidden: ({ user }) => {
      return accessHiddenBySlug(user as unknown as User, SLUG)
    },
    group: 'Settings',
  },
  endpoints: [h2aOasysTest],
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG)],
  },
  fields: [
    CreatedByField,
    UpdatedByField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Config',
          fields: [
            {
              type: 'text',
              name: 'base_url',
              label: 'Base URL',
            },
            {
              type: 'text',
              name: 'client_id',
              label: 'Client ID',
            },
            {
              type: 'text',
              name: 'secret',
              label: 'Secret',
            },
            {
              type: 'row',
              fields: [
                {
                  type: 'ui',
                  name: 'test_connection',
                  label: 'Test Connection',
                  admin: {
                    components: {
                      Field: `@/globals/h2a-oasys-settings/components/test`,
                    },
                  },
                },
                {
                  type: 'ui',
                  name: 'refresh_data_now',
                  label: 'Run Refresh Job',
                  admin: {
                    components: {
                      Field: `@/globals/h2a-oasys-settings/components/refresh`,
                    },
                  },
                },
                {
                  type: 'ui',
                  name: 'seed_h2a_database',
                  label: 'Seed H2A Database',
                  admin: {
                    components: {
                      Field: `@/globals/h2a-oasys-settings/components/seed`,
                    },
                  },
                },
              ],
            },
            {
              type: 'code',
              name: 'last_token_response',
              label: 'Last Token',
              admin: {
                readOnly: true,
              },
            },
            {
              type: 'date',
              name: 'last_token_response_updated_by',
              label: 'Last Token Updated By',
              admin: {
                readOnly: true,
                date: {
                  displayFormat: 'dd/MM/yyyy HH:mm:ss',
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              type: 'relationship',
              name: 'divisions_operator',
              label: 'Divisions',
              relationTo: 'operators',
              hasMany: true,
            },
            {
              type: 'ui',
              name: 'sync_divider',
              admin: {
                components: {
                  Field: '@/common/components/divider',
                },
              },
            },
            {
              type: 'row',
              fields: [
                {
                  type: 'date',
                  name: 'employee_info_last_updated_at',
                  label: 'Info Sync',
                  admin: {
                    readOnly: true,
                    date: {
                      displayFormat: 'dd/MM/yyyy HH:mm:ss',
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  type: 'date',
                  name: 'employee_doj_last_updated_at',
                  label: 'DOJ Sync',
                  admin: {
                    readOnly: true,
                    date: {
                      displayFormat: 'dd/MM/yyyy HH:mm:ss',
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  type: 'date',
                  name: 'employee_budget_last_updated_at',
                  label: 'Budget Sync',
                  admin: {
                    readOnly: true,
                    date: {
                      displayFormat: 'dd/MM/yyyy HH:mm:ss',
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  type: 'date',
                  name: 'employee_probation_last_updated_at',
                  label: 'Probation Sync',
                  admin: {
                    readOnly: true,
                    date: {
                      displayFormat: 'dd/MM/yyyy HH:mm:ss',
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  type: 'date',
                  name: 'employee_on_leave_last_updated_at',
                  label: 'Leave Sync',
                  admin: {
                    readOnly: true,
                    date: {
                      displayFormat: 'dd/MM/yyyy HH:mm:ss',
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  type: 'date',
                  name: 'employee_leave_history_last_updated_at',
                  label: 'History Sync',
                  admin: {
                    readOnly: true,
                    date: {
                      displayFormat: 'dd/MM/yyyy HH:mm:ss',
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export default H2AOasysSettings
