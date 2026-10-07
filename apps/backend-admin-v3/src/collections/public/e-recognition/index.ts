import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { AccessAdmin, accessCheckResolver } from '@/utilities/access'
import { CollectionConfig } from 'payload'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const SLUG = 'e-recognition'

const eRecognition: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'E-Recognitions', singular: 'E-Recognition' },
  admin: {
    useAsTitle: 'title',
    group: 'Employees',
    listSearchableFields: ['slug', 'link'],
  },
  fields: [
    {
      type: 'text',
      unique: true,
      required: true,
      name: 'title',
      label: 'Title',
      admin: { description: 'Title of the e-recognition' },
    },
    {
      type: 'text',
      name: 'employee_id',
      label: 'Employee',
      required: false,
      admin: {
        description: 'Select an employee from H2A Oasys system',
        components: {
          Field: {
            path: './collections/public/e-recognition/components/employee-select',
          },
        },
      },
    },
    {
      type: 'upload',
      name: 'staff_media',
      label: 'Staff Photo',
      relationTo: 'media',
      admin: { description: 'Upload staff photo related to the e-recognition' },
    },
    {
      type: 'upload',
      name: 'bg_media',
      label: 'Background Photo',
      relationTo: 'media',
      admin: { description: 'Upload background photo related to the e-recognition' },
    },
    {
      type: 'richText',
      name: 'content',
      label: 'Content',
      admin: { description: 'Content of the e-recognition' },
    },
    {
      type: 'ui',
      name: 'content_preview',
      admin: {
        components: {
          Field: {
            path: './collections/public/e-recognition/components/preview-content',
          },
        },
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {}) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {}),
    create: accessCheckResolver(SLUG, 'create', {}),
    update: accessCheckResolver(SLUG, 'update', {}),
    delete: accessCheckResolver(SLUG, 'delete', {}),
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default eRecognition
