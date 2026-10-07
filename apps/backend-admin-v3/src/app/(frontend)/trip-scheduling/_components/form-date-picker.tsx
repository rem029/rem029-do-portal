'use client'

import React from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'

interface FormDatePickerProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  className?: string
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <label className={cn('block text-xs font-bold text-slate-700 mb-1', noah.className)}>
        {label} {required && <span className="text-[#ED1C24]">*</span>}
      </label>
      <input
        type="date"
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        onClick={(e) => {
          try {
            ;(e.currentTarget as HTMLInputElement).showPicker?.()
          } catch (err) {}
        }}
        style={{ colorScheme: 'light' }}
        className={`w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white focus:border-[#DEC37D] transition-all cursor-pointer ${
          value ? 'text-slate-900' : 'text-slate-400'
        }`}
      />
    </div>
  )
}