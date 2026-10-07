'use client'
import React, { useState } from 'react'
import { useDocumentInfo, Button, toast } from '@payloadcms/ui'
import { generateEventQRCodeAction } from './actions'

const GenerateQRButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!id) {
      toast.error('Save the event first before generating a QR code.')
      return
    }

    setLoading(true)
    try {
      const result = await generateEventQRCodeAction(id)
      if (result.success) {
        toast.success('QR Code generated/refreshed successfully.')
        window.location.reload()
      } else {
        toast.error(`Failed to generate QR Code: ${result.error}`)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!id) {
    return (
      <div className="field-type ui mb-6">
        <p className="text-[11px] text-(--theme-elevation-400) italic">
          Save the event first before generating a QR code.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type ui mb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-semibold text-(--theme-elevation-400) uppercase tracking-wider">
          QR Code Management
        </span>
        <div className="mt-1">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="small"
            buttonStyle="secondary"
          >
            {loading ? 'Generating...' : 'Generate/Refresh QR Code'}
          </Button>
          <p className="text-[11px] text-(--theme-elevation-400) mt-2">
            Encodes the public event URL — …/fnb/menu/&lt;slug&gt;. Regenerating replaces the existing PNG/SVG.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GenerateQRButton
