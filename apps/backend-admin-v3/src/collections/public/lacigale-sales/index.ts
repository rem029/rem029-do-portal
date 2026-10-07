import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { User } from '@/payload-types'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { CollectionConfig } from 'payload'
import { calculateRoomsRevenue } from './hooks/calculate-rooms-revenue'
import { storeReportTotals } from './hooks/store-report-totals'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'

const COLLECTION_NAME = 'lacigale-sales'

// Field lists for the UI components - Revenue Only
const FB_SALES_FIELDS = [
  'fb_sales.sky_view',
  'fb_sales.shisha_garden',
  'fb_sales.sushi_bar',
  'fb_sales.traiteur',
  'fb_sales.odc_special_contracts',
  'fb_sales.di_capri',
  'fb_sales.le_cigalon',
  'fb_sales.lobby_lounge',
  'fb_sales.mini_bar',
  'fb_sales.orangery',
  'fb_sales.room_service',
  'fb_sales.banquets',
  'fb_sales.ramadan_tent',
]

// Field lists for Guests calculation
const FB_GUEST_FIELDS = [
  'fb_sales.sky_view_guests',
  'fb_sales.shisha_garden_guests',
  'fb_sales.sushi_bar_guests',
  'fb_sales.traiteur_guests',
  'fb_sales.odc_special_contracts_guests',
  'fb_sales.di_capri_guests',
  'fb_sales.le_cigalon_guests',
  'fb_sales.lobby_lounge_guests',
  'fb_sales.mini_bar_guests',
  'fb_sales.orangery_guests',
  'fb_sales.room_service_guests',
  'fb_sales.banquets_guests',
  'fb_sales.ramadan_tent_guests',
]

const MISC_FIELDS = [
  'misc.telephone',
  'misc.business_center',
  'misc.laundry',
  'misc.spa_and_recreation',
  'misc.hotel_taxi',
  'misc.cigar_shop',
  'misc.space_rental',
  'misc.flower_shop',
  'misc.other_misc',
]

