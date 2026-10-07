import type { Field } from 'payload'

export const getOrderHandlingFields = ({
  includeCashier,
  orderingDefault = false,
}: {
  includeCashier: boolean
  orderingDefault?: boolean
}): Field[] => [
  {
    type: 'checkbox',
    name: 'ordering_enabled',
    label: 'Enable Table Ordering',
    defaultValue: orderingDefault,
    admin: {
      description:
        'Show the cart and table-ordering flow. Uncheck for a view-only menu with no ordering.',
    },
  },
  {
    type: 'radio',
    name: 'handlers',
    label: 'Who runs the orders?',
    defaultValue: includeCashier ? 'waiter_boh_cashier' : 'boh_only',
    options: [
      ...(includeCashier
        ? [{ label: 'Waiter, Back of House & Cashier', value: 'waiter_boh_cashier' }]
        : []),
      { label: 'Waiter & Back of House', value: 'waiter_boh' },
      { label: 'Back of House only', value: 'boh_only' },
    ],
    admin: {
      condition: (_, siblingData) => siblingData?.ordering_enabled,
      description:
        'Which staff handle each order. Options without a cashier close automatically once served; "Back of House only" also skips the waiter — the kitchen confirms, prepares and serves.',
    },
  },
  {
    type: 'checkbox',
    name: 'show_prices',
    label: 'Show Prices',
    defaultValue: false,
    admin: {
      condition: (_, siblingData) => siblingData?.ordering_enabled,
      description:
        'Uncheck to hide all prices — item cards, cart totals, staff boards and the guest tracker. Use for complimentary events.',
    },
  },
]
