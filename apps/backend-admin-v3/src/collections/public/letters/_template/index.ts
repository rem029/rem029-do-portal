import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { EmployeeFields } from '@/common/fields/employee-fields'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import {
  AccessAdmin,
  accessCheck,
  accessCheckResolver,
  accessHiddenBySlug,
  AccessType,
} from '@/utilities/access'
import {
  Access,
  CollectionConfig,
  Where,
  PayloadRequest,
  CollectionSlug,
  Field,
  CollectionAdminOptions,
  GlobalSlug,
  APIError,
} from 'payload'
import { checkTimeBasedAccess } from '@/utilities/time-based-access'
import { WorkflowFields } from '@/common/fields/workflow'
import { workflowInit, WorkflowInitArgs } from '@/common/hooks/workflow-init'
import { workflowUpdate } from '@/common/hooks/workflow-update'
import { workflowShouldAutoComplete } from '@/common/hooks/workflow-auto-complete'
import {
  workflowNotification,
  WorkflowNotificationArgs,
} from '@/common/hooks/workflow-notification'

interface ServiceTemplateConfig<T> {
  slug: string
  settingsSlug: string
  dbName?: CollectionConfig['dbName']
  fields: Field[]
  labels?: CollectionConfig['labels']
  listSearchableFields?: CollectionAdminOptions['listSearchableFields']
  defaultColumns?: CollectionAdminOptions['defaultColumns']
  workflowInitArgs: WorkflowInitArgs<T>
  workflowNotificationArgs?: WorkflowNotificationArgs<T>
}

