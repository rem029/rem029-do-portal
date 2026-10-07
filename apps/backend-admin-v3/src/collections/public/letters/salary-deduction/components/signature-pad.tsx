'use client'
import React, { useRef, useEffect } from 'react'
import { useField, FieldLabel, Button } from '@payloadcms/ui'
import SignatureCanvas from 'react-signature-canvas'

const RequestorSignaturePad: React.FC = () => {
  const { value: signature, setValue: setSignature } = useField<string>({
    path: 'requestor_signature',
  })
  const { value: wantsToSign } = useField<boolean>({ path: 'wants_to_sign' })
  const { value: workflowStatus } = useField<string>({ path: '_workflow_status' })

  const sigCanvas = useRef<SignatureCanvas>(null)

  // Only allow signing if it's a draft or new document
  const canEdit = !workflowStatus || workflowStatus === 'draft'

  useEffect(() => {
    if (signature && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(signature)
    }
  }, [signature])

  const clearSignature = () => {
    sigCanvas.current?.clear()
    setSignature('')
  }

  const saveSignature = () => {
    if (sigCanvas.current) {
      setSignature(sigCanvas.current.toDataURL('image/png'))
    }
  }

  if (!wantsToSign) return null

  return (
    <div className="field-type ui">
      <FieldLabel label="Your Signature" />
      {canEdit ? (
        <div>
          <div className="border border-[var(--theme-elevation-200)] rounded bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ className: 'sigCanvas w-full h-[150px] block' }}
              onEnd={saveSignature}
            />
          </div>
          <div className="m-0 p-0 text-right">
            <Button
              className="py-0 my-2"
              buttonStyle="secondary"
              size="small"
              onClick={(e) => {
                e.preventDefault()
                clearSignature()
              }}
            >
              Clear Signature
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {signature ? (
            <div className="p-2 border border-[var(--theme-elevation-150)] rounded bg-white inline-block">
              <img src={signature} alt="Signature" className="max-h-[100px] w-auto" />
            </div>
          ) : (
            <div className="italic text-[var(--theme-elevation-400)]">No signature provided</div>
          )}
        </div>
      )}
    </div>
  )
}

export default RequestorSignaturePad
