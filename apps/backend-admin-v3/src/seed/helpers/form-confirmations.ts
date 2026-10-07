import type { Form } from '@/payload-types'

export const helloWorldConfirmation: NonNullable<Form['confirmationMessage']> = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal',
            text: 'Hello world',
            type: 'text',
            style: '',
            detail: 0,
            format: 0,
            version: 1,
          },
        ],
        direction: null,
        textStyle: '',
        textFormat: 0,
      },
    ],
    direction: null,
  },
}

export const thanksConfirmation: NonNullable<Form['confirmationMessage']> = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal',
            text: 'Thanks!',
            type: 'text',
            style: '',
            detail: 0,
            format: 0,
            version: 1,
          },
        ],
        direction: null,
        textStyle: '',
        textFormat: 0,
      },
    ],
    direction: null,
  },
}
