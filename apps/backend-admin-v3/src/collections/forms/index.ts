import { CollectionConfig, Field } from 'payload'
import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'
import CreatedByField from '@/common/fields/created-by'
import UpdatedByField from '@/common/fields/updated-by'
import { setUserCreatedOrUpdatedByCollection } from '@/common/hooks/user-update'
import { Slug } from '@/common/fields/slug'
import { accessCheckResolver, AccessAdmin, accessHiddenBySlug } from '@/utilities/access'
import { revalidateFormAfterChange, revalidateFormAfterDelete } from './hooks/revalidate-form'
import { validateMultiStepConstraint } from './hooks/validate-multi-step'
import { validateSurveyDepartment } from './hooks/validate-survey-department'
import { assignSurveyCode } from './hooks/assign-survey-code'
import { auditLogAfterChange, auditLogAfterDelete } from '@/common/hooks/audit-log'
import { deleteQRCode } from './hooks/deleteQRCode'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'
import { enhanceFormFields } from '@/utilities/forms-enhanced-fields'
import { BlockSection } from './blocks/section'
import { User } from '@/payload-types'

type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

const SLUG = 'forms'

export const FormOverrides: {
  fields?: FieldsOverride
} & Partial<Omit<CollectionConfig, 'fields'>> = {
  slug: SLUG,
  labels: { plural: 'Forms', singular: 'Form' },
  admin: {
    group: 'Forms',
    useAsTitle: 'title',
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug || ''
        return `${BACKEND_URL_WITH_BASE}/forms/${slug}?preview=true`
      },
    },
    hidden: (u) => accessHiddenBySlug(u.user as unknown as User, SLUG) as boolean,
  },
  fields: ({ defaultFields }) => {
    const enhancedDefaults = enhanceFormFields(defaultFields)

    return [
      {
        type: 'ui',
        name: 'frontend_url_preview',
        admin: {
          components: {
            Field: {
              path: '@/common/components/frontend-url-preview',
              clientProps: {
                pathPrefix: '',
                useSlug: true,
                label: 'Public Form URL',
              },
            },
          },
        },
      },
      ...enhancedDefaults,
      {
        name: 'notify_creator',
        type: 'checkbox',
        label: 'Notify creator on submit',
        defaultValue: false,
      },
      {
        name: 'creator_notification_content',
        type: 'richText',
        label: 'Creator Notification Content',
        localized: true,
        admin: {
          condition: (data) => data?.notify_creator === true,
        },
      },
      {
        name: 'has_terms',
        type: 'checkbox',
        label: 'Enable Terms and Conditions',
        defaultValue: false,
      },
      {
        name: 'terms_content',
        type: 'richText',
        label: 'Terms and Conditions Content',
        localized: true,
        admin: {
          condition: (data) => data?.has_terms === true,
        },
      },
      {
        name: 'operator',
        type: 'relationship',
        relationTo: 'operators',
        required: true,
        admin: {
          position: 'sidebar',
        },
      },
      {
        name: 'override_user_operator',
        type: 'checkbox',
        label: 'Override User Operator?',
        defaultValue: false,
        admin: {
          position: 'sidebar',
          description:
            "If enabled, every submission is saved under this operator (and any workflow is initiated under it) instead of the logged in user's operator. Always on for surveys, whose respondents have no operator of their own.",
        },
        hooks: {
          beforeChange: [({ value, siblingData }) => (siblingData?.is_survey ? true : value)],
        },
      },
      {
        name: 'custom_css',
        type: 'code',
        label: 'Custom CSS',
        admin: {
          language: 'css',
          position: 'sidebar',
          description: 'CSS injected as a <style> tag when this form renders.',
        },
      },
      {
        name: 'theme',
        type: 'select',
        defaultValue: 'dohaquest',
        options: [
          { label: 'Printemps', value: 'printemps' },
          { label: 'Doha Oasis', value: 'dohaoasis' },
          { label: 'Doha Oasis New', value: 'dohaoasis-new' },
          { label: 'Doha Oasis Alt', value: 'dohaoasis-alt' },
          { label: 'Doha Quest', value: 'dohaquest' },
          { label: 'Doha Quest New', value: 'dohaquest-new' },
          { label: 'Banyan Tree Lululemon', value: 'banyan-tree-lululemon' },
        ],
        admin: {
          position: 'sidebar',
        },
      },
      {
        name: 'available_languages',
        label: 'Available Languages',
        type: 'select',
        hasMany: true,
        defaultValue: ['EN'],
        options: [
          { label: 'English', value: 'EN' },
          { label: 'Arabic', value: 'AR' },
        ],
        admin: {
          position: 'sidebar',
        },
      },
      {
        name: 'header_image',
        type: 'upload',
        relationTo: 'media',
        label: 'Header Image',
        admin: {
          description: 'Recommended aspect ratio 16:9 for consistent display.',
        },
      },
      {
        name: 'background_image',
        type: 'upload',
        relationTo: 'media',
        label: 'Background Image',
        admin: {
          description: 'Large image for form background.',
          condition: (data) => !data?.use_layout,
        },
      },
      {
        name: 'use_layout',
        type: 'checkbox',
        label: 'Use Layout Builder?',
        defaultValue: false,
        admin: {
          position: 'sidebar',
          description:
            'If enabled, replaces the default header/background with a custom block layout.',
        },
      },
      {
        type: 'blocks',
        name: 'layout',
        label: 'Layout',
        labels: { plural: 'Layouts', singular: 'Layout' },
        blocks: [BlockSection],
        admin: {
          condition: (data) => data?.use_layout,
        },
      },
      {
        name: 'show_sequence_number',
        type: 'checkbox',
        defaultValue: true,
        label: 'Show Sequence Number?',
        admin: {
          position: 'sidebar',
        },
      },
      {
        name: 'include_admin_links_in_email',
        type: 'checkbox',
        defaultValue: true,
        label: 'Include Admin Links in Email Notifications?',
        admin: {
          position: 'sidebar',
          description: 'Append direct links to view submission and reporting in the email footer.',
        },
      },
      {
        name: 'isActive',
        type: 'checkbox',
        defaultValue: true,
        label: 'Is Active',
        admin: {
          position: 'sidebar',
        },
      },
      {
        name: 'is_survey',
        type: 'checkbox',
        defaultValue: false,
        label: 'Is Survey?',
        admin: {
          position: 'sidebar',
          description:
            "If enabled, this form is a code-gated survey. It cannot be submitted through the public form path - responses are collected only via a survey invitation code sent from Survey Invitations. Each code is single-use: once a response is submitted, that code is permanently spent and cannot be reused, even by the same recipient. The submission itself stores only the code, never the recipient's email or identity - but this is pseudonymous, not cryptographically anonymous: an administrator with read access to both Survey Invitations and Form Submissions (and to the audit log, which records the sent -> responded transition with the email present) can still link a response back to its recipient via the shared code. Do not describe this to respondents as fully anonymous.",
        },
      },
      {
        name: 'survey_code',
        type: 'text',
        label: 'Survey Code',
        unique: true,
        admin: {
          position: 'sidebar',
          readOnly: true,
          condition: (data) => data?.is_survey === true,
          description:
            'Auto-assigned the first time this form is marked as a survey (e.g. A1). Every invitation code for this survey ends with it, so a code like ABC123-A1 belongs to this form. It never changes once set.',
        },
        // The copy must get a fresh code from assignSurveyCode, not Payload's default unique-field "<value> - Copy".
        hooks: {
          beforeDuplicate: [() => null],
        },
      },
      {
        name: 'requires_auth',
        type: 'checkbox',
        defaultValue: false,
        label: 'Requires Authentication?',
        admin: {
          position: 'sidebar',
          description: 'If enabled, users must log in before accessing this form.',
        },
      },
      {
        name: 'required_access',
        type: 'text',
        label: 'Required Access Slug',
        admin: {
          position: 'sidebar',
          description:
            'Optional. When set, only users whose access role includes this slug (with read permission) may view the form.',
          condition: (data) => data?.requires_auth === true,
        },
      },
      {
        name: 'enable_workflow',
        type: 'checkbox',
        defaultValue: false,
        label: 'Enable Workflow?',
        admin: {
          position: 'sidebar',
          description: 'If enabled, form submissions will trigger a workflow approval process.',
        },
      },
      {
        name: 'use_workflow_v2',
        type: 'checkbox',
        defaultValue: false,
        label: 'Use Workflow V2?',
        admin: {
          position: 'sidebar',
          description:
            'If enabled, uses the new Workflow V2 engine (workflow-instances) instead of the legacy inline workflow.',
          condition: (data) => data?.enable_workflow === true,
        },
      },
      {
        name: 'workflow_slug',
        type: 'text',
        label: 'Workflow Slug',
        admin: {
          position: 'sidebar',
          description: 'The slug of the workflow to use for form submissions.',
          condition: (data) => data?.enable_workflow === true,
        },
      },
      {
        name: 'enable_form_status',
        type: 'checkbox',
        defaultValue: false,
        label: 'Enable Form Status?',
        admin: {
          position: 'sidebar',
          description: 'If enabled, allows setting a status for each submission.',
        },
      },
      {
        name: 'enable_public_submission_link',
        type: 'checkbox',
        defaultValue: false,
        label: 'Enable Public Submission Link?',
        admin: {
          position: 'sidebar',
          description: 'If enabled, allows viewing a submission via a public link.',
        },
      },
      {
        name: 'show_no_input_fields',
        type: 'checkbox',
        defaultValue: false,
        label: 'Show No Input Fields?',
        admin: {
          position: 'sidebar',
          description:
            'If enabled, non-input content (messages, images, etc.) will also be shown in the read-only submission view.',
          condition: (data) => data?.enable_public_submission_link === true,
        },
      },
      {
        name: 'form_statuses',
        type: 'array',
        label: 'Form Statuses',
        admin: {
          condition: (data) => data?.enable_form_status === true,
          position: 'sidebar',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            required: true,
          },
          {
            name: 'value',
            type: 'text',
            required: true,
          },
          {
            name: 'is_default',
            type: 'checkbox',
            label: 'Default Status',
            defaultValue: false,
          },
        ],
      },
      {
        name: 'activeFrom',
        type: 'date',
        label: 'Active From',
        admin: {
          position: 'sidebar',
          date: {
            pickerAppearance: 'dayAndTime',
          },
        },
      },
      {
        name: 'activeTo',
        type: 'date',
        label: 'Active To',
        admin: {
          position: 'sidebar',
          date: {
            pickerAppearance: 'dayAndTime',
          },
        },
      },
      CreatedByField,
      UpdatedByField,
      ...Slug(true, { watchPath: 'title' }),
      {
        name: 'qr_png',
        type: 'upload',
        relationTo: 'forms-media',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'qr_svg',
        type: 'upload',
        relationTo: 'forms-media',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        type: 'ui',
        name: 'generate_qr_button',
        admin: {
          components: {
            Field: {
              path: '@/collections/forms/components/GenerateQRButton',
            },
          },
          position: 'sidebar',
        },
      },
    ]
  },
  hooks: {
    beforeValidate: [setOperatorSlugCollection('slug'), validateSurveyDepartment],
    beforeChange: [
      validateMultiStepConstraint,
      assignSurveyCode,
      setUserCreatedOrUpdatedByCollection,
    ],
    afterChange: [revalidateFormAfterChange, auditLogAfterChange(SLUG)],
    beforeDelete: [deleteQRCode],
    afterDelete: [revalidateFormAfterDelete, auditLogAfterDelete(SLUG)],
  },
  access: {
    admin: accessCheckResolver(SLUG, 'admin', {
      fallbackAccess: false,
    }) as AccessAdmin,
    read: accessCheckResolver(SLUG, 'read', {
      fallbackAccess: false,
    }),
    create: accessCheckResolver(SLUG, 'create', {
      fallbackAccess: false,
    }),
    update: accessCheckResolver(SLUG, 'update', {
      fallbackAccess: false,
    }),
    delete: accessCheckResolver(SLUG, 'delete', {
      fallbackAccess: false,
    }),
  },
}
