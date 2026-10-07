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
import { operatorAccessRefine, restaurantAccessRefine } from '@/utilities/access-operator'
import { User } from '@/payload-types'
import getFields, { getOperatorField, getRestaurantField } from '../menu-pages/fields'
import { getSlugField } from '../menu-pages/fields/slug-field'
import { fnbVerifySlug } from '../menu/hooks/verify-slug'

const SLUG = 'menu-items'
const COLLECTION_NAME_MEDIA = 'menu-media'
const COLLECTION_NAME_ALLERGEN = 'menu-allergens'
const COLLECTION_NAME_TAGS = 'menu-tags'

const FnbMenuItems: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Items', singular: 'Item' },
  admin: {
    useAsTitle: 'title',
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    listSearchableFields: ['slug', 'title', 'description'],
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    getOperatorField(),
    getRestaurantField(),
    ...getFields([
      { type: 'image', override: { relationTo: COLLECTION_NAME_MEDIA } },
      { type: 'title', override: { required: true } },
    ]),
    ...getSlugField('slug', 'title', undefined, false),
    ...getFields([
      { type: 'description' },
      { type: 'price', override: { required: true } },
    ]),
    {
      type: 'checkbox',
      name: 'in_stock',
      label: 'In Stock',
      defaultValue: true,
      admin: {
        description: 'Whether this item is currently in stock and available to order.',
      },
    },
    ...getFields([
      { type: 'availability_period' },
      { type: 'allergen', override: { relationTo: COLLECTION_NAME_ALLERGEN } },
      { type: 'tags', override: { relationTo: COLLECTION_NAME_TAGS } },
    ]),
    {
      type: 'array',
      name: 'modifier_groups',
      label: 'Modifier Groups',
      admin: {
        description:
          'Tick-box customisation for this item (e.g. Hot/Iced, Milk, Sugar, Condiments). Mark a group Required to force a guest choice before it can be added to the cart.',
        components: {
          RowLabel: {
            path: 'src/common/components/array-row-label.tsx',
            clientProps: { path: 'name' },
          },
        },
      },
      fields: [
        {
          name: 'name',
          label: 'Group Name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'input_type',
          label: 'Input Type',
          type: 'select',
          required: true,
          defaultValue: 'checkbox',
          options: [
            { label: 'Checkbox (multiple choice)', value: 'checkbox' },
            { label: 'Radio (single choice)', value: 'radio' },
          ],
        },
        {
          name: 'required',
          label: 'Required',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          type: 'array',
          name: 'options',
          label: 'Options',
          required: true,
          minRows: 1,
          fields: [
            {
              name: 'label',
              label: 'Label',
              type: 'text',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      type: 'text',
      unique: true,
      required: true,
      name: 'operator_slug',
      label: 'Operator Slug',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Unique identifier with operator name.',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
      refineAccess: restaurantAccessRefine,
    }),
  },
  hooks: {
    beforeValidate: [
      fnbVerifySlug('slug', 'title'),
      setOperatorSlugCollection('slug', 'operator', 'restaurant'),
    ],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
}

export default FnbMenuItems
