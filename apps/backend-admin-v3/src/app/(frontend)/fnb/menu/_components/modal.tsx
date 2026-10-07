'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/utilities/cn'

interface ModalProps {
  isOpen: boolean
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

const Modal = ({ isOpen, children, className, onClick }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
    } else {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  const handleClose = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <dialog ref={dialogRef} className={cn('modal modal-middle')} onClose={handleClose}>
      <div className={cn('modal-box p-0 max-w-md h-fit shadow-none overflow-visible', className)}>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}

export default Modal
