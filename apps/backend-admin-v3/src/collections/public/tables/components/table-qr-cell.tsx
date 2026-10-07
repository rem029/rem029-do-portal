'use client'
import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { useTableQr } from './use-table-qr'

const TableQrCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const id = rowData?.id as string | undefined
  const { dataUrl, loading } = useTableQr(id, { width: 96 })

  if (!id) return null

  if (loading) {
    return <span className="text-[11px] text-(--theme-elevation-400)">Loading...</span>
  }

  if (!dataUrl) {
    return <span className="text-[11px] text-(--theme-elevation-400) italic">No QR</span>
  }

  return (
    <div
      className="flex flex-col items-start gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <img src={dataUrl} alt="Table ordering QR code" width={40} height={40} className="rounded" />
      <a
        href={dataUrl}
        download="table-qr.png"
        className="text-[11px] underline text-(--theme-elevation-600)"
      >
        Download
      </a>
    </div>
  )
}

export default TableQrCell
