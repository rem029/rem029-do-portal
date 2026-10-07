'use client'

import React, { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { useField, Button, FieldLabel } from '@payloadcms/ui'
import { cn } from '@/utilities/cn'
import { trimCanvas } from '@/utilities/canvas'

/**
 * SignaturePad – used for both signature_group.signature_base64 and
 * initials_group.signature_base64.
 *
 * Reads its sibling `type` field to switch between draw / upload modes.
 * Includes an inline preview so it doesn't rely on cross-field subscriptions.
 */
export const SignaturePad: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  // Sibling type field: "signature_group.signature_base64" → "signature_group.type"
  const typePath = path.replace(/\.[^.]+$/, '.type')
  const { value: inputType } = useField<string>({ path: typePath })

  const sigCanvas = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDirty, setIsDirty] = useState(false)
  // Local preview state — updated immediately when we commit so the UI reacts
  const [preview, setPreview] = useState<string>(value || '')

  const isDraw = !inputType || inputType === 'draw'

  // Keep local preview in sync with saved value (e.g. on first load)
  useEffect(() => {
    setPreview(value || '')
  }, [value])

  // Commit canvas → field AND update local preview
  const saveSignature = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const canvas = sigCanvas.current.getCanvas()
      const trimmedCanvas = trimCanvas(canvas)
      const dataUrl = trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : canvas.toDataURL('image/png')
      
      setValue(dataUrl)
      setPreview(dataUrl)
    }
    setIsDirty(false)
  }

  const clear = (e: React.MouseEvent) => {
    e.preventDefault()
    sigCanvas.current?.clear()
    setValue('')
    setPreview('')
    setIsDirty(false)
  }

  // Track dirty state per stroke (auto-save disabled — explicit button only)
  const handleStrokeEnd = () => {
    setIsDirty(true)
  }

  // Convert uploaded image → base64 and update both field + preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        setValue(dataUrl)
        setPreview(dataUrl)
        // Load into canvas for visual confirmation
        if (sigCanvas.current) {
          sigCanvas.current.fromDataURL(dataUrl)
        }
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Restore canvas from saved value on mount / mode switch
  useEffect(() => {
    if (isDraw && value && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(value)
    }
  }, [isDraw, value])

  return (
    <div className="mb-6 field-type ui">
      {isDraw ? (
        <>
          {/* Canvas */}
          <div
            className={cn(
              'rounded bg-white overflow-hidden w-full transition-[border-color] duration-200 border',
              isDirty ? 'border-(--theme-primary-500)' : 'border-(--theme-elevation-200)',
            )}
          >
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              backgroundColor="rgba(0,0,0,0)"
              canvasProps={{
                className: 'sigCanvas w-full h-[160px] block cursor-crosshair',
              }}
              onEnd={handleStrokeEnd}
            />
          </div>

          {isDirty && (
            <p className="text-[0.72rem] text-(--theme-primary-500) mt-1 m-0 italic">
              Draw complete — click &ldquo;Update Signature&rdquo; to save preview.
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <Button
              onClick={saveSignature}
              size="small"
              buttonStyle={isDirty ? 'primary' : 'secondary'}
            >
              Update Signature
            </Button>
            <Button onClick={clear} size="small" buttonStyle="secondary">
              Clear
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Upload mode */}
          <Button
            onClick={(e) => {
              e.preventDefault()
              fileInputRef.current?.click()
            }}
            size="small"
            buttonStyle="secondary"
          >
            Upload Image
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </>
      )}

      {/* ── Inline Preview ── */}
      <div className="mt-4 flex flex-col gap-3">
        <FieldLabel label="Signature Preview" />
        {preview ? (
          <div className="border border-(--theme-elevation-150) aspect-16/4 h-auto w-full max-w-sm rounded p-2 bg-white inline-block my-auto">
            <img src={preview} alt="Signature preview" className="h-auto w-full  block" />
          </div>
        ) : (
          <p className="text-sm text-(--theme-elevation-400) italic m-0">No signature saved yet.</p>
        )}
        {preview && (
          <div className="mt-1.5">
            <Button
              onClick={(e) => {
                e.preventDefault()
                sigCanvas.current?.clear()
                setValue('')
                setPreview('')
                setIsDirty(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              size="small"
              buttonStyle="secondary"
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