const LacigaleSales: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: { plural: 'Sales', singular: 'Sales Report' },
  admin: {
    useAsTitle: 'date',
    group: 'La Cigale',
    listSearchableFields: ['date'],
    defaultColumns: ['date', 'grand_total_column'],
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, COLLECTION_NAME) as boolean,
  },
  access: {
    admin: accessCheckResolver(COLLECTION_NAME, 'admin', { fallbackAccess: false }) as AccessAdmin,
    read: accessCheckResolver(COLLECTION_NAME, 'read', { fallbackAccess: false }),
    create: accessCheckResolver(COLLECTION_NAME, 'create', { fallbackAccess: false }),
    update: accessCheckResolver(COLLECTION_NAME, 'update', { fallbackAccess: false }),
    delete: accessCheckResolver(COLLECTION_NAME, 'delete', { fallbackAccess: false }),
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByCollection, calculateRoomsRevenue, storeReportTotals],
    afterChange: [auditLogAfterChange(COLLECTION_NAME)],
    afterDelete: [auditLogAfterDelete(COLLECTION_NAME)],
  },
  fields: [
    {
      type: 'date',
      name: 'date',
      label: 'Report Date',
      required: true,
      unique: true,
      admin: { date: { displayFormat: 'yyyy MMM dd' }, width: '100%' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'rooms',
          label: 'Rooms',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'no_rooms_occupied',
                  type: 'number',
                  label: 'No. of Rooms Occupied',
                  admin: { width: '50%' },
                },
                {
                  name: 'complimentary_house_use',
                  type: 'number',
                  label: 'Complimentary / House Use',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'occupancy_percentage',
                  type: 'number',
                  label: '% Of Occupancy',
                  admin: { width: '50%' },
                },
                {
                  name: 'average_room_rate',
                  type: 'number',
                  label: 'Average Room Rate',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'rooms_revenue_display',
              type: 'ui',
              admin: {
                components: {
                  Field: {
                    path: '@/collections/public/lacigale-sales/components/total-ui',
                    clientProps: {
                      fieldPaths: ['rooms.no_rooms_occupied', 'rooms.average_room_rate'],
                      label: 'Rooms Revenue Today (Calculated)',
                      isMultiplication: true,
                    },
                  },
                },
              },
            },
            { name: 'rooms_revenue', type: 'number', admin: { hidden: true } },
          ],
        },
        {
          name: 'fb_sales',
          label: 'F&B Sales',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'sky_view', type: 'number', label: 'Sky View', admin: { width: '22%' } },
                {
                  name: 'sky_view_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                {
                  name: 'shisha_garden',
                  type: 'number',
                  label: 'Shisha Garden',
                  admin: { width: '22%' },
                },
                {
                  name: 'shisha_garden_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                { name: 'sushi_bar', type: 'number', label: 'Sushi Bar', admin: { width: '22%' } },
                {
                  name: 'sushi_bar_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'traiteur', type: 'number', label: 'Traiteur', admin: { width: '22%' } },
                {
                  name: 'traiteur_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                {
                  name: 'odc_special_contracts',
                  type: 'number',
                  label: 'ODC - Spec. Contracts',
                  admin: { width: '22%' },
                },
                {
                  name: 'odc_special_contracts_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                { name: 'di_capri', type: 'number', label: 'Di Capri', admin: { width: '22%' } },
                {
                  name: 'di_capri_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'le_cigalon',
                  type: 'number',
                  label: 'Le Cigalon',
                  admin: { width: '22%' },
                },
                {
                  name: 'le_cigalon_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                {
                  name: 'lobby_lounge',
                  type: 'number',
                  label: 'Lobby Lounge',
                  admin: { width: '22%' },
                },
                {
                  name: 'lobby_lounge_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                { name: 'mini_bar', type: 'number', label: 'Mini Bar', admin: { width: '22%' } },
                {
                  name: 'mini_bar_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'orangery', type: 'number', label: 'Orangery', admin: { width: '22%' } },
                {
                  name: 'orangery_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                {
                  name: 'room_service',
                  type: 'number',
                  label: 'Room Service',
                  admin: { width: '22%' },
                },
                {
                  name: 'room_service_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
                { name: 'banquets', type: 'number', label: 'Banquets', admin: { width: '22%' } },
                {
                  name: 'banquets_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ramadan_tent',
                  type: 'number',
                  label: 'Ramadan Tent',
                  admin: { width: '22%' },
                },
                {
                  name: 'ramadan_tent_guests',
                  type: 'number',
                  label: 'Guests',
                  admin: { width: '11.33%' },
                },
              ],
            },
            {
              type: 'ui',
              name: 'fb_total_display',
              admin: {
                components: {
                  Field: {
                    path: '@/collections/public/lacigale-sales/components/total-ui',
                    clientProps: {
                      fieldPaths: FB_SALES_FIELDS,
                      label: 'Total F&B Revenue Today',
                    },
                  },
                },
              },
            },
            {
              name: 'fb_total_guests_display',
              type: 'ui',
              admin: {
                position: 'sidebar',
                components: {
                  Field: {
                    path: '@/collections/public/lacigale-sales/components/total-ui',
                    clientProps: {
                      fieldPaths: FB_GUEST_FIELDS,
                      label: 'Total Guests Today',
                      isCurrency: false, // Ensure your total-ui.tsx handles this
                    },
                  },
                },
              },
            },
          ],
        },
        {
          name: 'misc',
          label: 'MOD & Others',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'telephone', type: 'number', label: 'Telephone', admin: { width: '33%' } },
                {
                  name: 'business_center',
                  type: 'number',
                  label: 'Business Center',
                  admin: { width: '33%' },
                },
                { name: 'laundry', type: 'number', label: 'Laundry', admin: { width: '34%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'spa_and_recreation',
                  type: 'number',
                  label: 'Spa & Rec',
                  admin: { width: '33%' },
                },
                {
                  name: 'hotel_taxi',
                  type: 'number',
                  label: 'Hotel Taxi',
                  admin: { width: '33%' },
                },
                {
                  name: 'cigar_shop',
                  type: 'number',
                  label: 'Cigar Shop',
                  admin: { width: '34%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'space_rental',
                  type: 'number',
                  label: 'Space Rental',
                  admin: { width: '33%' },
                },
                {
                  name: 'flower_shop',
                  type: 'number',
                  label: 'Flower Shop',
                  admin: { width: '33%' },
                },
                {
                  name: 'other_misc',
                  type: 'number',
                  label: 'Other Misc',
                  admin: { width: '34%' },
                },
              ],
            },
            {
              type: 'ui',
              name: 'misc_total_display',
              admin: {
                components: {
                  Field: {
                    path: '@/collections/public/lacigale-sales/components/total-ui',
                    clientProps: { fieldPaths: MISC_FIELDS, label: 'Total MOD & Others Today' },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    // --- SIDEBAR SECTION ---
    {
      name: 'grand_total_sidebar',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/collections/public/lacigale-sales/components/total-ui',
            clientProps: {
              fieldPaths: [...FB_SALES_FIELDS, ...MISC_FIELDS, 'rooms.rooms_revenue'],
              label: 'Grand Total Today',
              variant: 'highlight',
            },
          },
        },
      },
    },
    // --- HIDDEN DATA FIELDS ---
    {
      name: 'total_fb_sales',
      type: 'number',
      label: 'Total F&B',
      admin: { hidden: true },
    },
    {
      name: 'total_fb_guests',
      type: 'number',
      label: 'Total F&B Guests',
      admin: { hidden: true },
    },
    {
      name: 'total_misc_sales',
      type: 'number',
      label: 'Total Misc',
      admin: { hidden: true },
    },
    {
      name: 'grand_total_column',
      type: 'number',
      label: 'Grand Total',
      admin: { hidden: true },
    },
    CreatedByField,
    UpdatedByField,
  ],
}

export default LacigaleSales
