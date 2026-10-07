'use client'

import { useRowLabel } from '@payloadcms/ui'

const ArrayRowLabel = () => {
  const { data, rowNumber } = useRowLabel<any>()

  const label =
    (data?.form_field_form_title && data?.form_field_label
      ? `${data.form_field_form_title} — ${data.form_field_label}`
      : data?.form_field_label) ||
    data?.label ||
    data?.name ||
    data?.field_name ||
    data?.email ||
    data?.type ||
    `Item ${String(rowNumber).padStart(2, '0')}`

  return <div>{label}</div>
}

export default ArrayRowLabel
