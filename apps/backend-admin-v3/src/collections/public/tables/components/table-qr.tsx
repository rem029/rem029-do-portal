'use client'
import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useTableQr } from './use-table-qr'

const TableQR: React.FC = () => {
  const { id } = useDocumentInfo()
  const { dataUrl, orderingUrl, loading } = useTableQr(id)

  if (!id) return null

  return (
    <div className="field-type ui mb-6">
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-(--theme-elevation-400) uppercase tracking-wider">
          Table QR Code
        </span>
        {loading && (
          <p className="text-[13px] text-(--theme-elevation-400)">Generating QR code...</p>
        )}
        {!loading && dataUrl && (
          <div className="flex flex-col items-start gap-2">
            <img src={dataUrl} alt="Table ordering QR code" width={160} height={160} />
            <p className="text-[11px] text-(--theme-elevation-400) break-all">{orderingUrl}</p>
            <a
              href={dataUrl}
              download="table-qr.png"
              className="btn btn--style-secondary btn--size-small"
            >
              Download PNG
            </a>
          </div>
        )}
        {!loading && !dataUrl && (
          <p className="text-[11px] text-(--theme-elevation-400) italic">
            No ordering-enabled menu page found for this table&apos;s restaurant yet.
          </p>
        )}
      </div>
    </div>
  )
}

export default TableQR
