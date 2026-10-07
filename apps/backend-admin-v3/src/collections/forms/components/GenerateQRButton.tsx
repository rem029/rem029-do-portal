'use client'
import React, { useState } from 'react'
import { useDocumentInfo, Button, toast } from '@payloadcms/ui'
import { generateQRCodeAction } from './actions'

const GenerateQRButton: React.FC = () => {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!id) {
      toast.error('Save the document first before generating a QR code.')
      return
    }

    setLoading(true)
    try {
      const result = await generateQRCodeAction(id)
      if (result.success) {
        toast.success('QR Code generated/refreshed successfully.')
        // Usually, Payload UI will reflect field updates if the action updates the document.
        // However, a manual refresh might be needed if the sidebar doesn't update immediately.
        window.location.reload()
      } else {
        toast.error(`Failed to generate QR Code: ${result.error}`)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!id) {
    return (
      <div className="field-type ui mb-6">
        <p className="text-[11px] text-(--theme-elevation-400) italic">
          Please save the document to enable QR code generation.
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
            This will delete existing QR codes and generate new ones using the form slug as the filename.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GenerateQRButton
