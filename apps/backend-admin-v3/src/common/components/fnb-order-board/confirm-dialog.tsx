'use client'

import React, { useCallback } from 'react'
import { Button, Modal, useModal } from '@payloadcms/ui'
import type { Order } from '@/payload-types'
import { OrderHeading, OrderNote, OrderItemsList, orderTotal } from './order-display'

export const CONFIRM_ORDER_MODAL_SLUG = 'fnb-order-confirm-modal'

export interface ConfirmDialogProps {
  order: Order | null
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  slug?: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  order,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  slug = CONFIRM_ORDER_MODAL_SLUG,
}) => {
  const { closeModal } = useModal()

  const handleCancel = useCallback(() => {
    closeModal(slug)
    onCancel()
  }, [closeModal, onCancel, slug])

  const handleConfirm = useCallback(() => {
    closeModal(slug)
    onConfirm()
  }, [closeModal, onConfirm, slug])

  return (
    <Modal slug={slug} className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[440px] bg-[var(--theme-elevation-50)] text-[var(--theme-elevation-800)] border-2 border-[var(--theme-elevation-1000)] p-5 rounded-lg shadow-[4px_4px_0px_0px_var(--theme-elevation-1000)] z-10 flex flex-col gap-4">
        {/* Header - same order identity block as the card (order #, table/seat, placed time, guest name) */}
        {order && (
          <div className="flex justify-between items-start gap-4">
            <OrderHeading order={order} />
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--theme-elevation-150)] transition-all duration-200 border-none bg-transparent cursor-pointer text-[var(--theme-elevation-400)] hover:text-[var(--theme-elevation-800)] shrink-0"
              onClick={handleCancel}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Same notes + item list as the card, so a mis-tap gets caught before it commits */}
        {order && (
          <div className="flex flex-col gap-3 pb-3 border-b border-[var(--theme-elevation-150)]">
            <OrderNote order={order} />
            <OrderItemsList order={order} />
            {order.show_prices !== false && (
              <p className="text-sm font-semibold m-0">QAR {orderTotal(order)}</p>
            )}
          </div>
        )}

        {/* Message */}
        <p className="text-sm font-medium text-[var(--theme-elevation-700)] m-0 leading-relaxed">
          {message}
        </p>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--theme-elevation-100)]">
          <Button buttonStyle="secondary" onClick={handleCancel} type="button">
            {cancelLabel}
          </Button>
          <Button buttonStyle="primary" onClick={handleConfirm} type="button">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
