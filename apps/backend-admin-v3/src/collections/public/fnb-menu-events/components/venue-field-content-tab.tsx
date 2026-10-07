'use client'

import React from 'react'
import type { RelationshipFieldClientProps, UIFieldClientProps } from 'payload'
import { VenueField } from './venue-field'

const venueProxyFieldConfig = {
  type: 'relationship',
  name: 'restaurant',
  label: 'Venue',
  required: true,
  relationTo: 'restaurants',
  admin: {
    description:
      'Where this event runs. Only venues marked "Available for events" appear. Create one here if it does not exist yet.',
  },
}

export const VenueFieldContentTab: React.FC<UIFieldClientProps> = () => {
  // Structural cast: VenueField expects RelationshipFieldClientProps, but is rendered
  // inside a UI field slot to bind to the top-level 'restaurant' form field.
  const proxyProps = {
    path: 'restaurant',
    field: venueProxyFieldConfig,
  } as unknown as RelationshipFieldClientProps

  return <VenueField {...proxyProps} />
}

export default VenueFieldContentTab
