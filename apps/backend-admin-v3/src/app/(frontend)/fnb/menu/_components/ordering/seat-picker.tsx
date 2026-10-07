'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/utilities/cn'
import { IoClose } from 'react-icons/io5'
import Modal from '@/app/(frontend)/fnb/menu/_components/modal'
import { useCartStore } from '@/app/(frontend)/fnb/menu/_store/cart-store'
import { getTableAction } from '@/app/(frontend)/fnb/menu/_actions/orders'
import { Language, t } from '@/utilities/translations'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'

interface SeatPickerProps {
  isOpen: boolean
  onClose: () => void
}

const SeatPicker = ({ isOpen, onClose }: SeatPickerProps) => {
  const { selectedLanguage } = useMenuNav()
  const lang = (selectedLanguage || 'en') as Language
  const tableId = useCartStore((state) => state.tableId)
  const setSeatNumber = useCartStore((state) => state.setSeatNumber)
  const [seatCount, setSeatCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !tableId) return

    setLoading(true)
    getTableAction(tableId).then((result) => {
      if (result.success && result.data) {
        setSeatCount(result.data.seat_count || 0)
      }
      setLoading(false)
    })
  }, [isOpen, tableId])

  const handleSelect = (seat: number) => {
    setSeatNumber(seat)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClick={onClose} className="bg-menu-background-card">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-menu-background-card text-menu-text">
        <div className="flex flex-row items-center justify-between">
          <h6 className="text-menu-primary font-menu-primary text-lg font-bold menu-drawer-title">
            {t('Select your seat', lang)}
          </h6>
          <button
            type="button"
            aria-label={t('Close', lang)}
            className="cursor-pointer text-menu-primary"
            onClick={onClose}
          >
            <IoClose className="h-6 w-auto" />
          </button>
        </div>

        {loading && <p className="text-sm text-menu-neutral">{t('Loading seats...', lang)}</p>}

        {!loading && seatCount === 0 && (
          <p className="text-sm text-menu-neutral">
            {t('No seats available for this table.', lang)}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: seatCount }, (_, i) => i + 1).map((seat) => (
            <button
              key={seat}
              type="button"
              className={cn(
                'rounded-lg border-[0.5px] border-menu-primary',
                'py-3 px-2 text-sm font-bold font-menu-secondary text-menu-primary menu-option-button',
                'cursor-pointer',
              )}
              onClick={() => handleSelect(seat)}
            >
              {seat}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default SeatPicker
