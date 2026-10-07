import type { Block } from 'payload'
import getFields from '../fields'

export const BlockFilter: Block = {
  slug: 'filter',
  interfaceName: 'BlockFilter',
  labels: { plural: 'Filters', singular: 'Filter' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'c',
          label: 'Content',
          fields: [
            {
              type: 'checkbox',
              name: 'showSearch',
              label: 'Show Search',
              defaultValue: true,
            },
            {
              type: 'checkbox',
              name: 'showAllergenFilters',
              label: 'Show Allergen Filters',
              defaultValue: true,
            },
            {
              type: 'checkbox',
              name: 'showAvailabilityFilters',
              label: 'Show Availability Filter (All Day / Lunch / Dinner)',
              defaultValue: false,
              admin: {
                description:
                  'Adds All Day / Lunch / Dinner to the filter panel guests open with the funnel icon, alongside Allergen Filters if that is also on. The funnel icon itself shows whenever either this or Allergen Filters is checked.',
              },
            },
          ],
        },
        {
          name: 'settings',
          label: 'Settings',
          fields: [...getFields([{ type: 'className' }, { type: 'css' }])],
        },
      ],
    },
  ],
}
