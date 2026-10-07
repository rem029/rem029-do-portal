import type { CollectionConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { Slug } from '@/common/fields/slug'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import {
  AccessAdmin,
  accessCheckResolver,
  accessHiddenBySlug,
} from '@/utilities/access'
import { operatorAccessRefine } from '@/utilities/access-operator'
import { User } from '@/payload-types'
import getFields, { getOperatorField } from '../menu-pages/fields'

const SLUG = 'menu-tags'

const FnbMenuTags: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Tags', singular: 'Tag' },
  admin: {
    useAsTitle: 'title',
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    getOperatorField(),
    {
      type: 'text',
      name: 'title',
      label: 'Title',
      required: true,
      localized: true,
    },
    ...Slug(true, { watchPath: 'title' }),
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
      localized: true,
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
      refineAccess: operatorAccessRefine,
    }),
  },
  hooks: {
    beforeValidate: [setOperatorSlugCollection('slug')],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default FnbMenuTags
