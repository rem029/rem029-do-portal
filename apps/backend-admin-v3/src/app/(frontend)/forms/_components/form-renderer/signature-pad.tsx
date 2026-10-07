'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { trimCanvas } from '@/utilities/canvas'

export const SignaturePadInput: React.FC<{
  fieldName: string
  value: string
  onChange: (name: string, value: string) => void
  disabled: boolean
  isRequired: boolean
}> = ({ fieldName, value, onChange, disabled, isRequired }) => {
  const sigCanvas = useRef<SignatureCanvas>(null)

  const restoreSignature = useCallback(() => {
    if (value && sigCanvas.current) {
      sigCanvas.current.clear()
      sigCanvas.current.fromDataURL(value)
    }
  }, [value])

  useEffect(() => {
    if (value && sigCanvas.current && sigCanvas.current.isEmpty()) {
      restoreSignature()
    }
  }, [value, restoreSignature])

  useEffect(() => {
    const handleResize = () => {
      // Mobile browsers often trigger resize on scroll due to address bar toggling.
      // We restore the signature to ensure it doesn't disappear.
      if (value) {
        setTimeout(restoreSignature, 100)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [value, restoreSignature])

  const handleEnd = useCallback(() => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas()
      const trimmed = trimCanvas(canvas)
      const dataUrl = trimmed ? trimmed.toDataURL('image/png') : canvas.toDataURL('image/png')
      onChange(fieldName, dataUrl)
    }
  }, [fieldName, onChange])

  const handleClear = useCallback(() => {
    sigCanvas.current?.clear()
    onChange(fieldName, '')
  }, [fieldName, onChange])

  return (
    <div className="flex flex-col gap-3">
      <div className="border border-base-300 rounded-lg bg-white overflow-hidden hover:border-primary transition-colors">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          backgroundColor="rgba(0,0,0,0)"
          clearOnResize={false}
          canvasProps={{
            className: 'sigCanvas w-full h-[150px] cursor-crosshair block',
          }}
          onEnd={handleEnd}
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="btn btn-xs btn-ghost text-primary hover:bg-primary/5"
        >
          Clear Signature
        </button>
        {isRequired && !value && (
          <span className="text-xs text-error font-medium flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Signature required
          </span>
        )}
      </div>
    </div>
  )
}
