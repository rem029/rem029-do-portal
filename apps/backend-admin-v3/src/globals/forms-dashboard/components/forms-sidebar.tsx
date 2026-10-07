'use client'

import React from 'react'
import { FormOption } from './actions'

export interface FormsSidebarProps {
  open: boolean
  forms: FormOption[]
  loadingForms: boolean
  selectedFormId: string
  onSelect: (formId: string) => void
  onClose: () => void
}

export const FormsSidebar: React.FC<FormsSidebarProps> = ({
  open,
  forms,
  loadingForms,
  selectedFormId,
  onSelect,
  onClose,
}) => {
  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/25" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 bottom-0 w-[280px] z-51 bg-(--theme-elevation-0) border-l border-(--theme-elevation-150) shadow-[-8px_0_32px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden transition-transform duration-250 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-(--theme-elevation-150) flex justify-between items-center shrink-0">
          <span className="font-bold text-[11px] uppercase tracking-[0.08em] text-(--theme-elevation-500)">
            Forms
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-(--theme-elevation-500) text-base p-1 leading-none rounded"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingForms ? (
            <p className="p-4 text-xs text-(--theme-elevation-400)">Loading forms…</p>
          ) : forms.length === 0 ? (
            <p className="p-4 text-xs text-(--theme-elevation-400)">No accessible forms found.</p>
          ) : (
            forms.map((form) => (
              <button
                key={form.value}
                type="button"
                onClick={() => onSelect(form.value)}
                className={`block w-full text-left px-3 py-2.5 rounded-md border-none cursor-pointer text-[13px] transition-colors mb-0.5 ${
                  selectedFormId === form.value
                    ? 'bg-(--theme-elevation-150) font-bold text-(--theme-elevation-900)'
                    : 'bg-transparent font-normal text-(--theme-elevation-700) hover:bg-(--theme-elevation-100)'
                }`}
              >
                {form.label}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
