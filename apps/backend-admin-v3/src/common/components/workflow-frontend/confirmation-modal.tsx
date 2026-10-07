'use client'
import React from 'react'
import { noah } from '@/utilities/fonts'
import { cn } from '@/utilities/cn'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'error'
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Submit',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  if (!isOpen) return null

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className={cn('font-bold text-lg', noah.className)}>{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <button type="button" className={cn('btn btn-ghost', noah.className)} onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={cn(
              'btn px-8',
              variant === 'primary' ? 'btn-primary' : 'btn-error',
              noah.className,
            )}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
  )
}

export default ConfirmationModal
