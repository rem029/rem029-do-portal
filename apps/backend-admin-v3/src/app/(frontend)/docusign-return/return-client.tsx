'use client'

import React, { useEffect, useState } from 'react'

export interface DocusignReturnClientProps {
  envelopeId?: string
  event?: string
  returnTo?: string
  flow?: string
}

export const DocusignReturnClient: React.FC<DocusignReturnClientProps> = ({
  envelopeId,
  event,
  returnTo,
  flow,
}) => {
  const [closing, setClosing] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const messageType =
      flow === 'signing' ? 'DOCUSIGN_SIGNING_COMPLETE' : 'DOCUSIGN_EMBEDDED_SENDING_COMPLETE'

    const message = {
      type: messageType,
      envelopeId,
      event,
    }

    // Wrap opener check and postMessage in try/catch (cross-origin opener access can throw)
    let hasOpener = false
    try {
      if (window.opener && !window.opener.closed) {
        hasOpener = true
        let targetOrigin = window.location.origin
        if (returnTo) {
          try {
            targetOrigin = new URL(returnTo).origin
          } catch {
            targetOrigin = window.location.origin
          }
        }
        window.opener.postMessage(message, targetOrigin)
        setClosing(true)
        const timer = setTimeout(() => {
          try {
            window.close()
          } catch {
            // ignore window.close restrictions
          }
        }, 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      hasOpener = false
    }

    if (!hasOpener && returnTo) {
      setRedirecting(true)
      const timer = setTimeout(() => {
        window.location.replace(returnTo)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [envelopeId, event, returnTo, flow])

  const getEventDetails = () => {
    const ev = (event || '').toLowerCase()

    if (flow === 'signing') {
      if (ev === 'signing_complete') {
        return {
          title: 'Signed — thank you',
          message: 'Your signature has been submitted successfully.',
          isSuccess: true,
        }
      }

      if (ev === 'decline') {
        return {
          title: 'Declined',
          message: 'You declined to sign this document.',
          isSuccess: false,
        }
      }

      if (ev === 'cancel') {
        return {
          title: 'Finish later — nothing was signed',
          message: 'You can return to sign this document at any time.',
          isSuccess: false,
        }
      }

      if (ev === 'viewing_complete') {
        return {
          title: 'Viewed',
          message: 'You have viewed this document.',
          isSuccess: true,
        }
      }

      if (ev === 'session_timeout' || ev === 'ttl_expired') {
        return {
          title: 'Session expired, please start again',
          message: 'Your signing session has expired. Please start again.',
          isSuccess: false,
        }
      }

      return {
        title: 'Signing session complete',
        message: 'You can check the envelope status from where you started.',
        isSuccess: true,
      }
    }

    if (ev === 'send') {
      return {
        title: 'Sent for signature',
        message: 'Your document was sent for signature.',
        isSuccess: true,
      }
    }

    if (ev === 'save') {
      return {
        title: 'Saved as draft',
        message: 'Your changes have been saved as a draft in DocuSign.',
        isSuccess: true,
      }
    }

    if (ev === 'cancel') {
      return {
        title: 'Cancelled — nothing was sent',
        message: 'The operation was cancelled. No documents were sent.',
        isSuccess: false,
      }
    }

    return {
      title: 'Back from DocuSign',
      message: 'You can check the envelope status from where you started.',
      isSuccess: true,
    }
  }

  const { title, message, isSuccess } = getEventDetails()

  const getSubMessage = () => {
    if (closing) {
      return 'Closing window…'
    }
    if (redirecting) {
      return 'Returning to SharePoint…'
    }
    return 'You can now close this window or return to the dashboard.'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isSuccess ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm text-slate-600 mb-4">{message}</p>
        <p className="text-xs text-slate-400 font-medium">{getSubMessage()}</p>
      </div>
    </div>
  )
}