const serviceTemplateConfig = <T = any>(args: ServiceTemplateConfig<T>): CollectionConfig => {
  const {
    slug,
    settingsSlug,
    dbName,
    fields,
    labels,
    listSearchableFields,
    defaultColumns,
    workflowInitArgs,
    workflowNotificationArgs,
  } = args
  const COLLECTION_NAME = slug

  const workflowCheck: (user: User) => Where = (user) => {
    const operatorId = typeof user.operator === 'object' ? user.operator?.id : user.operator
    const andChecks: Where[] = []

    // User must be the creator OR an active reviewer
    const orChecks: Where[] = [
      // User created the document
      { created_by: { equals: user.id } },
    ]

    // Only allow access if user is an assigned reviewer AND the workflow is active (not draft)
    if (user.email) {
      orChecks.push({
        and: [
          { _workflow_status: { not_equals: 'draft' } },
          { 'workflow_reviews.reviewer': { equals: user.email } },
        ],
      })
    }

    // If there's an operator, ensure the document belongs to the same operator
    // AND the user is either creator or reviewer
    if (operatorId) {
      andChecks.push({ operator: { equals: operatorId } })
    }

    return {
      and: [
        ...andChecks,
        {
          or: orChecks,
        },
      ],
    } as Where
  }

  const accessCheckFields: (access: AccessType) => Access =
    (access) =>
      async ({ req }) => {
        const hasAccess = await accessCheck(COLLECTION_NAME as CollectionSlug, 'super_user', {
          reqOverride: req,
          fallbackAccess: false,
        })

        if (hasAccess) return true

        return await accessCheck(COLLECTION_NAME as CollectionSlug, access, {
          reqOverride: req,
          fallbackAccess: false,
          refineAccess: async (hasAccess, _, req) => {
            if (!hasAccess) return false
            const user = req.user as User

            if (!user) return false
            if (!user.operator) return false

            return workflowCheck(user)
          },
        })
      }

  const accessCheckCreate: Access = async ({ req, data }) => {
    // First check normal access
    const hasNormalAccess = await accessCheckFields('create')({ req })
    if (!hasNormalAccess) return false

    const user = req.user as User
    if (user?.super_user) {
      return true
    }

    if (data?.bypass_day_restriction === true) return true

    // Then check time-based restrictions
    const settings = await req.payload.findGlobal({
      slug: settingsSlug as GlobalSlug,
      overrideAccess: true,
      req,
    })
    return await checkTimeBasedAccess(req, settingsSlug, (settings as any)?.workflow_slug)
  }

  const accessCheckUpdate: Access = async ({ req, data }) => {
    // First check normal access
    const hasNormalAccess = await accessCheckFields('update')({ req })
    if (!hasNormalAccess) return false

    const user = req.user as User
    if (user?.super_user) {
      return true
    }

    if (data?.bypass_day_restriction === true) return true

    // Then check time-based restrictions
    const settings = await req.payload.findGlobal({
      slug: settingsSlug as GlobalSlug,
      overrideAccess: true,
      req,
    })
    return await checkTimeBasedAccess(req, settingsSlug, (settings as any)?.workflow_slug)
  }

  const ServiceConfig: CollectionConfig = {
    slug: COLLECTION_NAME,
    labels: labels,
    disableDuplicate: true,
    admin: {
      useAsTitle: 'employee_name',
      group: 'Letters',
      components: {
        edit: {
          SaveButton: '@/common/components/submit-button',
        },
      },
      listSearchableFields: [
        'user',
        'employee',
        'employee_name',
        'employee_id',
        'employee_h2a_id',
        'employee_operator_name',
        'workflow_status',
        ...(listSearchableFields || []),
      ],
      hidden: ({ user }) => accessHiddenBySlug(user as unknown as User, COLLECTION_NAME, false),
      defaultColumns: [
        'employee',
        'employee_name',
        'employee_id',
        'employee_doj',
        'created_by',
        'workflow_status',
        ...(defaultColumns || []),
      ],
    },
    versions: true,
    dbName: dbName,
    fields: [
      {
        type: 'ui',
        name: 'admin_label',
        admin: {
          components: {
            Field: {
              path: '@/common/components/admin-label',
              clientProps: {
                label: labels?.singular || '',
              },
            },
          },
        },
      },
      {
        type: 'ui',
        name: 'cutoff_notice',
        admin: {
          components: {
            Field: {
              path: '@/common/components/cutoff-notice',
              clientProps: {
                settingsSlug: settingsSlug,
              },
            },
          },
        },
      },
      {
        type: 'ui',
        name: 'frontend_url_preview',
        admin: {
          components: {
            Field: {
              path: '@/common/components/frontend-url-preview',
              clientProps: {
                collectionSlug: COLLECTION_NAME,
              },
            },
          },
        },
      },
      {
        type: 'ui',
        name: 'workflow_field_data',
        admin: {
          components: {
            Field: {
              path: '@/common/components/workflow-field-data',
            },
          },
        },
      },
      {
        type: 'checkbox',
        name: 'override_department',
        label: 'Override Department Filter',
        defaultValue: false,
        admin: {
          description:
            'Check to filter users by the selected Department field. Uncheck to filter by your own department.',
          condition: (data) => !data?._workflow_status || data?._workflow_status === 'draft',
        },
        access: {
          read: async ({ req }) => {
            const hasAccess = await accessCheck(COLLECTION_NAME as CollectionSlug, 'super_user', {
              reqOverride: req,
            })
            return hasAccess as boolean
          },
          create: async ({ req }) => {
            const hasAccess = await accessCheck(COLLECTION_NAME as CollectionSlug, 'super_user', {
              reqOverride: req,
            })
            return hasAccess as boolean
          },
          update: async ({ req }) => {
            const isStillDraft =
              !req?.data?._workflow_status || req?.data?._workflow_status === 'draft'
            if (!isStillDraft) return false
            const hasAccess = await accessCheck(COLLECTION_NAME as CollectionSlug, 'super_user', {
              reqOverride: req,
            })
            return hasAccess as boolean
          },
        },
      },
      {
        type: 'relationship',
        name: 'employee_department',
        label: 'Department',
        relationTo: 'departments',
        admin: {
          description: 'eg. Information Technology, Human Resources',
          condition: (data) => data?.override_department,
        },
        hooks: {
          afterRead: [
            ({ data }) => {
              if (data?.user && typeof data.user === 'object') {
                return typeof data.user.department === 'object'
                  ? data.user.department.id
                  : data.user.department
              }
              return typeof data?.employee_department === 'object'
                ? data?.employee_department?.id
                : data?.employee_department
            },
          ],
        },
        access: {
          update: ({ data }) => !data?._workflow_status || data?._workflow_status === 'draft',
        },
        filterOptions: ({ user }) => {
          const operator = user?.operator
          if (operator) {
            return {
              operator: {
                equals: typeof operator === 'object' ? operator.id : operator,
              },
            }
          }
          return false
        },
      },
      {
        type: 'relationship',
        name: 'employee',
        label: 'Employee',
        relationTo: 'users',
        required: true,
        admin: {
          description: 'Select a user filtered by your current operator and department.',
          appearance: 'drawer',
        },
        filterOptions: ({ data, user }) => {
          // Skip check if user filter is not draft, meaning user is already selected, without this payloadcms validation gives an error.
          if (data?.workflow_status !== 'draft') return true

          const operatorId =
            typeof user?.operator === 'object' ? user?.operator?.id : user?.operator
          const currentUserDeptId =
            typeof user?.department === 'object' ? user?.department?.id : user?.department
          const selectedDeptId =
            typeof data?.employee_department === 'object'
              ? data?.employee_department?.id
              : data?.employee_department

          const departmentId = data?.override_department ? selectedDeptId : currentUserDeptId

          const constraints: any[] = []

          if (operatorId) {
            constraints.push({
              operator: {
                equals: operatorId,
              },
            })
          }

          if (departmentId) {
            constraints.push({
              department: {
                equals: departmentId,
              },
            })
          }

          if (constraints.length > 0) {
            return {
              and: constraints,
            }
          }

          return true
        },
        access: {
          update: ({ data }) => !data?._workflow_status || data?._workflow_status === 'draft',
        },
      },
      ...EmployeeFields('employee'),
      {
        type: 'ui',
        name: 'employee_info_display',
        admin: {
          components: {
            Field: {
              path: '@/common/components/employee-info',
              clientProps: {
                prefix: 'employee',
              },
            },
          },
        },
      },
      {
        type: 'ui',
        name: 'divider',
        admin: {
          components: {
            Field: {
              path: '@/common/components/divider',
            },
          },
        },
      },

      {
        type: 'checkbox',
        name: 'bypass_day_restriction',
        label: 'Bypass Day Restriction',
        defaultValue: false,
        admin: {
          position: 'sidebar',
          description: 'Check this to bypass the day restriction check for this record.',
          condition: (_, __, { user }) => (user as User)?.super_user || false,
        },
        access: { read: () => true },
      },
      ...fields,
      ...WorkflowFields(COLLECTION_NAME as CollectionSlug),
      CreatedByField,
      UpdatedByField,
    ],
    access: {
      admin: accessCheckResolver(COLLECTION_NAME as CollectionSlug, 'admin', {
        fallbackAccess: false,
      }) as AccessAdmin,
      read: accessCheckFields('read'),
      create: accessCheckCreate,
      update: accessCheckUpdate,
      delete: accessCheckFields('delete'),
    },
    hooks: {
      beforeChange: [
        setUserCreatedOrUpdatedByCollection,
        workflowInit(workflowInitArgs),
        workflowUpdate,
        workflowShouldAutoComplete,
      ],
      afterChange: [
        workflowNotification({
          getWorkflowSlug: async (req, data) => {
            // Priority 1: Specifically provided callback
            if (workflowNotificationArgs?.getWorkflowSlug) {
              return await workflowNotificationArgs.getWorkflowSlug(req, data)
            }

            // Priority 2: Standard settings global for letters
            try {
              const settings = await req.payload.findGlobal({
                slug: settingsSlug as any,
                req,
                overrideAccess: true,
              })
              return (settings as any).workflow_slug as string
            } catch (error) {
              return undefined
            }
          },
          ...workflowNotificationArgs,
        }),
      ],
    },
  }

  return ServiceConfig
}

export const mapReviewsToHistory = async (
  reviews: any[],
  req: PayloadRequest,
  serverURL: string,
) => {
  return await Promise.all(
    (reviews || [])
      .filter((r: any) => r.response !== 'pending')
      .map(async (r: any) => {
        const attachments = await Promise.all(
          (r.attachments || []).map(async (att: any) => {
            if (typeof att === 'object' && att !== null) return att
            try {
              return await req.payload.findByID({
                collection: 'internal-media',
                id: att,
                depth: 0,
                overrideAccess: true,
              })
            } catch (e) {
              return null
            }
          }),
        )

        return {
          label: r.label,
          reviewer: r.reviewer,
          response: r.response,
          comments: r.comments,
          date: r.reviewed_at,
          attachments: attachments
            .filter((a): a is any => a !== null)
            .map((a: any) => {
              const url = a.url || ''
              return {
                filename: a.filename,
                url: url.startsWith('http') ? url : `${serverURL}${url}`,
              }
            }),
          customFieldResponses: (r.custom_field_responses || []).map((cfr: any) => ({
            label: cfr.label,
            value: cfr.value,
          })),
        }
      }),
  )
}

export default serviceTemplateConfig
