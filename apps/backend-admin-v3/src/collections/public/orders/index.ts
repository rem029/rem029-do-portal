import type { CollectionConfig, Where } from 'payload'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { AccessAdmin, accessCheckResolver, accessHiddenBySlug } from '@/utilities/access'
import { orderAccessRefine } from '@/utilities/access-operator'
import { User } from '@/payload-types'
import { getRestaurantField } from '../menu-pages/fields'
import { assignOrderNumber } from './hooks/assign-order-number'
import { snapshotOrderItemPrices } from './hooks/snapshot-prices'
import { trackOrderStatusTimestamps } from './hooks/status-timestamps'
import { guardOrderStatusTransition } from './hooks/transition-guard'
import { autoCompleteEventOrder } from './hooks/auto-complete-event-order'
import { broadcastOrderUpdate } from './hooks/broadcast'

const SLUG = 'orders'
const COLLECTION_NAME_TABLES = 'tables'
const COLLECTION_NAME_ITEMS = 'menu-items'

const FnbOrders: CollectionConfig = {
  slug: SLUG,
  labels: { plural: 'Orders', singular: 'Order' },
  admin: {
    group: 'FnB',
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
    defaultColumns: ['order_number', 'table', 'guest_name', 'status', 'items', 'createdAt'],
    listSearchableFields: ['guest_name'],
  },
  fields: [
    getRestaurantField(),
    {
      type: 'relationship',
      name: 'table',
      label: 'Table',
      relationTo: COLLECTION_NAME_TABLES,
      required: true,
      filterOptions: ({ data }) => {
        if (!data?.restaurant) return false
        return { restaurant: { equals: data.restaurant } } as Where
      },
    },
    {
      type: 'number',
      name: 'seat_number',
      label: 'Seat Number',
      required: true,
      min: 1,
      admin: {
        description: "The guest's seat position at the table.",
      },
    },
    {
      type: 'text',
      name: 'guest_name',
      label: 'Guest Name',
      maxLength: 120,
      admin: {
        description:
          "Optional - the name the guest gave at checkout so staff know whose order this is. Never required: the guest flow must not force a guest to identify themselves.",
      },
    },
    {
      type: 'textarea',
      name: 'notes',
      label: 'Special Request / Notes',
      maxLength: 500,
      admin: {
        description: 'Optional free-text handling instructions the guest left with the order.',
      },
    },
    {
      type: 'number',
      name: 'order_number',
      label: 'Order #',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      type: 'date',
      name: 'order_date',
      label: 'Order Date',
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      type: 'checkbox',
      name: 'event_mode',
      label: 'Event Mode',
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'Snapshotted from the menu page at order time. When on, the order auto-closes to Completed as soon as a waiter marks it Served — no cashier step.',
      },
    },
    {
      type: 'checkbox',
      name: 'show_prices',
      label: 'Show Prices',
      defaultValue: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'Snapshotted from the menu page at order time. When off, prices are hidden on the guest tracker and the staff order boards for this order.',
      },
    },
    {
      type: 'select',
      name: 'fulfillment',
      label: 'Fulfilment Flow',
      defaultValue: 'standard',
      options: [
        { label: 'Standard (waiter + back of house)', value: 'standard' },
        { label: 'Back of House only', value: 'boh_only' },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'Snapshotted when the order is placed. "Back of House only" orders skip the waiter — Back of House confirms, prepares and serves.',
      },
    },
    {
      type: 'text',
      name: 'ordering_slug',
      label: 'Ordering Page/Event',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'The menu page or event slug this order was placed from. Snapshotted at order time — survives a rename or delete of the source.',
      },
    },
    {
      type: 'select',
      name: 'ordering_collection',
      label: 'Ordering Source',
      options: [
        { label: 'Menu Page', value: 'menu-pages' },
        { label: 'Event', value: 'fnb-menu-events' },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      type: 'select',
      name: 'status',
      label: 'Status',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Preparing', value: 'preparing' },
        { label: 'Prepared', value: 'prepared' },
        { label: 'Served', value: 'served' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'pending -> confirmed (waiter) -> preparing (back of house) -> prepared (back of house) -> served (waiter) -> completed (cashier). Cancel only allowed before preparing starts. Each transition is locked to the role that owns it - see orders/hooks/transition-guard.',
      },
    },
    {
      type: 'array',
      name: 'items',
      label: 'Items',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'item',
          label: 'Item',
          type: 'relationship',
          relationTo: COLLECTION_NAME_ITEMS,
          required: true,
          filterOptions: ({ data }) => {
            if (!data?.restaurant) return false
            return { restaurant: { equals: data.restaurant } } as Where
          },
        },
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'price_at_order',
          label: 'Price (at order time)',
          type: 'number',
          admin: {
            readOnly: true,
          },
        },
        {
          type: 'array',
          name: 'selected_modifiers',
          label: 'Selected Modifiers',
          admin: {
            readOnly: true,
            description: 'Snapshotted option labels chosen at order time - see snapshot-prices hook.',
          },
          fields: [
            {
              name: 'group_name',
              label: 'Group',
              type: 'text',
              required: true,
            },
            {
              name: 'selections',
              label: 'Selections',
              type: 'text',
              hasMany: true,
              required: true,
            },
          ],
        },
      ],
    },
    {
      type: 'date',
      name: 'confirmed_at',
      label: 'Confirmed At',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'date',
      name: 'preparing_at',
      label: 'Preparing Started At',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'date',
      name: 'prepared_at',
      label: 'Prepared At',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'date',
      name: 'served_at',
      label: 'Served At',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'date',
      name: 'completed_at',
      label: 'Completed At',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'date',
      name: 'cancelled_at',
      label: 'Cancelled At',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      type: 'text',
      name: 'cancel_reason',
      label: 'Cancel Reason',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'cancelled',
      },
    },
    CreatedByField,
    UpdatedByField,
  ],
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
      refineAccess: orderAccessRefine,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
      refineAccess: orderAccessRefine,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
      refineAccess: orderAccessRefine,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
      refineAccess: orderAccessRefine,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
      refineAccess: orderAccessRefine,
    }),
  },
  hooks: {
    beforeChange: [
      setUserCreatedOrUpdatedByCollection,
      assignOrderNumber,
      snapshotOrderItemPrices,
      guardOrderStatusTransition,
      autoCompleteEventOrder,
      trackOrderStatusTimestamps,
    ],
    afterChange: [auditLogAfterChange(SLUG), broadcastOrderUpdate(SLUG)],
    afterDelete: [auditLogAfterDelete(SLUG)],
  },
  timestamps: true,
}

export default FnbOrders
