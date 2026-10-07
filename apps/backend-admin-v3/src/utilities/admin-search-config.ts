import type { CollectionSlug, GlobalSlug } from 'payload'

export interface AdminSearchableCollection {
  slug: CollectionSlug
  label: string
  /**
   * Text field to run `like` document search against. Omit for collections
   * that should only surface as a "Go to <Collection>" navigation shortcut
   * (e.g. no meaningful text title field to search by, like a UUID-only
   * `useAsTitle`) — they're still matched by collection name/label.
   */
  titleField?: string
}

/**
 * Allowlist of collections searchable via the admin search command palette,
 * both for document text search (`titleField` set) and for "Go to <Collection>"
 * navigation shortcuts (every entry, regardless of `titleField`).
 *
 * Collections without meaningful text title fields (e.g. form submissions with
 * UUID IDs, HACCP logs with date timestamps or relation IDs) are excluded from
 * document search entirely — including `user-settings` below via an omitted
 * `titleField` — to ensure fast, reliable `like` text matching.
 */
export const ADMIN_SEARCHABLE_COLLECTIONS: AdminSearchableCollection[] = [
  // Note: `qa-field-types` is intentionally omitted from admin search because it is a dev-only temporary collection.
  {
    slug: 'outlets',
    label: 'Outlets',
    titleField: 'name',
  },
  {
    slug: 'restaurants',
    label: 'Restaurants',
    titleField: 'title',
  },
  {
    slug: 'departments',
    label: 'Departments',
    titleField: 'title',
  },
  {
    slug: 'store-departments',
    label: 'Store Departments',
    titleField: 'title',
  },
  {
    slug: 'operators',
    label: 'Operators',
    titleField: 'title',
  },
  {
    slug: 'users',
    label: 'Users',
    titleField: 'email',
  },
  {
    slug: 'forms',
    label: 'Forms',
    titleField: 'title',
  },
  {
    slug: 'crm-categories',
    label: 'CRM Categories',
    titleField: 'title',
  },
  {
    slug: 'media',
    label: 'Media',
    titleField: 'filename',
  },
  {
    slug: 'haccp-dishwashing-temperature',
    label: 'Dishwashing Temperature',
    titleField: 'monthYear',
  },
  {
    slug: 'haccp-dry-store',
    label: 'Dry Store Logs',
    titleField: 'monthYear',
  },
  {
    slug: 'workflow',
    label: 'Workflow',
    titleField: 'name',
  },
  {
    slug: 'workflow-v2',
    label: 'Workflow V2',
    titleField: 'name',
  },
  {
    slug: 'workflow-instances',
    label: 'Workflow Instances',
    titleField: 'title',
  },
  {
    slug: 'audit-logs',
    label: 'Audit Logs',
    // No titleField: `operation` is a Postgres native enum column
    // (enum_audit_logs_operation) — ILIKE against it throws ("operator does
    // not exist: enum_audit_logs_operation ~~* unknown"), confirmed against
    // the real DB. Navigation shortcut only.
  },
  {
    slug: 'analytics',
    label: 'Analytics',
    // Same reasoning as audit-logs above: `eventType` is a Postgres native
    // enum column (enum_analytics_event_type), confirmed to throw on ILIKE.
    // Navigation shortcut only.
  },
  {
    slug: 'users-access',
    label: 'Access',
    titleField: 'name',
  },
  {
    slug: 'user-settings',
    label: 'User Settings',
    // No text title field (useAsTitle is 'id', a UUID) — navigation shortcut only.
  },
  {
    slug: 'link-shortener',
    label: 'Links',
    titleField: 'slug',
  },
  {
    slug: 'link-shortener-media',
    label: 'Links Media',
    titleField: 'filename',
  },
  {
    slug: 'e-recognition',
    label: 'E-Recognitions',
    titleField: 'title',
  },
  {
    slug: 'lacigale-sales',
    label: 'La Cigale Sales',
    // No text title field (useAsTitle is a date) — navigation shortcut only.
  },
  {
    slug: 'menu-media',
    label: 'FnB Media',
    titleField: 'filename',
  },
  {
    slug: 'menu-allergens',
    label: 'FnB Allergens',
    titleField: 'title',
  },
  {
    slug: 'menu-tags',
    label: 'FnB Tags',
    titleField: 'title',
  },
  {
    slug: 'menu-categories',
    label: 'FnB Categories',
    titleField: 'title',
  },
  {
    slug: 'menu-items',
    label: 'FnB Items',
    titleField: 'title',
  },
  {
    slug: 'menu',
    label: 'FnB Menus',
    titleField: 'category_title',
  },
  {
    slug: 'menu-pages',
    label: 'FnB Pages',
    // useAsTitle is operator_slug, not a meaningful title — navigation shortcut only.
  },
  {
    slug: 'fnb-menu-events',
    label: 'FnB Events',
    titleField: 'title',
  },
  {
    slug: 'fnb-event-staff',
    label: 'FnB Event Staff Access',
    // useAsTitle is operator_slug, not a meaningful title — navigation shortcut only.
  },
  {
    slug: 'tables',
    label: 'FnB Tables',
    titleField: 'label',
  },
  {
    slug: 'orders',
    label: 'FnB Orders',
    // No text title field (useAsTitle is 'id') — navigation shortcut only.
  },
  {
    slug: 'site-pages',
    label: 'Site Pages',
    // useAsTitle is operator_slug, not a meaningful title — navigation shortcut only.
  },
  {
    slug: 'haccp-personal-hygiene',
    label: 'HACCP Personal Hygiene',
    // No text title field (useAsTitle is a date) — navigation shortcut only.
  },
  {
    slug: 'haccp-buffet-temperature',
    label: 'HACCP Buffet Temperature',
    // No text title field (useAsTitle is a date) — navigation shortcut only.
  },
  {
    slug: 'haccp-outlet-settings',
    label: 'HACCP Outlet Settings',
    // useAsTitle is the outlet relationship — navigation shortcut only.
  },
  {
    slug: 'survey-invitations',
    label: 'Survey Invitations',
    titleField: 'code',
  },
  {
    slug: 'internal-media',
    label: 'Internal Media',
    titleField: 'filename',
  },
  {
    slug: 'forms-media',
    label: 'Forms Media',
    titleField: 'filename',
  },
  {
    slug: 'form-submissions',
    label: 'Form Submissions',
    // No text title field (useAsTitle is 'id') — navigation shortcut only.
  },
  {
    slug: 'salary-deduction',
    label: 'Salary Deductions',
    titleField: 'employee_name',
  },
  {
    slug: 'warnings',
    label: 'Warnings',
    titleField: 'employee_name',
  },
  {
    slug: 'notices',
    label: 'Notices',
    titleField: 'employee_name',
  },
  {
    slug: 'disciplinary-actions',
    label: 'Disciplinary Actions',
    titleField: 'employee_name',
  },
  {
    slug: 'trip-scheduling-adhoc',
    label: 'Trip Adhoc Requests',
    titleField: 'fullName',
  },
  {
    slug: 'trip-scheduling-bookings',
    label: 'Trip Bookings',
    titleField: 'fullName',
  },
  {
    slug: 'trip-scheduling-categories',
    label: 'Trip Categories',
    titleField: 'name',
  },
  {
    slug: 'trip-scheduling-drivers',
    label: 'Trip Drivers',
    titleField: 'name',
  },
  {
    slug: 'trip-scheduling-locations',
    label: 'Trip Locations',
    titleField: 'name',
  },
  {
    slug: 'trip-scheduling-routes',
    label: 'Trip Routes',
    titleField: 'name',
  },
  {
    slug: 'trip-scheduling-shuttles',
    label: 'Trip Shuttles',
    titleField: 'adminTitle',
  },
  {
    slug: 'trip-scheduling-staff-voice',
    label: 'Staff Voice Submissions',
    titleField: 'subject',
  },
  {
    slug: 'trip-scheduling-vehicles',
    label: 'Trip Vehicles',
    titleField: 'name',
  },
  {
    slug: 'trip-scheduling-zones',
    label: 'Trip Zones',
    titleField: 'zoneNumber',
  },
]

