import CreatedByField from '@/common/fields/created-by'
import { Slug } from '@/common/fields/slug'
import UpdatedByField from '@/common/fields/updated-by'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { CollectionConfig } from 'payload'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const COLLECTION_NAME = 'departments'

const Departments: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Departments', singular: 'Department' },
  admin: {
    useAsTitle: 'title',
    group: 'Admin',
    listSearchableFields: [
      'slug',
      'title',
      'manager_name',
      'manager_email',
      'sub_departments.name',
      'sub_departments.manager_name',
      'sub_departments.manager_email',
    ],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  fields: [
    {
      type: 'text',
      required: true,
      name: 'title',
      label: 'Title',
      admin: {
        description: 'eg. Human Resources, Marketing and Information Technology',
      },
    },
    {
      type: 'relationship',
      required: true,
      name: 'operator',
      label: 'Operator',
      relationTo: 'operators',
    },
    {
      type: 'row',
      fields: [
        {
          type: 'text',
          name: 'manager_name',
          label: 'Manager Name',
          admin: { description: 'eg. John Doe, Jane Doe' },
        },
        {
          type: 'email',
          name: 'manager_email',
          label: 'Manager Email',
          admin: { description: 'eg. john.doe@example.com, jane.doe@example.com' },
        },
      ],
    },
    {
      type: 'array',
      name: 'sub_departments',
      labels: { singular: 'Sub Department', plural: 'Sub Departments' },
      label: 'Sub Departments',
      admin: {
        components: { RowLabel: { path: './collections/departments/components/array-row-label' } },
        description: 'List of sub-departments within this department',
      },
      fields: [
        {
          type: 'text',
          name: 'name',
          required: true,
          label: 'Name',
          admin: { description: 'eg. Recruitment, Employee Relations' },
        },
        {
          type: 'row',
          fields: [
            {
              type: 'text',
              name: 'manager_name',
              label: 'Sub Department Manager Name',
              admin: { description: 'eg. John Smith, Alice Johnson' },
            },
            {
              type: 'email',
              name: 'manager_email',
              label: 'Sub Department Manager Email',
              admin: { description: 'eg. john.smith@example.com, alice.johnson@example.com' },
            },
          ],
        },
      ],
    },
    CreatedByField,
    UpdatedByField,
    ...Slug(true, { watchPath: 'title' }),
  ],
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  hooks: {
    beforeValidate: [setOperatorSlugCollection('slug')],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default Departments
