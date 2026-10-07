'use client'

import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button, Modal, useModal } from '@payloadcms/ui'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { saveUserSettingsAction, type SaveUserSettingsData } from './actions'
import { trimCanvas } from '@/utilities/canvas'

interface UserSettingsModalProps {
  user: { id: string; email: string }
  initialData?: {
    signature_group?: { type?: 'draw' | 'upload'; signature_base64?: string | null } | null
    initials_group?: { type?: 'draw' | 'upload'; signature_base64?: string | null } | null
  }
}

export const modalSlug = 'user-settings-modal'

// ─── Reusable sub-component for one signature section ────────────────────────
interface SignatureSectionProps {
  label: string
  inputType: 'draw' | 'upload'
  onTypeChange: (type: 'draw' | 'upload') => void
  sigCanvasRef: React.RefObject<SignatureCanvas | null>
  base64Value: string | undefined
  onBase64Change: (value: string | undefined) => void
}

const SignatureSection: React.FC<SignatureSectionProps> = ({
  label,
  inputType,
  onTypeChange,
  sigCanvasRef,
  base64Value,
  onBase64Change,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    sigCanvasRef.current?.clear()
    onBase64Change(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onBase64Change(dataUrl)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex justify-between items-center">
        <label className="text-[10px] uppercase font-bold tracking-widest text-(--theme-elevation-400)">
          {label}
        </label>
        <button
          type="button"
          className="text-[10px] font-bold text-(--theme-error-500) hover:underline bg-transparent border-none p-0 cursor-pointer uppercase"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTypeChange('draw')}
          className={cn(
            'flex-1 text-[11px] font-semibold py-1.5 px-2 rounded border transition-all duration-150 cursor-pointer',
            inputType === 'draw'
              ? 'bg-(--theme-elevation-900) text-(--theme-elevation-0) border-(--theme-elevation-900)'
              : 'bg-transparent text-(--theme-elevation-500) border-(--theme-elevation-200) hover:border-(--theme-elevation-400)',
          )}
        >
          ✏️ Sign on Pad
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('upload')}
          className={cn(
            'flex-1 text-[11px] font-semibold py-1.5 px-2 rounded border transition-all duration-150 cursor-pointer',
            inputType === 'upload'
              ? 'bg-(--theme-elevation-900) text-(--theme-elevation-0) border-(--theme-elevation-900)'
              : 'bg-transparent text-(--theme-elevation-500) border-(--theme-elevation-200) hover:border-(--theme-elevation-400)',
          )}
        >
          🖼️ Upload Image
        </button>
      </div>

      {/* Pad or upload */}
      {inputType === 'draw' ? (
        <div className="border border-(--theme-elevation-200) rounded bg-white overflow-hidden shadow-inner">
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            backgroundColor="rgba(0,0,0,0)"
            canvasProps={{
              className: 'sigCanvas w-full h-[130px] block cursor-crosshair',
            }}
            onEnd={() => {
              const canvas = sigCanvasRef.current?.getCanvas()
              if (canvas) {
                const trimmedCanvas = trimCanvas(canvas)
                onBase64Change(
                  trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : canvas.toDataURL('image/png'),
                )
              }
            }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 text-[11px] font-semibold border border-dashed border-(--theme-elevation-300) rounded text-(--theme-elevation-500) hover:border-(--theme-elevation-500) hover:text-(--theme-elevation-700) transition-all duration-150 bg-transparent cursor-pointer"
          >
            Click to upload a signature image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          {base64Value && (
            <div className="border border-(--theme-elevation-150) rounded bg-(--theme-elevation-50) p-2 inline-block">
              <img src={base64Value} alt={`${label} preview`} className="max-h-[60px] w-auto" />
            </div>
          )}
        </div>
      )}

      {/* Preview below the pad */}
      {inputType === 'draw' && base64Value && (
        <div className="border border-(--theme-elevation-150) rounded bg-(--theme-elevation-50) p-2 inline-block">
          <img src={base64Value} alt={`${label} preview`} className="max-h-[60px] w-auto" />
        </div>
      )}
    </div>
  )
}

