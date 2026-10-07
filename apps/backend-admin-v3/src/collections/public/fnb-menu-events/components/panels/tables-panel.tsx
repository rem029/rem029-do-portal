'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@payloadcms/ui'
import { useTableQr } from '@/collections/public/tables/components/use-table-qr'
import { listTablesAction, type TableRow } from '../table-actions'
import { TableForm } from './_shared/table-form'
import {
  PanelSection,
  Row,
  RowTitle,
  RowMeta,
  RowAction,
  List,
  EmptyHint,
  LoadingHint,
  ErrorText,
  Note,
  sp,
} from './_shared/ui'

const TableQrPreview: React.FC<{ tableId: string; tableLabel: string; eventSlug?: string }> = ({
  tableId,
  tableLabel,
  eventSlug,
}) => {
  const { dataUrl, orderingUrl, loading, error } = useTableQr(tableId, { width: 160, eventSlug })
  // Once resolved via the event (see getTableOrderingUrlAction), the URL's path segment
  // is the event's own slug — only show the "wrong page" caveat when it fell back to the
  // restaurant's standalone menu page instead (no ordering-enabled event, or no eventSlug
  // to prefer in the first place).
  const pointsAtEvent = Boolean(
    eventSlug && orderingUrl && orderingUrl.includes(`/fnb/menu/${eventSlug}?`),
  )

  if (loading) {
    return <LoadingHint>Generating QR code…</LoadingHint>
  }

  if (error) {
    return <ErrorText>{error}</ErrorText>
  }

  if (!dataUrl) {
    return (
      <div style={{ padding: `${sp.xs} 0` }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--theme-elevation-500)',
            fontStyle: 'italic',
          }}
        >
          No ordering-enabled menu page found for this venue yet.
        </p>
      </div>
    )
  }

  const slugified = tableLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'table'
  const downloadFileName = `table-${slugified}-qr.png`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: sp.xs,
        padding: `${sp.xs} 0`,
        marginTop: sp.xs,
        borderTop: '1px dashed var(--theme-elevation-150)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.md }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR code for ${tableLabel}`}
          width={96}
          height={96}
          style={{
            width: 96,
            height: 96,
            borderRadius: 'var(--style-radius-s)',
            border: '1px solid var(--theme-elevation-150)',
            background: '#fff',
            padding: 4,
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.xs, minWidth: 0 }}>
          {orderingUrl && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--theme-elevation-500)',
                wordBreak: 'break-all',
              }}
            >
              {orderingUrl}
            </span>
          )}
          <div>
            <a
              href={dataUrl}
              download={downloadFileName}
              className="btn btn--style-secondary btn--size-small"
              style={{ display: 'inline-flex', textDecoration: 'none' }}
            >
              Download PNG
            </a>
          </div>
        </div>
      </div>
      {!pointsAtEvent && (
        <Note tone="attention">Points to this venue&apos;s main menu page, not this event.</Note>
      )}
    </div>
  )
}

export interface TablesPanelProps {
  eventId: string
  restaurantId: string
  eventSlug?: string
  refreshToken?: number
}

