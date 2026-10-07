import type { Field } from 'payload'
import getFields from './index'

export const getThemeFields = (): Field[] =>
  getFields([
    {
      type: 'image',
      override: {
        label: 'Font primary',
        name: 'font_primary',
        relationTo: 'menu-media',
      },
    },
    {
      type: 'image',
      override: {
        label: 'Font secondary',
        name: 'font_secondary',
        relationTo: 'menu-media',
      },
    },
    {
      type: 'colors',
      override: { label: 'Primary', name: 'primary' },
    },
    {
      type: 'colors',
      override: { label: 'Primary Contrast', name: 'primary_contrast', defaultValue: '#ffffff' },
    },
    {
      type: 'colors',
      override: { label: 'Background', name: 'bg', defaultValue: '#ffffff' },
    },
    {
      type: 'colors',
      override: { label: 'Background Card', name: 'bg_card', defaultValue: '#ffffff' },
    },
    {
      type: 'colors',
      override: { label: 'Text', name: 'text' },
    },
    {
      type: 'colors',
      override: { label: 'Neutral', name: 'neutral' },
    },
  ])
