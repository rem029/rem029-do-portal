import { postgresAdapter } from '@payloadcms/db-postgres'
import { AlignFeature, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, Config } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/users'
import { Media } from './collections/media'
import { BACKEND_URL, BACKEND_URL_WITH_BASE, BASE_PATH, MAX_FILE_SIZE } from './utilities/constant'
import UsersAccess from './collections/users-access'
import LinkShortener from './collections/public/link-shortener'
import { LinkShortenerMedia } from './collections/public/link-shortener-media'
import email from './configs/email'
import H2AOasysSettings from './globals/h2a-oasys-settings'
import PayloadDocusign from './globals/payload-docusign'
import { h2aOasysRefresh } from './jobs/h2a-oasys-refresh'
import { h2aOasysSeedDatabase } from './jobs/h2a-oasys-seed-database'
import { sendEmailJob } from './jobs/send-email'
import { surveyBulkSendJob } from './jobs/survey-bulk-send'
import { surveyInvitationSendJob } from './jobs/survey-invitation-send'
import { tripSchedulingLifecycle } from './jobs/trip-scheduling-lifecycle'
import eRecognition from './collections/public/e-recognition'
import { authMicrosoftEndpoint, authMicrosoftCallBackEndpoint } from './endpoints/auth-microsoft'
import { backupEndpoint } from './endpoints/backup'
import { exchangeEmailsEndpoint } from './endpoints/exchange-emails'
import {
  docusignCreateEnvelopeEndpoint,
  docusignListEnvelopesEndpoint,
  docusignEnvelopeStatusEndpoint,
  docusignSigningViewEndpoint,
  docusignConsentCallbackEndpoint,
} from './endpoints/docusign'
import Departments from './collections/departments'
import Restaurants from './collections/restaurants'
import { Workflow } from './collections/workflow'
import { WorkflowV2 } from './collections/workflow-v2'
import { WorkflowInstances } from './collections/workflow-instances'
import Operators from './collections/operators'
import { seed } from './seed'
import { InternalMedias } from './collections/public/internal-media'
import SalaryDeduction from './collections/public/letters/salary-deduction'
import SalaryDeductionSettings from './globals/letters/salary-deduction-settings'
import Warnings from './collections/public/letters/warnings'
import WarningsSettings from './globals/letters/warnings-settings'
import Notices from './collections/public/letters/notices'
import NoticesSettings from './globals/letters/notices-settings'
import DisciplinaryActions from './collections/public/letters/disciplinary-actions'
import DisciplinaryActionsSettings from './globals/letters/disciplinary-actions-settings'
import UserSettings from './collections/user-settings'

