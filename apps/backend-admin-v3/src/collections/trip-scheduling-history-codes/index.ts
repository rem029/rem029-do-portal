import type { CollectionConfig } from 'payload'

const SLUG = 'trip-scheduling-history-codes'

// Internal store for booking-history OTP codes and sessions, reachable only through the Local API.
// Deliberately omits created/updated-by, operator fields and audit hooks (audit-logs precedent):
// the audit hooks would copy code and session hashes into audit-logs.
const TripSchedulingHistoryCodes: CollectionConfig = {
  slug: SLUG,
  labels: {
    singular: 'History Access Code',
    plural: 'History Access Codes',
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'consumedAt',
      type: 'date',
    },
    {
      name: 'sessionTokenHash',
      type: 'text',
      index: true,
    },
    {
      name: 'sessionExpiresAt',
      type: 'date',
    },
  ],
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  graphQL: false,
  timestamps: true,
}

export default TripSchedulingHistoryCodes