// ─── Main modal component ─────────────────────────────────────────────────────
export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ user, initialData }) => {
  const { isModalOpen, closeModal } = useModal()
  const isOpen = isModalOpen(modalSlug)
  const [isSaving, setIsSaving] = useState(false)

  // ── Full Signature state ──────────────────────────────────────────────────
  const [sigType, setSigType] = useState<'draw' | 'upload'>(
    initialData?.signature_group?.type || 'draw',
  )
  const [sigBase64, setSigBase64] = useState<string | undefined>(
    initialData?.signature_group?.signature_base64 || undefined,
  )
  const sigCanvas = useRef<SignatureCanvas>(null)

  // ── Initials state ────────────────────────────────────────────────────────
  const [initType, setInitType] = useState<'draw' | 'upload'>(
    initialData?.initials_group?.type || 'draw',
  )
  const [initBase64, setInitBase64] = useState<string | undefined>(
    initialData?.initials_group?.signature_base64 || undefined,
  )
  const initCanvas = useRef<SignatureCanvas>(null)

  // Restore canvas values when modal opens
  useEffect(() => {
    if (!isOpen) return
    setTimeout(() => {
      if (sigType === 'draw' && sigBase64 && sigCanvas.current?.isEmpty()) {
        sigCanvas.current.fromDataURL(sigBase64)
      }
      if (initType === 'draw' && initBase64 && initCanvas.current?.isEmpty()) {
        initCanvas.current.fromDataURL(initBase64)
      }
    }, 100)
  }, [isOpen])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Helper to get trimmed base64 from a canvas ref
      const getTrimmedBase64 = (
        ref: React.RefObject<SignatureCanvas | null>,
        fallback: string | undefined,
      ) => {
        const canvas = ref.current?.getCanvas()
        if (canvas) {
          const trimmed = trimCanvas(canvas)
          return trimmed ? trimmed.toDataURL('image/png') : canvas.toDataURL('image/png')
        }
        return fallback
      }

      const data: SaveUserSettingsData = {
        signature_group: {
          type: sigType,
          signature_base64: sigType === 'draw' ? getTrimmedBase64(sigCanvas, sigBase64) : sigBase64,
        },
        initials_group: {
          type: initType,
          signature_base64:
            initType === 'draw' ? getTrimmedBase64(initCanvas, initBase64) : initBase64,
        },
      }

      const result = await saveUserSettingsAction(user.id, data)
      if (result.success) {
        closeModal(modalSlug)
      } else {
        alert('Failed to save settings: ' + result.error)
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal slug={modalSlug} className="fixed inset-0 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => closeModal(modalSlug)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[640px] bg-(--theme-elevation-50) text-(--theme-elevation-800) border border-(--theme-elevation-150) p-6 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh] z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className={cn('font-bold text-xl m-0', noah.className)}>Account</h3>
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-(--theme-elevation-150) transition-all duration-200 border-none bg-transparent cursor-pointer text-(--theme-elevation-400) hover:text-(--theme-elevation-800)"
            onClick={() => closeModal(modalSlug)}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {/* User Info */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-(--theme-elevation-400) m-0">
              Signed in as
            </p>
            <p className="text-xs font-medium text-(--theme-elevation-600) m-0 truncate">
              {user.email}
            </p>
          </div>

          <hr className="border-t border-(--theme-elevation-100) m-0" />

          {/* Full Signature */}
          <SignatureSection
            label="Full Signature"
            inputType={sigType}
            onTypeChange={(t) => {
              setSigType(t)
              sigCanvas.current?.clear()
              setSigBase64(undefined)
            }}
            sigCanvasRef={sigCanvas}
            base64Value={sigBase64}
            onBase64Change={setSigBase64}
          />

          <hr className="border-t border-(--theme-elevation-100) m-0" />

          {/* Initials */}
          <SignatureSection
            label="Initials"
            inputType={initType}
            onTypeChange={(t) => {
              setInitType(t)
              initCanvas.current?.clear()
              setInitBase64(undefined)
            }}
            sigCanvasRef={initCanvas}
            base64Value={initBase64}
            onBase64Change={setInitBase64}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-(--theme-elevation-100)">
          <div className="flex gap-2 w-full">
            <Button
              buttonStyle="secondary"
              onClick={() => closeModal(modalSlug)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              buttonStyle="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Update'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