export interface AdminSearchableGlobal {
  slug: GlobalSlug
  label: string
}

/**
 * Allowlist of globals offered as "Go to <Global>" navigation shortcuts in the
 * admin search palette. Globals are single documents, so there's no document search.
 */
export const ADMIN_SEARCHABLE_GLOBALS: AdminSearchableGlobal[] = [
  { slug: 'forms-dashboard', label: 'Forms Dashboard' },
  { slug: 'employee-history', label: 'Employee History' },
  { slug: 'home-dashboard-settings', label: 'Home Dashboard Settings' },
  { slug: 'audit-log-settings', label: 'Audit Log Settings' },
  { slug: 'lacigale-sales-report', label: 'La Cigale Sales Report' },
  { slug: 'survey-send-invitation', label: 'Survey Send Invitations' },
  { slug: 'survey-report', label: 'Survey Reports' },
  { slug: 'workflow-dashboard', label: 'Workflow Dashboard' },
  { slug: 'fnb-import', label: 'FnB Import' },
  { slug: 'trip-scheduling-settings', label: 'Trip Scheduling Options' },
  { slug: 'waiter-panel', label: 'FnB Waiter Panel' },
  { slug: 'back-of-house-panel', label: 'FnB Back of House Panel' },
  { slug: 'cashier-panel', label: 'FnB Cashier Panel' },
  { slug: 'fnb-orders-report', label: 'FnB Orders Report' },
  { slug: 'fnb-event-waiter-panel', label: 'FnB Event Waiter Panel' },
  { slug: 'fnb-event-back-of-house-panel', label: 'FnB Event Back of House Panel' },
  { slug: 'fnb-event-cashier-panel', label: 'FnB Event Cashier Panel' },
  { slug: 'fnb-event-orders-report', label: 'FnB Event Orders Report' },
  { slug: 'h2a-oasys-settings', label: 'H2A Oasys Settings' },
  { slug: 'payload-docusign', label: 'DocuSign Settings' },
  { slug: 'salary-deduction-settings', label: 'Salary Deduction Settings' },
  { slug: 'warnings-settings', label: 'Warnings Settings' },
  { slug: 'notices-settings', label: 'Notices Settings' },
  { slug: 'disciplinary-actions-settings', label: 'Disciplinary Actions Settings' },
]
