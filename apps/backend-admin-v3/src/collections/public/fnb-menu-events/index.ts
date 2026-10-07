import type { CollectionConfig, Field, PayloadRequest } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { getOwnersField } from '@/common/fields/owners'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { ownershipAccessRefine } from '@/utilities/access-operator'
import { canUserAccessOwnedDocument } from '@/utilities/ownership-condition'
import type { FnbMenuEvent, User } from '@/payload-types'
import getFields, { getOperatorField, getRestaurantField } from '../menu-pages/fields'
import { getThemeFields } from '../menu-pages/fields/theme'
import { getOrderHandlingFields } from '../menu-pages/fields/order-handling'
import { BlockSection } from '../menu-pages/blocks/section'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { assertEventSlugUniqueVsMenuPages } from './hooks/slug-unique'
import { compileEventLayout } from './hooks/compile-layout'
import { revalidateEventPage, revalidateEventPageDelete } from './hooks/revalidate'
import { syncEventStaffGrantsOnSlugChange } from './hooks/sync-staff-grants-on-slug-change'
import { fillTitleFromVenue } from './hooks/fill-title-from-venue'
import { syncEventDisplayTitle } from './hooks/sync-display-title'
import { deleteEventQRCode } from './hooks/delete-qr-code'
import { canAccessEventStaff, isEventOwnerOrCreator } from '@/utilities/fnb-staff-access'

const SLUG = 'fnb-menu-events'
const COLLECTION_NAME_MENU = 'menu'

const sectionHeading = (title: string, description?: string): Field => ({
  type: 'ui',
  name: `section_heading_${title.toLowerCase()}`,
  admin: {
    components: {
      Field: {
        path: '@/common/components/section-heading',
        clientProps: {
          title,
          description,
        },
      },
    },
  },
})

const venueField = getRestaurantField({
  requireEventEnabled: true,
  label: 'Venue',
  description:
    'Where this event runs. Only venues marked "Available for events" appear. Create one here if it does not exist yet.',
  fieldComponentPath: './collections/public/fnb-menu-events/components/venue-field',
  // A non-super event owner must be able to pick/create a Venue for their
  // own event - the collection's own create/update access (accessCheckResolver
  // + ownershipAccessRefine) already gates who may touch this document at
  // all, and filterOptions above already scopes choices to their operator +
  // event_enabled venues, so this field doesn't need its own super-user lock.
  restrictWriteToSuperUser: false,
})
venueField.admin = { ...venueField.admin, hidden: true }

const EVENT_THEME_COLOR_DEFAULTS: Record<string, string> = {
  primary: '#072c1b',
  primary_contrast: '#c8b46e',
  bg: '#eae7dc',
  bg_card: '#ffffff',
  text: '#252120',
  neutral: '#252120',
}

const withEventThemeDefaults = (fields: Field[]): Field[] =>
  fields.map((field) => {
    if ('name' in field && field.name && field.name in EVENT_THEME_COLOR_DEFAULTS) {
      return {
        ...field,
        defaultValue: EVENT_THEME_COLOR_DEFAULTS[field.name],
      } as Field
    }
    return field
  })

