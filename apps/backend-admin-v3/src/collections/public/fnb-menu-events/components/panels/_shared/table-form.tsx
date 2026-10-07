'use client'

import React, { useState, useCallback } from 'react'
import { Button, TextInput } from '@payloadcms/ui'
import {
  createTableAction,
  updateTableAction,
  type TableRow,
} from '../../table-actions'
import { SubForm, FormActions, ErrorText, FieldRow, FieldRowItem } from './ui'

export interface TableFormProps {
  eventId: string
  mode: 'create' | 'edit'
  tableId?: string
  initialValues?: {
    label: string
    seatCount: number
  }
  onSuccess: (table: TableRow) => void
  onCancel: () => void
}

export const TableForm: React.FC<TableFormProps> = ({
  eventId,
  mode,
  tableId,
  initialValues,
  onSuccess,
  onCancel,
}) => {
  const [label, setLabel] = useState(initialValues?.label ?? '')
  const [seatCount, setSeatCount] = useState(
    initialValues?.seatCount !== undefined ? String(initialValues.seatCount) : '4',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) {
      setError('Table label is required.')
      return
    }

    const parsedSeats = parseInt(seatCount, 10)
    if (isNaN(parsedSeats) || parsedSeats < 1) {
      setError('Seat count must be a positive integer.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
        const res = await createTableAction(eventId, {
          label: trimmedLabel,
          seatCount: parsedSeats,
        })
        if (!res.success) {
          setError(res.error)
          return
        }
        onSuccess(res.data)
      } else {
        if (!tableId) {
          setError('Table ID is missing.')
          return
        }
        const res = await updateTableAction(eventId, {
          tableId,
          label: trimmedLabel,
          seatCount: parsedSeats,
        })
        if (!res.success) {
          setError(res.error)
          return
        }
        onSuccess(res.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }, [eventId, mode, tableId, label, seatCount, onSuccess])

  const fieldPrefix = mode === 'edit' && tableId ? `__editTable_${tableId}` : '__newTable'

  return (
    <SubForm heading={mode === 'edit' ? 'Edit table' : 'New table'}>
      <FieldRow>
        <FieldRowItem flexGrow={3} minWidth={220}>
          <TextInput
            path={`${fieldPrefix}Label`}
            label="Table Label"
            required
            value={label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLabel(e.target.value)
              setError(null)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!isSubmitting && label.trim() && seatCount.trim()) handleSubmit()
              }
            }}
            readOnly={isSubmitting}
            placeholder="e.g. Patio 3, Table 12"
          />
        </FieldRowItem>
        <FieldRowItem flexGrow={1} minWidth={110}>
          <TextInput
            path={`${fieldPrefix}SeatCount`}
            label="Seat Count"
            required
            value={seatCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value.replace(/[^0-9]/g, '')
              setSeatCount(val)
              setError(null)
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!isSubmitting && label.trim() && seatCount.trim()) handleSubmit()
              }
            }}
            readOnly={isSubmitting}
            placeholder="4"
          />
        </FieldRowItem>
      </FieldRow>

      {error && <ErrorText>{error}</ErrorText>}

      <FormActions>
        <Button buttonStyle="secondary" size="small" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          size="small"
          onClick={handleSubmit}
          disabled={isSubmitting || !label.trim() || !seatCount.trim()}
        >
          {isSubmitting
            ? mode === 'edit'
              ? 'Saving…'
              : 'Adding table…'
            : mode === 'edit'
              ? 'Save changes'
              : 'Add table'}
        </Button>
      </FormActions>
    </SubForm>
  )
}

export default TableForm
