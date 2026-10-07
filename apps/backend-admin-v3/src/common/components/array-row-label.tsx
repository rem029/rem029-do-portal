'use client'
import { useRowLabel } from '@payloadcms/ui'

const ArrayRowLabel = ({ path }: { path: string }) => {
  const { data, rowNumber } = useRowLabel<any>()
  return <div>{data?.[path] || `Item ${String(rowNumber).padStart(2, '0')}`}</div>
}

export default ArrayRowLabel
