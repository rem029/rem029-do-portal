import CreatedByField from '@/common/fields/created-by'
import { Slug } from '@/common/fields/slug'
import UpdatedByField from '@/common/fields/updated-by'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { CollectionConfig } from 'payload'

const COLLECTION_NAME = 'qa-field-types'

const QaFieldTypes: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'QA Field Types', singular: 'QA Field Type' },
  admin: {
    useAsTitle: 'title',
    group: 'QA',
    listSearchableFields: ['slug', 'title'],
    hidden: (u) =>
      process.env.NODE_ENV === 'production' ||
      (accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean),
  },
  fields: [
    // 1. Text (Primary title field)
    {
      name: 'title',
      type: 'text',
      label: 'Text Field (Title)',
      required: true,
      admin: {
        description: 'Standard single-line text input',
      },
    },

    // 2. Textarea
    {
      name: 'textarea_field',
      type: 'textarea',
      label: 'Textarea Field',
      admin: {
        description: 'Multiline text area input',
      },
    },

    // 3. Email
    {
      name: 'email_field',
      type: 'email',
      label: 'Email Field',
      admin: {
        description: 'Validated email input',
      },
    },

    // 4. Number
    {
      name: 'number_field',
      type: 'number',
      label: 'Number Field',
      admin: {
        description: 'Numeric input field',
      },
    },

    // 5. Date
    {
      name: 'date_field',
      type: 'date',
      label: 'Date Field',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Date and time picker',
      },
    },

    // Point field intentionally omitted: this environment's Postgres server
    // doesn't have the PostGIS extension installed, so `type: 'point'` can't
    // be migrated here (CREATE EXTENSION postgis fails). Re-add once PostGIS
    // is available on the DB server.

    // 7. Checkbox
    {
      name: 'checkbox_field',
      type: 'checkbox',
      label: 'Checkbox Field',
      defaultValue: true,
      admin: {
        description: 'Boolean checkbox toggle',
      },
    },

    // 8. Select (Single)
    {
      name: 'select_single',
      type: 'select',
      label: 'Select (Single)',
      options: [
        { label: 'Option Alpha', value: 'alpha' },
        { label: 'Option Beta', value: 'beta' },
        { label: 'Option Gamma', value: 'gamma' },
      ],
      defaultValue: 'alpha',
      admin: {
        description: 'Single-select dropdown',
      },
    },

    // 9. Select (hasMany: true)
    {
      name: 'select_multi',
      type: 'select',
      hasMany: true,
      label: 'Select (Multi / hasMany)',
      options: [
        { label: 'Tag Red', value: 'red' },
        { label: 'Tag Green', value: 'green' },
        { label: 'Tag Blue', value: 'blue' },
      ],
      defaultValue: ['red', 'blue'],
      admin: {
        description: 'Multi-select pill dropdown',
      },
    },

    // 10. Radio Group
    {
      name: 'radio_field',
      type: 'radio',
      label: 'Radio Group Field',
      options: [
        { label: 'Choice One', value: 'choice_1' },
        { label: 'Choice Two', value: 'choice_2' },
        { label: 'Choice Three', value: 'choice_3' },
      ],
      defaultValue: 'choice_1',
      admin: {
        layout: 'horizontal',
        description: 'Horizontal radio options list',
      },
    },

    // 11. Relationship (Single)
    {
      name: 'relationship_single',
      type: 'relationship',
      relationTo: 'departments',
      label: 'Relationship (Single)',
      admin: {
        description: 'Single relationship to departments',
      },
    },

    // 12. Relationship (hasMany: true)
    {
      name: 'relationship_multi',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      label: 'Relationship (Multi / hasMany)',
      admin: {
        description: 'Multiple relationships to departments',
      },
    },

    // Self-referential relationship target for the Join field
    {
      name: 'parent',
      type: 'relationship',
      relationTo: COLLECTION_NAME,
      label: 'Parent (Self-Relationship for Join)',
      admin: {
        description: 'Self-referential link used by the children join field',
      },
    },

    // 13. Join (read-only reverse relationship)
    {
      name: 'children',
      type: 'join',
      collection: COLLECTION_NAME,
      on: 'parent',
      label: 'Children (Join Field)',
      admin: {
        defaultColumns: ['title', 'slug', 'radio_field'],
      },
    },

    // 14. Rich Text
    {
      name: 'rich_text_field',
      type: 'richText',
      label: 'Rich Text Field',
      admin: {
        description: 'Lexical rich text editor',
      },
    },

    // 15. Upload
    {
      name: 'upload_field',
      type: 'upload',
      relationTo: 'media',
      label: 'Upload Field',
      admin: {
        description: 'Media upload relationship',
      },
    },

    // 16. Code
    {
      name: 'code_field',
      type: 'code',
      label: 'Code Field',
      admin: {
        language: 'json',
        description: 'Monaco / code editor input',
      },
    },

    // 17. JSON
    {
      name: 'json_field',
      type: 'json',
      label: 'JSON Field',
      admin: {
        description: 'Structured JSON data editor',
      },
    },

    // 18. Array
    {
      name: 'array_field',
      type: 'array',
      label: 'Array Field',
      admin: {
        description: 'Repeater array of rows',
      },
      fields: [
        {
          name: 'item_name',
          type: 'text',
          label: 'Item Name',
        },
        {
          name: 'item_value',
          type: 'number',
          label: 'Item Value',
        },
      ],
    },

    // 19. Blocks
    {
      name: 'blocks_field',
      type: 'blocks',
      label: 'Blocks Field',
      admin: {
        description: 'Polymorphic content blocks',
      },
      blocks: [
        {
          slug: 'content_block',
          labels: {
            singular: 'Content Block',
            plural: 'Content Blocks',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              label: 'Heading',
            },
            {
              name: 'body',
              type: 'textarea',
              label: 'Body',
            },
          ],
        },
        {
          slug: 'alert_block',
          labels: {
            singular: 'Alert Block',
            plural: 'Alert Blocks',
          },
          fields: [
            {
              name: 'level',
              type: 'select',
              label: 'Alert Level',
              options: [
                { label: 'Info', value: 'info' },
                { label: 'Warning', value: 'warning' },
                { label: 'Error', value: 'error' },
              ],
              defaultValue: 'info',
            },
            {
              name: 'message',
              type: 'text',
              label: 'Message',
            },
          ],
        },
      ],
    },

    // 20. Group
    {
      name: 'group_field',
      type: 'group',
      label: 'Group Field',
      admin: {
        description: 'Nested group of fields',
      },
      fields: [
        {
          name: 'group_text_1',
          type: 'text',
          label: 'Group Subfield 1',
        },
        {
          name: 'group_text_2',
          type: 'text',
          label: 'Group Subfield 2',
        },
      ],
    },

    // 21. Row
    {
      type: 'row',
      fields: [
        {
          name: 'row_col_1',
          type: 'text',
          label: 'Row Column 1',
          admin: { width: '50%' },
        },
        {
          name: 'row_col_2',
          type: 'text',
          label: 'Row Column 2',
          admin: { width: '50%' },
        },
      ],
    },

    // 22. Collapsible
    {
      type: 'collapsible',
      label: 'Collapsible Section',
      admin: {
        initCollapsed: false,
        description: 'Expandable/collapsible field container',
      },
      fields: [
        {
          name: 'collapsible_field_1',
          type: 'text',
          label: 'Inside Collapsible Text',
        },
        {
          name: 'collapsible_field_2',
          type: 'textarea',
          label: 'Inside Collapsible Textarea',
        },
      ],
    },

    // 23. Tabs
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tab Alpha',
          description: 'First tab pane',
          fields: [
            {
              name: 'tab_alpha_text',
              type: 'text',
              label: 'Tab Alpha Text',
            },
          ],
        },
        {
          label: 'Tab Beta',
          description: 'Second tab pane',
          fields: [
            {
              name: 'tab_beta_notes',
              type: 'textarea',
              label: 'Tab Beta Notes',
            },
          ],
        },
      ],
    },

    // 24. UI Field
    {
      name: 'qa_info_ui',
      type: 'ui',
      label: 'UI Field',
      admin: {
        components: {
          Field: '@/collections/qa-field-types/components/qa-info-banner',
        },
      },
    },

    // Required multi-tenant & audit fields
    {
      type: 'relationship',
      required: true,
      name: 'operator',
      label: 'Operator',
      relationTo: 'operators',
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
    create: accessCheckResolver(COLLECTION_NAME, 'create', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    read: accessCheckResolver(COLLECTION_NAME, 'read', {
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
  hooks: {
    beforeValidate: [setOperatorSlugCollection('slug')],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
}

export default QaFieldTypes