import EmployeeHistory from './globals/employee-history'
import HomeDashboardSettings from './globals/home-dashboard-settings'
import AuditLogSettings from './globals/audit-log-settings'
import { h2aOasysSyncDepartment } from './jobs/h2a-oasys-sync-department'
import { h2aOasysSyncUsers } from './jobs/h2a-oasys-sync-users'
import { User } from './payload-types'
import LacigaleSales from './collections/public/lacigale-sales'
import LacigaleSalesReport from './globals/lacigale-sales-report'
import FnbMenuMedia from './collections/public/menu-media'
import FnbMenuAllergens from './collections/public/menu-allergens'
import FnbMenuTags from './collections/public/menu-tags'
import FnbMenuCategories from './collections/public/menu-categories'
import FnbMenuItems from './collections/public/menu-items'
import FnbMenu from './collections/public/menu'
import FnbMenuPages from './collections/public/menu-pages'
import FnbMenuEvents from './collections/public/fnb-menu-events'
import FnbEventStaff from './collections/public/fnb-event-staff'
import SitePages from './collections/public/site-pages'
import FnbTables from './collections/public/tables'
import FnbOrders from './collections/public/orders'
import FnbImport from './globals/fnb-import'
import FormsDashboard from './globals/forms-dashboard'
import SurveySendInvitation from './globals/survey-send-invitation'
import SurveyReport from './globals/survey-report'
import WaiterPanel from './globals/waiter-panel'
import BackOfHousePanel from './globals/back-of-house-panel'
import CashierPanel from './globals/cashier-panel'
import FnbOrdersReport from './globals/fnb-orders-report'
import FnbEventWaiterPanel from './globals/fnb-event-waiter-panel'
import FnbEventBackOfHousePanel from './globals/fnb-event-back-of-house-panel'
import FnbEventCashierPanel from './globals/fnb-event-cashier-panel'
import FnbEventOrdersReport from './globals/fnb-event-orders-report'
import WorkflowDashboard from './globals/workflow-dashboard'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { FormOverrides } from './collections/forms'
import { FormSubmissionsOverrides } from './collections/forms-submission'
import AuditLogs from './collections/audit-logs'
import Analytics from './collections/analytics'
import { auditLogsCleanup } from './jobs/audit-logs-cleanup'
import { FormsMedia } from './collections/forms-media'
import SurveyInvitations from './collections/survey-invitations'
import FilesBlock from './collections/forms/blocks/files'
import GroupedBlock from './collections/forms/blocks/group'
import ListBlock from './collections/forms/blocks/list'
import SignatureBlock from './collections/forms/blocks/signature'
import ConditionalBlock from './collections/forms/blocks/conditional'
import PhoneBlock from './collections/forms/blocks/phone'
import SelectRestaurantsBlock from './collections/forms/blocks/select-restaurants'
import SelectOperatorsBlock from './collections/forms/blocks/select-operators'
import SelectStoreDepartmentsBlock from './collections/forms/blocks/select-store-departments'
import SelectCrmCategoryBlock from './collections/forms/blocks/select-crm-category'
import StoreDepartments from './collections/store-departments'
import CrmCategories from './collections/crm-categories'
import CountryBlock from './collections/forms/blocks/country'
import TimeBlock from './collections/forms/blocks/time'
import MultiStepBlock from './collections/forms/blocks/multi-step'
import RatingBlock from './collections/forms/blocks/rating'
import ScaleBlock from './collections/forms/blocks/scale'
import SurveyDepartmentBlock from './collections/forms/blocks/survey-department'
import HaccpPersonalHygiene from './collections/haccp-personal-hygiene'
import HaccpBuffetTemperature from './collections/haccp-buffet'
import { HaccpDishwashingTemperature } from './collections/haccp-dishwashing'
import HaccpDryStore from './collections/haccp-dry-store'
import { HaccpOutletSettings } from '@/collections/haccp-outlet-settings'
import Outlets from './collections/outlets'
import QaFieldTypes from './collections/qa-field-types'
import { seedFirstUser } from './seed/first-user'