const FnbMenuEvents: CollectionConfig = {
  slug: SLUG,
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    group: 'FnB',
    // Structural cast: u.user matches ClientUser shape, cast to User
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    livePreview: {
      url: ({ data }) => {
        const slug = data?.info?.slug || ''
        return `${BACKEND_URL_WITH_BASE}/fnb/menu/${slug}?preview=true`
      },
    },
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    venueField,
    {
      type: 'group',
      name: 'info',
      label: 'Event Info',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          type: 'ui',
          name: 'frontend_url_preview',
          admin: {
            components: {
              Field: {
                path: '@/common/components/frontend-url-preview',
                clientProps: {
                  pathPrefix: '/fnb/menu',
                  useSlug: true,
                  slugPath: 'info.slug',
                  includeCollectionSlug: false,
                  label: 'Public Event URL',
                },
              },
            },
          },
        },
        ...getFields([{ type: 'title' }]),
        {
          type: 'checkbox',
          name: 'slug_override',
          label: 'Override URL slug?',
        },
        {
          type: 'text',
          name: 'slug',
          label: 'Slug',
          unique: true,
          required: true,
          admin: {
            components: {
              Field: {
                path: './collections/public/menu-pages/components/menu-page-slug',
                clientProps: {
                  description:
                    'The web address for this event. It fills in from the restaurant automatically — if this restaurant already has a menu page or another event, tick "Override URL slug?" above and enter a unique one.',
                },
              },
            },
            description: 'Used in the public event URL. Auto-filled from the restaurant.',
          },
        },
      ],
    },

    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            sectionHeading('Page'),
            {
              type: 'ui',
              name: 'venue_content_tab_proxy',
              admin: {
                components: {
                  Field: '@/collections/public/fnb-menu-events/components/venue-field-content-tab',
                },
              },
            },
            {
              type: 'group',
              name: 'header',
              label: 'Page Header',
              fields: [
                {
                  type: 'row',
                  fields: [
                    ...getFields([
                      {
                        type: 'label',
                        override: {
                          label: 'Header title',
                          admin: {
                            description:
                              'The big title guests see at the top of the page. Leave blank to use the restaurant name.',
                          },
                        },
                      },
                    ]),
                    {
                      type: 'upload',
                      name: 'logo',
                      relationTo: 'menu-media',
                      label: 'Logo',
                      localized: true,
                      admin: { description: 'Leave blank to use the restaurant logo.' },
                    },
                  ],
                },
                {
                  type: 'checkbox',
                  name: 'show_language',
                  label: 'Show language switch',
                  defaultValue: true,
                },
                {
                  type: 'checkbox',
                  name: 'show_notification',
                  label: 'Show notification bell',
                  defaultValue: true,
                  admin: {
                    hidden: true,
                  },
                },
              ],
            },
            {
              type: 'group',
              name: 'carousel',
              label: 'Carousel',
              fields: [
                {
                  type: 'array',
                  name: 'images',
                  label: 'Images',
                  fields: [
                    {
                      type: 'upload',
                      name: 'image',
                      relationTo: 'menu-media',
                      required: true,
                      localized: true,
                    },
                  ],
                  admin: {
                    description:
                      'Optional hero images shown as a carousel between the header and the search/filter bar. Leave empty and the carousel is skipped entirely.',
                  },
                },
              ],
            },
            {
              type: 'group',
              name: 'items',
              label: 'Items Section',
              fields: [
                {
                  type: 'text',
                  name: 'title',
                  label: 'Heading',
                  defaultValue: 'Our Selection',
                  localized: true,
                },
                {
                  type: 'text',
                  name: 'description',
                  label: 'Sub-heading',
                  defaultValue: 'Fresh and delicious',
                  localized: true,
                },
              ],
            },
            sectionHeading('Settings'),
            {
              type: 'collapsible',
              label: 'Theme',
              admin: {
                initCollapsed: true,
              },
              fields: withEventThemeDefaults(getThemeFields()),
            },
            ...getOrderHandlingFields({ includeCashier: false, orderingDefault: true }),
            {
              type: 'group',
              name: 'filter',
              label: 'Search & Filters',
              fields: [
                {
                  type: 'checkbox',
                  name: 'enabled',
                  label: 'Show the search & filter bar',
                  defaultValue: true,
                },
                {
                  type: 'checkbox',
                  name: 'show_search',
                  label: 'Show Search',
                  defaultValue: true,
                  admin: {
                    condition: (_, siblingData) => !!siblingData?.enabled,
                  },
                },
                {
                  type: 'checkbox',
                  name: 'show_allergen_filters',
                  label: 'Show Allergen Filters',
                  defaultValue: false,
                  admin: {
                    condition: (_, siblingData) => !!siblingData?.enabled,
                  },
                },
                {
                  type: 'checkbox',
                  name: 'show_availability_filters',
                  label: 'Show Availability Filter (All Day / Lunch / Dinner)',
                  defaultValue: false,
                  admin: {
                    condition: (_, siblingData) => !!siblingData?.enabled,
                    description:
                      'Adds All Day / Lunch / Dinner to the filter panel guests open with the funnel icon, alongside Allergen Filters if that is also on. The funnel icon itself shows whenever either this or Allergen Filters is checked.',
                  },
                },
              ],
            },
            {
              // Hidden from the admin UI: the Menus tab's builder (event-menu-builder)
              // already manages this same `c.menus` array end to end ("Menus on this
              // event" / "Add existing" / "Build a menu"), so showing the raw
              // relationship picker here duplicates it. It was also rendering
              // incorrectly for a user without `menu` collection read access - the
              // relationship field resolves each selected menu's title via `menu`'s
              // own access, so it can't display a value it isn't allowed to read even
              // though the underlying `c.menus` data is fine. `hidden` (not removing
              // the field) keeps the data and the builder's writes to it working.
              type: 'relationship',
              name: 'menus',
              label: 'Menus',
              relationTo: COLLECTION_NAME_MENU,
              filterOptions: ({ data }) => {
                if (!data?.restaurant) return false
                return { restaurant: { equals: data.restaurant } }
              },
              hasMany: true,
              admin: {
                hidden: true,
                description:
                  "Select the menu(s) to show items from for this event. If none is selected, all of the restaurant's items are shown.",
              },
            },
            {
              type: 'blocks',
              name: 'blk',
              label: 'Layout',
              labels: { singular: 'Layout', plural: 'Layout' },
              blocks: [BlockSection],
              minRows: 1,
              admin: {
                condition: (data) => !!data?.adv?.show_layout,
                description:
                  'Advanced — the raw page layout. Normally generated from the fields above. Only edit if you know the block system.',
              },
            },
          ],
        },
        {
          name: 'menu_builder',
          label: 'Menus',
          fields: [
            {
              type: 'ui',
              name: 'builder',
              admin: {
                components: {
                  Field: './collections/public/fnb-menu-events/components/event-menu-builder',
                },
              },
            },
          ],
          admin: {
            // Hide the tab for users who can't edit this event's menu. The server
            // actions enforce the real gate (incl. operator match); this is just so a
            // non-manager never sees a dead panel.
            condition: (data, _siblingData, { user }) =>
              canUserAccessOwnedDocument(data, user, SLUG),
          },
        },
        {
          // No `name` here (unlike the other data-grouped tabs above): `qr_png` /
          // `qr_svg` must resolve as top-level `event.qr_png` / `event.qr_svg`
          // (matching the Forms/Site-Pages precedent and the migration's top-level
          // FK columns on `fnb_menu_events`), not nested under a `tables_builder`
          // group. A named tab groups its fields' data; an unnamed one (like
          // 'Access' below) is purely presentational. The `tables` ui field below
          // carries no data either way, so dropping the name doesn't affect it.
          label: "Table's and QR codes",
          fields: [
            // Not wrapped in a `collapsible` (as originally planned): this admin's
            // `collapsible` field currently fails to render at all — confirmed via
            // the pre-existing 'Theme' collapsible on the Content tab above, which
            // is equally invisible, so it's a standing issue unrelated to this
            // task. Flattening these three fields keeps them actually visible; the
            // GenerateQRButton component renders its own "QR Code Management"
            // heading, so the section still reads as a grouped unit.
            {
              name: 'qr_png',
              type: 'upload',
              relationTo: 'menu-media',
              label: 'QR Code (PNG)',
              admin: { readOnly: true },
            },
            {
              name: 'qr_svg',
              type: 'upload',
              relationTo: 'menu-media',
              label: 'QR Code (SVG)',
              admin: { readOnly: true },
            },
            {
              type: 'ui',
              name: 'generate_qr_button',
              admin: {
                components: {
                  Field: {
                    path: '@/collections/public/fnb-menu-events/components/generate-qr-button',
                  },
                },
              },
            },
            {
              type: 'ui',
              name: 'tables',
              admin: {
                components: {
                  Field: './collections/public/fnb-menu-events/components/event-tables-builder',
                },
              },
            },
          ],
          admin: {
            // Hide the tab for users who can't edit this event's menu/tables. The server
            // actions enforce the real gate (incl. operator match); this is just so a
            // non-manager never sees a dead panel.
            condition: (data, _siblingData, { user }) =>
              canUserAccessOwnedDocument(data, user, SLUG),
          },
        },
        {
          label: 'Access',
          description:
            'Who staffs this event. Each person needs a role (Waiter / Back of House / Cashier). Adding someone here grants them the matching event panel automatically; removing them revokes it.',
          fields: [
            {
              type: 'join',
              name: 'staff',
              label: 'Event Staff',
              collection: 'fnb-event-staff',
              on: 'event',
              admin: {
                defaultColumns: ['user', 'role'],
                allowCreate: true,
                description: 'Add or remove crew for this event.',
              },
              // `join` field access only supports `read` (Payload types). The
              // add / edit / delete of `fnb-event-staff` rows through the drawer
              // is gated per-operation by the `fnb-event-staff` collection's own
              // access (`accessCheckResolver` + `operatorAccessRefine`, OR'd with
              // an ownership fallback via `canManageEventStaffForEvent` — see
              // that collection's `index.ts`): a user needs the matching
              // `fnb-event-staff` create/update/delete grant AND to be in the
              // event's operator, OR to be this event's creator/owner.
              // super_user bypasses all of it. This field's own `read` mirrors
              // the same either/or so an owner without the operator-wide grant
              // still sees the panel at all — `data` here is the already-loaded
              // parent event doc (this field's own read access already passed
              // to get here), so no extra query needed.
              access: {
                read: ({ req, data }: { req: PayloadRequest; data?: Partial<FnbMenuEvent> }) =>
                  canAccessEventStaff(req.user as User | null, 'read') ||
                  isEventOwnerOrCreator(req.user as User | null, data),
              },
            },
          ],
        },
        {
          // No `name` here on the tab itself: a named tab would scope both child
          // groups under `adv.*`, breaking the database mapping and types for `seo`
          // (`seo_title` / `seo_description` / `seo_image_id`). Keeping the tab
          // unnamed makes it purely presentational so that `seo` lives at `seo.*`
          // and the layout/styling fields stay grouped under `adv.*`.
          label: 'Advance',
          fields: [
            {
              type: 'group',
              name: 'seo',
              label: 'SEO',
              admin: {
                description:
                  'Used for the browser tab title, meta description, and social-share preview when set.',
              },
              fields: [
                ...getFields([
                  { type: 'title' },
                  { type: 'description' },
                  { type: 'image', override: { relationTo: 'menu-media' } },
                ]),
              ],
            },
            {
              type: 'group',
              name: 'adv',
              label: false,
              admin: {
                hideGutter: true,
              },
              fields: [
                {
                  type: 'checkbox',
                  name: 'show_layout',
                  label: 'Show layout builder',
                  defaultValue: false,
                  admin: {
                    description:
                      'Reveal the raw block layout on the Content tab and stop auto-generating it from the Header / Filter / Items fields.',
                  },
                },
                ...getFields([{ type: 'className' }, { type: 'css' }, { type: 'js' }]),
              ],
            },
          ],
        },
      ],
    },
    getOperatorField(),
    {
      type: 'text',
      name: 'operator_slug',
      label: 'Operator Slug',
      unique: true,
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Unique identifier with operator name.',
      },
    },
    {
      // Mirrors `info.title` (beforeChange, see sync-display-title.ts) so it can
      // be used as `admin.useAsTitle` — Payload rejects a nested/dotted path
      // there, so `info.title` itself can't be referenced directly.
      // KNOWN ISSUE (not caused by `hidden` — tried readOnly/sidebar/plain
      // variants, all identical): the Events LIST view's Title column renders
      // "<No Title>" in this dev environment even though the field's value is
      // correct (confirmed via direct API reads) and the document edit view's
      // own header/breadcrumb render it correctly. Reproduces alongside a
      // React hydration-mismatch warning tied to this browser's extensions
      // (dark-mode/Grammarly/ColorZilla DOM rewriting) forcing a full client
      // remount — same class of issue seen elsewhere this session. Revisit
      // list-column rendering in a clean browser profile before assuming a
      // code fix is needed here.
      type: 'text',
      name: 'title',
      label: 'Title',
      admin: {
        hidden: true,
      },
    },
    CreatedByField,
    UpdatedByField,
    getOwnersField(SLUG),
  ],
  access: {
    // Structural cast: admin accessCheckResolver returns generic Access, cast as AccessAdmin
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: ownershipAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: ownershipAccessRefine,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
      refineAccess: ownershipAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: ownershipAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
      refineAccess: ownershipAccessRefine,
    }),
  },
  hooks: {
    beforeValidate: [
      setOperatorSlugCollection('info.slug', 'operator', 'restaurant', { dedupePrefixes: true }),
      assertEventSlugUniqueVsMenuPages,
    ],
    beforeChange: [setUserCreatedOrUpdatedByCollection, fillTitleFromVenue, syncEventDisplayTitle, compileEventLayout],
    beforeDelete: [deleteEventQRCode],
    afterChange: [auditLogAfterChange(SLUG), revalidateEventPage, syncEventStaffGrantsOnSlugChange],
    afterDelete: [auditLogAfterDelete(SLUG), revalidateEventPageDelete],
  },
}

export default FnbMenuEvents
