'use client'

import { useRowLabel } from '@payloadcms/ui'

type ReviewRow = {
  label?: string
  response?: string
  iteration?: number
}

const ReviewRowLabel = () => {
  const { data, rowNumber } = useRowLabel<ReviewRow>()

  const stepLabel = data?.label || `Review ${String(rowNumber).padStart(2, '0')}`
  const response = data?.response
  const iteration = (data?.iteration ?? 1) > 1 ? ` (×${data?.iteration})` : ''

  const responseLabel = response && response !== 'pending' ? ` — ${response}` : ''

  return <div>{`${stepLabel}${iteration}${responseLabel}`}</div>
}

export default ReviewRowLabel
