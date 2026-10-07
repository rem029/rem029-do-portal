import { describe, expect, it } from 'vitest'
import {
  collectFormEmailFields,
  normalizeSubmissionFieldPath,
  resolveSubmissionEmailFieldValues,
} from '@/utilities/form-email-fields'

describe('form email field utilities', () => {
  it('collects top-level, grouped, conditional, and list email fields using stable paths', () => {
    const fields = [
      {
        blockType: 'email',
        name: 'email',
        label: 'Email',
      },
      {
        blockType: 'group',
        name: 'requestor',
        label: 'Requestor',
        fields: [
          {
            blockType: 'email',
            name: 'manager_email',
            label: 'Manager Email',
          },
        ],
      },
      {
        blockType: 'conditional',
        name: 'conditional_contact',
        label: 'Conditional Contact',
        fields: [
          {
            blockType: 'email',
            name: 'backup_email',
            label: 'Backup Email',
          },
        ],
      },
      {
        blockType: 'list',
        name: 'contacts',
        label: 'Contacts',
        fields: [
          {
            blockType: 'email',
            name: 'contact_email',
            label: 'Contact Email',
          },
        ],
      },
    ]

    expect(collectFormEmailFields(fields)).toEqual([
      {
        path: 'email',
        label: 'Email',
        sourceLabel: 'Email',
        isListField: false,
      },
      {
        path: 'requestor.manager_email',
        label: 'Manager Email',
        sourceLabel: 'Requestor → Manager Email',
        isListField: false,
      },
      {
        path: 'conditional_contact.backup_email',
        label: 'Backup Email',
        sourceLabel: 'Conditional Contact → Backup Email',
        isListField: false,
      },
      {
        path: 'contacts.contact_email',
        label: 'Contact Email',
        sourceLabel: 'Contacts → Contact Email',
        isListField: true,
      },
    ])
  })

  it('normalizes repeatable submission paths and resolves only valid email values', () => {
    const submissionData = [
      { field: 'email', value: ' submitter@example.com ' },
      { field: 'requestor.manager_email', value: 'manager@example.com' },
      { field: 'contacts.0.contact_email', value: 'first@example.com' },
      { field: 'contacts.1.contact_email', value: 'second@example.com' },
      { field: 'contacts.2.contact_email', value: 'invalid-email' },
      { field: 'contacts.3.contact_email', value: '' },
    ]

    expect(normalizeSubmissionFieldPath('contacts.0.contact_email')).toBe('contacts.contact_email')
    expect(resolveSubmissionEmailFieldValues(submissionData, 'email')).toEqual([
      'submitter@example.com',
    ])
    expect(resolveSubmissionEmailFieldValues(submissionData, 'requestor.manager_email')).toEqual([
      'manager@example.com',
    ])
    expect(resolveSubmissionEmailFieldValues(submissionData, 'contacts.contact_email')).toEqual([
      'first@example.com',
      'second@example.com',
    ])
  })
})
