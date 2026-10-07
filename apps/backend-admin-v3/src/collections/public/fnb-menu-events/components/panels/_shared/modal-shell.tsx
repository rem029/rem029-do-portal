'use client'

import React, { useCallback } from 'react'
import { Modal, useModal } from '@payloadcms/ui'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

export interface ModalShellProps {
  slug: string
  title: string
  subtitle?: React.ReactNode
  onClose?: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  className?: string
}

export const ModalShell: React.FC<ModalShellProps> = ({
  slug,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-[480px]',
  className,
}) => {
  const { closeModal } = useModal()

  const handleClose = useCallback(() => {
    closeModal(slug)
    onClose?.()
  }, [closeModal, onClose, slug])

  return (
    <Modal
      slug={slug}
      onClose={onClose}
      className={cn('fixed inset-0 flex items-center justify-center p-4 z-50', className)}
    >
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full bg-(--theme-elevation-50) text-(--theme-elevation-800) border border-(--theme-elevation-150) p-6 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh] z-10 flex flex-col',
          maxWidth,
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6 shrink-0 gap-4">
          <div className="min-w-0">
            <h3 className={cn('font-bold text-xl m-0 truncate', noah.className)}>{title}</h3>
            {subtitle && (
              <p className="text-xs text-(--theme-elevation-500) mt-1 m-0">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-(--theme-elevation-150) transition-all duration-200 border-none bg-transparent cursor-pointer text-(--theme-elevation-400) hover:text-(--theme-elevation-800) shrink-0"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col gap-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-8 pt-4 border-t border-(--theme-elevation-100) shrink-0">
            {footer}
          </div>
        )}
      </div>
    </Modal>
  )
}

export const ModalFooter: React.FC<{
  children: React.ReactNode
}> = ({ children }) => (
  <div className="flex justify-end gap-2 w-full">{children}</div>
)

export default ModalShell