import TripSchedulingSettings from './globals/trip-scheduling-settings'
import TripSchedulingAdhoc from './collections/trip-scheduling-adhoc'
import TripSchedulingBookings from './collections/trip-scheduling-bookings'
import TripSchedulingCategories from './collections/trip-scheduling-categories'
import TripSchedulingDrivers from './collections/trip-scheduling-drivers'
import TripSchedulingHistoryCodes from './collections/trip-scheduling-history-codes'
import TripSchedulingLocations from './collections/trip-scheduling-locations'
import TripSchedulingRoutes from './collections/trip-scheduling-routes'
import TripSchedulingShuttles from './collections/trip-scheduling-shuttles'
import TripSchedulingStaffVoice from './collections/trip-scheduling-staff-voice'
import TripSchedulingVehicles from './collections/trip-scheduling-vehicles'
import TripSchedulingZones from './collections/trip-scheduling-zones'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const payloadConfig: Config = {
  email: email,
  onInit: async (p) => {
    if (process.env.NODE_ENV !== 'production') {
      await seedFirstUser({ payload: p })
    }

    if (process.env.PAYLOAD_SEED === 'true') {
      p.logger.info('Seeding database...')
      await seed({ payload: p })
    }
  },
  admin: {
    autoRefresh: true,
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      views: {},
      actions: [
        './common/components/topbar-actions#TopbarActions',
        './common/components/document-sidebar-toggle#DocumentSidebarToggle',
      ],
      afterLogin: ['./common/components/auth-microsoft'],
      beforeDashboard: [
        './common/components/seed-dashboard',
        './common/components/h2a-oasys-dashboard',
        // Removed temporarily
        // './common/components/quick-view-dashboard',
        './common/components/docusign-dashboard',
      ],
      beforeLogin: ['./common/components/login'],
      beforeNavLinks: ['./common/components/sidebar-brand#SidebarBrand'],
      graphics: {
        Icon: { path: `./common/components/logo`, exportName: `LogoSM` },
        Logo: { path: `./common/components/logo`, exportName: `Logo` },
      },
      afterNavLinks: [
        './common/components/sidebar-profile-card#SidebarProfileCard',
        './common/components/user-settings/link#UserSettingsLink',
      ],
    },
    meta: {
      titleSuffix: ' - Doha Oasis',
      title: 'Admin Panel',
      description: 'Doha Oasis Admin Panel',
      icons: [
        {
          type: 'image/png',
          rel: 'icon',
          sizes: '32x32',
          url: `${BASE_PATH}/branding/favicon-32.png`,
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          url: `${BASE_PATH}/branding/apple-touch-icon.png`,
        },
      ],
      openGraph: {
        siteName: 'Doha Oasis Admin',
        description: 'Doha Oasis Admin Panel',
        images: [
          {
            url: `${BASE_PATH}/branding/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'Doha Oasis Admin',
          },
        ],
      },
    },
    autoLogin:
      process.env.NODE_ENV !== 'production'
        ? {
            email: process.env.PAYLOAD_FIRST_USER_EMAIL || 'admin@payload.com',
            password: process.env.PAYLOAD_FIRST_USER_EMAIL || 'admin@payload.com',
            prefillOnly: true,
          }
        : false,
  },
  serverURL: BACKEND_URL,
  // Static CORS only allows internal backend URL. External origins (e.g. SharePoint)
  // are handled dynamically via Settings > DocuSign (payload-docusign.allowed_origins).
  // Custom headers sent by external callers (X-MS-Graph-Token) are allowed here.
  cors: {
    origins: [BACKEND_URL],
    headers: ['X-MS-Graph-Token'],
  },
  localization: {
    locales: [
      { label: 'English', code: 'en', fallbackLocale: 'en' },
      { label: 'Arabic', code: 'ar', fallbackLocale: 'en', rtl: true },
      { label: 'French', code: 'fr', fallbackLocale: 'en' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  debug: process.env.NODE_ENV !== 'production',
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, AlignFeature(), LinkFeature({})],
  }),
  collections: [
    LinkShortener,
    LinkShortenerMedia,
    eRecognition,

    LacigaleSales,

    FnbMenuMedia,
    FnbMenuAllergens,
    FnbMenuTags,
    FnbMenuCategories,
    FnbMenuItems,
    FnbMenu,
    FnbMenuPages,
    FnbMenuEvents,
    FnbEventStaff,
    FnbTables,
    FnbOrders,
    SitePages,
    // Keep this commented out for now. Until further notice.
    // HRRequests,
    // BusinessJustifications,
    // OfferLetter,
    // EndOfService,
    // RecruitmentNote,
    HaccpPersonalHygiene,
    HaccpBuffetTemperature,
    HaccpDishwashingTemperature,
    HaccpDryStore,
    SurveyInvitations,
    Outlets,
    HaccpOutletSettings,

    Media,
    InternalMedias,

    FormsMedia,

    SalaryDeduction,
    Warnings,
    Notices,
    DisciplinaryActions,
    Workflow,
    WorkflowV2,
    WorkflowInstances,

    Users,
    UsersAccess,
    UserSettings,
    Departments,
    StoreDepartments,
    CrmCategories,
    Restaurants,
    Operators,
    AuditLogs,
    Analytics,

    QaFieldTypes,

    TripSchedulingAdhoc,
    TripSchedulingBookings,
    TripSchedulingCategories,
    TripSchedulingDrivers,
    TripSchedulingHistoryCodes,
    TripSchedulingLocations,
    TripSchedulingRoutes,
    TripSchedulingShuttles,
    TripSchedulingStaffVoice,
    TripSchedulingVehicles,
    TripSchedulingZones,    
  ],
  globals: [
    FormsDashboard,

    EmployeeHistory,
    HomeDashboardSettings,
    AuditLogSettings,
    // Keep this commented out for now. Until further notice.
    // HRRequestSettings,
    // BusinessJustificationsSettings,
    // OfferLetterSettings,
    // EndOfServiceSettings,
    // RecruitmentNoteSettings,
    LacigaleSalesReport,
    SurveySendInvitation,
    SurveyReport,

    WorkflowDashboard,
    FnbImport,
    TripSchedulingSettings,
    WaiterPanel,
    BackOfHousePanel,
    CashierPanel,
    FnbOrdersReport,
    FnbEventWaiterPanel,
    FnbEventBackOfHousePanel,
    FnbEventCashierPanel,
    FnbEventOrdersReport,

    H2AOasysSettings,
    PayloadDocusign,
    SalaryDeductionSettings,
    WarningsSettings,
    NoticesSettings,
    DisciplinaryActionsSettings,
  ],
  jobs: {
    tasks: [
      h2aOasysRefresh,
      h2aOasysSyncDepartment,
      h2aOasysSyncUsers,
      auditLogsCleanup,
      h2aOasysSeedDatabase,
      sendEmailJob,
      surveyBulkSendJob,
      surveyInvitationSendJob,
      tripSchedulingLifecycle,
    ],
    addParentToTaskLog: true,
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      if (!defaultJobsCollection.admin) {
        defaultJobsCollection.admin = {}
      }

      defaultJobsCollection.admin.hidden = ({ user }) => {
        return (user as unknown as User)?.super_user !== true
      }
      // defaultJobsCollection.admin.hidden = ({ user }) => (user?.super_user as boolean) !== true
      return defaultJobsCollection
    },
  },
  upload: {
    limits: {
      fileSize: Number(MAX_FILE_SIZE),
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      // Bounds each pool instance and fails fast instead of hanging: dev-mode
      // recompiles/restarts can leave a prior pool's connections open, and
      // without a cap a starved request just queues forever waiting for a
      // slot instead of surfacing an error.
      max: 10,
      connectionTimeoutMillis: 8_000,
      idleTimeoutMillis: 30_000,
      // Caps how long a query can sit blocked on a lock held by another
      // session's open transaction - without this, a query that acquires a
      // connection fine but then blocks on a row/table lock hangs
      // indefinitely (connectionTimeoutMillis above only bounds acquiring a
      // connection, not executing a query once you have one). 2 minutes
      // leaves headroom for genuinely slow admin operations (bulk
      // imports/reports) while still failing loud instead of hanging forever.
      statement_timeout: 120_000,
    },
    idType: 'uuid',
    push: process.env.DISABLE_PAYLOAD_PUSH === 'true' ? false : undefined,
  }),
  sharp,
  plugins: [
    // payloadCloudPlugin(),
    // storage-adapter-placeholder
    formBuilderPlugin({
      fields: {
        // Non-default built-ins to enable
        radio: true,
        date: true,
        // Disable built-ins not needed
        state: false,
        // Override default country with custom block
        country: CountryBlock,
        // Custom blocks
        file: FilesBlock,
        grouped: GroupedBlock,
        list: ListBlock,
        signature: SignatureBlock,
        conditional: ConditionalBlock,
        phone: PhoneBlock,
        selectRestaurants: SelectRestaurantsBlock,
        selectOperators: SelectOperatorsBlock,
        selectStoreDepartments: SelectStoreDepartmentsBlock,
        selectCrmCategory: SelectCrmCategoryBlock,
        time: TimeBlock,
        multiStep: MultiStepBlock,
        rating: RatingBlock,
        scale: ScaleBlock,
        surveyDepartment: SurveyDepartmentBlock,
      },
      formOverrides: FormOverrides,
      formSubmissionOverrides: FormSubmissionsOverrides,
      beforeEmail: async (emailsToSend, beforeChangeParams) => {
        const formID = beforeChangeParams?.data?.form
        let form
        if (formID) {
          try {
            form = await beforeChangeParams.req.payload.findByID({
              collection: 'forms',
              id: typeof formID === 'string' ? formID : formID?.id,
              req: beforeChangeParams.req,
            })
          } catch {
            // ignore
          }
        }

        const includeLinks = form?.include_admin_links_in_email !== false

        let appendedHtml = ''

        if (includeLinks) {
          appendedHtml = `
            <br /><br />
            <p>For reporting: <br /><a href="${BACKEND_URL_WITH_BASE}/admin/globals/forms-dashboard">${BACKEND_URL_WITH_BASE}/admin/globals/forms-dashboard</a></p>
          `
        }

        // modify the emails in any way before they are sent
        return emailsToSend.map((email) => ({
          ...email,
          html: email.html + appendedHtml,
        }))
      },
    }),
  ],
  telemetry: false,
  endpoints: [
    authMicrosoftEndpoint,
    authMicrosoftCallBackEndpoint,
    backupEndpoint,
    exchangeEmailsEndpoint,
    docusignCreateEnvelopeEndpoint,
    docusignListEnvelopesEndpoint,
    docusignEnvelopeStatusEndpoint,
    docusignSigningViewEndpoint,
    docusignConsentCallbackEndpoint,
  ],
}

export default buildConfig(payloadConfig)
