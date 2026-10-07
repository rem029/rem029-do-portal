'use client'

import React, { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { useField, Button, FieldLabel } from '@payloadcms/ui'

const SignatureField: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const sigCanvas = useRef<SignatureCanvas>(null)

  const clear = () => {
    sigCanvas.current?.clear()
    setValue('')
  }

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      setValue(dataUrl)
    }
  }

  useEffect(() => {
    if (value && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(value)
    }
  }, [value])

  return (
    <div>
      <FieldLabel label="Signature" />
      <div
        style={{
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
          background: 'var(--theme-elevation-0)',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
        }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width: 500,
            height: 200,
            className: 'sigCanvas',
            style: { width: '100%', height: '200px', display: 'block' },
          }}
          onEnd={save}
        />
      </div>
      <div style={{ marginTop: '8px' }}>
        <Button onClick={clear} size="small" buttonStyle="secondary">
          Clear Signature
        </Button>
      </div>
    </div>
  )
}

export default SignatureField