export const TablesPanel: React.FC<TablesPanelProps> = ({
  eventId,
  restaurantId,
  eventSlug,
  refreshToken,
}) => {
  const [rows, setRows] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [qrVisibleIds, setQrVisibleIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!eventId) {
      setRows([])
      return
    }

    let cancelled = false
    setLoading(true)
    setFetchError(null)

    listTablesAction(eventId)
      .then((res) => {
        if (cancelled) return
        if (res.success) setRows(res.data)
        else setFetchError(res.error)
      })
      .catch((err) => {
        if (cancelled) return
        setFetchError(err instanceof Error ? err.message : 'Failed to load tables.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, restaurantId, refreshToken])

  const handleCreateSuccess = useCallback((newTable: TableRow) => {
    setRows((prev) => [newTable, ...prev])
    setIsAdding(false)
  }, [])

  const allQrVisible = rows.length > 0 && rows.every((row) => qrVisibleIds.has(row.id))

  const toggleAllQr = useCallback(() => {
    setQrVisibleIds((prev) =>
      rows.length > 0 && rows.every((row) => prev.has(row.id))
        ? new Set()
        : new Set(rows.map((row) => row.id)),
    )
  }, [rows])

  const toggleRowQr = useCallback((tableId: string) => {
    setQrVisibleIds((prev) => {
      const next = new Set(prev)
      if (next.has(tableId)) next.delete(tableId)
      else next.add(tableId)
      return next
    })
  }, [])

  return (
    <PanelSection
      first
      title="Tables"
      count={rows.length}
      actions={
        <>
          {rows.length > 0 && (
            <Button buttonStyle="transparent" size="small" onClick={toggleAllQr}>
              {allQrVisible ? 'Hide all QR codes' : 'Show all QR codes'}
            </Button>
          )}
          <Button
            buttonStyle={isAdding ? 'secondary' : 'transparent'}
            size="small"
            icon={isAdding ? undefined : 'plus'}
            iconPosition="left"
            iconStyle="without-border"
            onClick={() => {
              setIsAdding((prev) => !prev)
              setEditingId(null)
            }}
          >
            {isAdding ? 'Cancel' : 'Add table'}
          </Button>
        </>
      }
    >
      {isAdding && (
        <TableForm
          eventId={eventId}
          mode="create"
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {fetchError && <ErrorText>{fetchError}</ErrorText>}

      {loading && rows.length === 0 ? (
        <LoadingHint>Loading tables…</LoadingHint>
      ) : rows.length === 0 ? (
        <EmptyHint>No tables yet for this venue. Add the first one above.</EmptyHint>
      ) : (
        <List>
          {rows.map((row) => {
            if (row.id === editingId) {
              return (
                <TableForm
                  key={row.id}
                  eventId={eventId}
                  mode="edit"
                  tableId={row.id}
                  initialValues={{
                    label: row.label,
                    seatCount: row.seatCount,
                  }}
                  onSuccess={(updatedTable) => {
                    setRows((prev) =>
                      prev.map((r) => (r.id === updatedTable.id ? updatedTable : r)),
                    )
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )
            }

            const isQrExpanded = qrVisibleIds.has(row.id)

            if (isQrExpanded) {
              return (
                <div
                  key={row.id}
                  className="event-menu-row"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: `calc(var(--base) * 0.4) calc(var(--base) * 0.75)`,
                    gap: sp.xs,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: sp.sm,
                      width: '100%',
                      minHeight: 36,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'baseline', gap: sp.sm, minWidth: 0 }}
                    >
                      <RowTitle>{row.label}</RowTitle>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
                      <RowMeta>
                        {row.seatCount} {row.seatCount === 1 ? 'seat' : 'seats'}
                      </RowMeta>
                      <Button
                        buttonStyle="transparent"
                        size="small"
                        onClick={() => toggleRowQr(row.id)}
                      >
                        Hide QR
                      </Button>
                      <RowAction
                        icon="edit"
                        label="Edit"
                        onClick={() => {
                          setEditingId(row.id)
                          setIsAdding(false)
                        }}
                      />
                    </div>
                  </div>
                  <TableQrPreview tableId={row.id} tableLabel={row.label} eventSlug={eventSlug} />
                </div>
              )
            }

            return (
              <Row
                key={row.id}
                trailing={
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
                    <RowMeta>
                      {row.seatCount} {row.seatCount === 1 ? 'seat' : 'seats'}
                    </RowMeta>
                    <Button
                      buttonStyle="transparent"
                      size="small"
                      onClick={() => toggleRowQr(row.id)}
                    >
                      View QR
                    </Button>
                    <RowAction
                      icon="edit"
                      label="Edit"
                      onClick={() => {
                        setEditingId(row.id)
                        setIsAdding(false)
                      }}
                    />
                  </div>
                }
              >
                <RowTitle>{row.label}</RowTitle>
              </Row>
            )
          })}
        </List>
      )}
    </PanelSection>
  )
}

export default TablesPanel
