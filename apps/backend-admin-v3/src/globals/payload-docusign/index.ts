import { GlobalConfig } from 'payload'
import { accessHiddenBySlug, accessCheckResolver } from '@/utilities/access'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { User } from '@/payload-types'
import { setUserCreatedOrUpdatedByGlobal } from '@/common/hooks/user-update'
import { auditLogGlobalAfterChange } from '@/common/hooks/audit-log'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { invalidateAllowedOriginsCache } from '@/utilities/cors'

const SLUG = 'payload-docusign'

const PayloadDocusign: GlobalConfig = {
  slug: SLUG,
  label: 'DocuSign',
  access: {
    read: accessCheckResolver(SLUG, 'read', { fallbackAccess: false }),
    update: accessCheckResolver(SLUG, 'update', { fallbackAccess: false }),
  },
  admin: {
    hidden: ({ user }) => {
      // Cast ClientUser to User for structural access check helper
      return accessHiddenBySlug(user as unknown as User, SLUG)
    },
    group: 'Settings',
  },
  hooks: {
    beforeChange: [setUserCreatedOrUpdatedByGlobal],
    afterChange: [auditLogGlobalAfterChange(SLUG), invalidateAllowedOriginsCache],
  },
  fields: [
    CreatedByField,
    UpdatedByField,
    {
      type: 'tabs',
      tabs: [
        // Unnamed tabs only - a `name` on a tab nests its fields' data under that
        // name (like a group field), which would move all the already-saved
        // credentials/settings to a new storage path. These are unnamed on purpose
        // so this is a pure UI reorganization with no schema/data change.
        {
          label: 'Settings',
          fields: [
            {
              type: 'select',
              name: 'environment',
              label: 'Environment',
              defaultValue: 'sandbox',
              options: [
                { label: 'Sandbox', value: 'sandbox' },
                { label: 'Production', value: 'production' },
              ],
              required: true,
              admin: {
                description:
                  'Drives which DocuSign OAuth host is used (account-d.docusign.com for Sandbox, account.docusign.com for Production) - no separate base path field needed.',
              },
            },
            {
              type: 'text',
              name: 'integration_key',
              label: 'Integration Key',
              admin: {
                description: 'DocuSign Integration Key (client_id), from Settings > Apps and Keys.',
              },
            },
            {
              type: 'text',
              name: 'account_id',
              label: 'Account ID',
              admin: {
                description: 'DocuSign API Account ID (the GUID shown on the Apps and Keys page, not the short account number).',
              },
            },
            {
              type: 'textarea',
              name: 'private_key',
              label: 'Private Key (RSA PEM)',
              admin: {
                description:
                  'Paste the full RSA private key PEM generated for the Integration Key above (shown once by DocuSign at generation time).',
              },
            },
            {
              type: 'text',
              name: 'return_url',
              label: 'Return URL',
              defaultValue: `${BACKEND_URL_WITH_BASE}/docusign-return`,
              admin: {
                description:
                  'Embedded Sending return URL (e.g. https://domain/pv3/docusign-return or SPFx return route).',
              },
            },
            {
              type: 'text',
              name: 'allowed_origins',
              label: 'Allowed CORS Origins',
              hasMany: true,
              defaultValue: [],
              admin: {
                description:
                  'Only these origins may call the DocuSign/Exchange APIs from a browser. Also used to validate return-to-SharePoint redirects. No trailing slash. Add one per entry.',
              },
            },
            {
              type: 'text',
              name: 'consent_redirect_url',
              label: 'Consent Redirect URL',
              admin: {
                description: 'Where DocuSign redirects users after one-time consent approval.',
              },
            },
            {
              type: 'text',
              name: 'status_reader_user_id',
              label: 'Status Reader User ID',
              admin: {
                description: 'DocuSign user GUID for the fixed status-reader account.',
              },
            },
          ],
        },
        {
          label: 'Testing',
          fields: [
            {
              type: 'ui',
              name: 'test_connection',
              label: 'Test Connection',
              admin: {
                components: {
                  Field: '@/globals/payload-docusign/components/test',
                },
              },
            },
            {
              type: 'ui',
              name: 'test_create_envelope',
              label: 'Test Create Envelope',
              admin: {
                components: {
                  Field: '@/globals/payload-docusign/components/test-create-envelope',
                },
              },
            },
            {
              type: 'ui',
              name: 'test_envelope_status',
              label: 'Test Envelope Status',
              admin: {
                components: {
                  Field: '@/globals/payload-docusign/components/test-envelope-status',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

export default PayloadDocusign
