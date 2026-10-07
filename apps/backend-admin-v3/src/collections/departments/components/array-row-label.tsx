'use client'

import { useRowLabel } from '@payloadcms/ui'

const ArrayRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string }>()

  const customLabel = `${data?.name || `Item ${String(rowNumber).padStart(2, '0')}`}`

  return <div>{customLabel}</div>
}

export default ArrayRowLabel
