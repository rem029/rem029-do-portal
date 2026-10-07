import type { CollectionConfig } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { Slug } from '@/common/fields/slug'
import { setSitePageOperatorSlug } from './hooks/operator-slug'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { revalidateSitePage, revalidateSitePageDelete } from './hooks/revalidate'
import { deleteQRCode } from './hooks/deleteQRCode'
import { User } from '@/payload-types'
import getFields, { getOperatorField } from './fields'
import { BlockPageSection } from './blocks/section'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

const SLUG = 'site-pages'

const SitePages: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Pages', singular: 'Page' },
  admin: {
    useAsTitle: 'operator_slug',
    group: 'Site',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    livePreview: {
      url: ({ data }) => {
        const slug = data?.info?.slug || ''
        return `${BACKEND_URL_WITH_BASE}/page/${slug}?preview=true`
      },
    },
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    getOperatorField(),
    {
      type: 'tabs',
      tabs: [
        {
          name: 'info',
          label: 'Information',
          fields: [
            {
              type: 'ui',
              name: 'frontend_url_preview',
              admin: {
                components: {
                  Field: {
                    path: '@/common/components/frontend-url-preview',
                    clientProps: {
                      pathPrefix: '/page',
                      useSlug: true,
                      slugPath: 'info.slug',
                      includeCollectionSlug: false,
                      label: 'Public Site Page URL',
                    },
                  },
                },
              },
            },
            ...getFields([{ type: 'title' }]),
            {
              type: 'checkbox',
              name: 'slug_override',
              label: 'Override Slug?',
            },
            {
              type: 'text',
              name: 'slug',
              label: 'Slug',
              unique: true,
              required: true,
              admin: {
                components: {
                  Field: './collections/public/site-pages/components/site-page-slug',
                },
                description: 'The slug is used in the URL for this site page.',
              },
              hooks: {
                beforeDuplicate: [({ value }) => value],
              },
            },
          ],
        },
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              type: 'collapsible',
              label: 'Theme',
              fields: [
                {
                  name: 'use_custom_theme',
                  type: 'checkbox',
                  label: 'Use Custom Theme',
                  defaultValue: false,
                  admin: {
                    description:
                      'Enable to define a custom DaisyUI theme with full control over all variables.',
                  },
                },
                {
                  name: 'theme',
                  type: 'select',
                  label: 'Theme',
                  defaultValue: 'dohaquest-new',
                  options: [
                    { label: 'Printemps', value: 'printemps' },
                    { label: 'Doha Oasis', value: 'dohaoasis' },
                    { label: 'Doha Oasis New', value: 'dohaoasis-new' },
                    { label: 'Doha Quest', value: 'dohaquest' },
                    { label: 'Doha Quest New', value: 'dohaquest-new' },
                    { label: 'Banyan Tree Lululemon', value: 'banyan-tree-lululemon' },
                  ],
                  admin: {
                    condition: (data) => !data?.c?.use_custom_theme,
                    description: 'Select a predefined theme for your page.',
                  },
                },
                {
                  name: 'custom_theme_name',
                  type: 'text',
                  label: 'Custom Theme Name',
                  required: true,
                  admin: {
                    condition: (data) => data?.c?.use_custom_theme === true,
                    description:
                      'The name of your custom theme. Must match the name in your CSS definition below.',
                  },
                },
                {
                  name: 'custom_theme_css',
                  type: 'code',
                  label: 'Custom Theme CSS',
                  admin: {
                    condition: (data) => data?.c?.use_custom_theme === true,
                    description:
                      'Define your custom theme using DaisyUI CSS variables. Copy the format from styles.css and customize the colors.\n\nExample:\n\n--color-base-100: #ffffff;\n--color-base-200: #eae7dc;\n--color-primary: #072c1b;\n--color-primary-content: #eae7dc;\n--color-secondary: #c8b46e;\n--color-accent: #252120;\n--color-neutral: #252120;\n/* ... see styles.css for full list */',
                    language: 'css',
                  },
                },
                ...getFields([
                  {
                    type: 'image',
                    override: {
                      label: 'Font Primary',
                      name: 'font_primary',
                    },
                  },
                  {
                    type: 'image',
                    override: {
                      label: 'Font Secondary',
                      name: 'font_secondary',
                    },
                  },
                ]),
              ],
            },
            {
              type: 'blocks',
              name: 'blk',
              label: 'Layouts',
              labels: { plural: 'Layouts', singular: 'Layout' },
              blocks: [BlockPageSection],
              minRows: 1,
              required: true,
            },
          ],
        },
        {
          name: 'adv',
          label: 'Advanced',
          fields: [...getFields([{ type: 'className' }, { type: 'css' }, { type: 'js' }])],
        },
        {
          name: 'seo',
          label: 'SEO',
          fields: [...getFields([{ type: 'title' }, { type: 'description' }, { type: 'image' }])],
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
        description: 'Unique identifier with operator name (if applicable).',
      },
    },
    {
      name: 'qr_png',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'qr_svg',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'ui',
      name: 'generate_qr_button',
      admin: {
        components: {
          Field: {
            path: '@/collections/public/site-pages/components/GenerateQRButton',
          },
        },
        position: 'sidebar',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: true,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
    }),
  },
  hooks: {
    beforeValidate: [setSitePageOperatorSlug('info.slug', 'operator')],
    beforeChange: [setUserCreatedOrUpdatedByCollection],
    afterChange: [auditLogAfterChange(SLUG), revalidateSitePage],
    beforeDelete: [deleteQRCode],
    afterDelete: [auditLogAfterDelete(SLUG), revalidateSitePageDelete],
  },
}

export default SitePages
