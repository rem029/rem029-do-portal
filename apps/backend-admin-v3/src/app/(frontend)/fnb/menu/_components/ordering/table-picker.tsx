'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/utilities/cn'
import { IoClose } from 'react-icons/io5'
import Modal from '@/app/(frontend)/fnb/menu/_components/modal'
import { useCartStore } from '@/app/(frontend)/fnb/menu/_store/cart-store'
import { getTablesAction } from '@/app/(frontend)/fnb/menu/_actions/orders'
import { Table } from '@/payload-types'
import { Language, t } from '@/utilities/translations'
import useMenuNav from '@/app/(frontend)/fnb/menu/_hooks/useMenuNav'

interface TablePickerProps {
  restaurantId: string
  isOpen: boolean
  onClose: () => void
}

const TablePicker = ({ restaurantId, isOpen, onClose }: TablePickerProps) => {
  const { selectedLanguage } = useMenuNav()
  const lang = (selectedLanguage || 'en') as Language
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(false)
  const setTableId = useCartStore((state) => state.setTableId)

  useEffect(() => {
    if (!isOpen || !restaurantId) return

    setLoading(true)
    getTablesAction(restaurantId).then((result) => {
      if (result.success && result.data) {
        setTables(result.data as Table[])
      }
      setLoading(false)
    })
  }, [isOpen, restaurantId])

  const handleSelect = (tableId: string) => {
    setTableId(tableId)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClick={onClose} className="bg-menu-background-card">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-menu-background-card text-menu-text">
        <div className="flex flex-row items-center justify-between">
          <h6 className="text-menu-primary font-menu-primary text-lg font-bold menu-drawer-title">
            {t('Select your table', lang)}
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

        {loading && <p className="text-sm text-menu-neutral">{t('Loading tables...', lang)}</p>}

        {!loading && tables.length === 0 && (
          <p className="text-sm text-menu-neutral">{t('No tables available.', lang)}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {tables.map((table) => (
            <button
              key={table.id}
              type="button"
              className={cn(
                'rounded-lg border-[0.5px] border-menu-primary',
                'py-3 px-2 text-sm font-bold font-menu-secondary text-menu-primary menu-option-button',
                'cursor-pointer',
              )}
              onClick={() => handleSelect(table.id)}
            >
              {table.label}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default TablePicker
