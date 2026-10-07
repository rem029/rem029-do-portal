import React from 'react'
import { Form, User } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { FormRenderer } from '../../_components/form-renderer'
import { FormAuthWrapper } from '@/common/components/form-auth-wrapper'
import { UserHeader } from '@/common/components/user-header'
import { RenderBlocks } from './render-blocks'

interface FormContentProps {
  form: Form
  user: User | null
  isAuthenticated: boolean
  isAuthorized: boolean
  initialData?: Array<{ field: string; value: string }>
  readOnly?: boolean
}

export const FormContent: React.FC<FormContentProps> = ({
  form,
  user,
  isAuthenticated,
  isAuthorized,
  initialData,
  readOnly,
}) => {
  const theme = form.theme || 'dohaoasis-new'

  const backgroundImage =
    form.background_image && typeof form.background_image === 'object'
      ? form.background_image.url || `/api/media/file/${form.background_image.filename}`
      : null

  // Activation Check
  const now = new Date()
  const isActive = form.isActive !== false
  const isStarted = !form.activeFrom || new Date(form.activeFrom) <= now
  const isEnded = form.activeTo && new Date(form.activeTo) < now

  if (!isActive || !isStarted || isEnded) {
    return (
      <div
        data-theme={theme}
        className={cn(
          'min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat',
          !backgroundImage && 'bg-white',
        )}
        style={
          backgroundImage
            ? { backgroundImage: `url(${backgroundImage})`, backgroundAttachment: 'fixed' }
            : {}
        }
      >
        <div className="card bg-base-100 shadow-2xl max-w-2xl w-full text-center p-8 border border-base-200">
          <div className="flex flex-col gap-6 items-center">
            <div className="bg-error/10 p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className={cn('text-xl md:text-lg font-normal text-primary', noah.className)}>
              Form Unavailable
            </h1>
            <div className="space-y-2">
              <p className={cn('text-base-content/70 leading-relaxed')}>
                {!isActive
                  ? 'This form has been deactivated by the administrator.'
                  : isEnded
                    ? 'This form has expired and is no longer accepting submissions.'
                    : 'This form is not yet active. Please check back later.'}
              </p>
              <p className={cn('text-sm text-base-content/50')}>
                If you believe this is an error, please try refreshing your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const customCss = (form as any).custom_css as string | undefined

  return (
    <FormAuthWrapper
      requiresAuth={!!form.requires_auth}
      isAuthenticated={isAuthenticated}
      isAuthorized={isAuthorized}
      theme={theme}
      hideBackground={true}
    >
      {customCss && <style>{customCss}</style>}
      {form.requires_auth && isAuthenticated && user && <UserHeader user={user} theme={theme} />}
      <div
        id="form-main-container"
        data-theme={theme}
        className={cn(
          'min-h-screen transition-colors duration-500 bg-cover bg-center bg-no-repeat w-full',
          !backgroundImage && !form.use_layout && 'bg-white',
          !form.use_layout && 'py-10 px-4 max-md:py-2 max-md:px-1',
        )}
        style={
          backgroundImage && !form.use_layout
            ? { backgroundImage: `url(${backgroundImage})`, backgroundAttachment: 'fixed' }
            : {}
        }
      >
        {form.use_layout ? (
          <RenderBlocks blocks={form?.layout || []} form={form} user={user} />
        ) : (
          <div className="container w-full max-w-2xl bg-white mx-auto overflow-hidden rounded-xl">
            <div className="w-full mx-auto text-center">
              {form.header_image && typeof form.header_image === 'object' && (
                <div className="overflow-hidden shadow-lg border border-base-200 aspect-video bg-white">
                  <img
                    src={form.header_image.url || `/api/media/file/${form.header_image.filename}`}
                    alt={form.header_image.alt || form.title}
                    className="w-full h-full aspect-video object-cover"
                  />
                </div>
              )}
              <h2
                className={cn('text-lg! md:text-lg font-bold text-primary p-4 m-0', noah.className)}
              >
                {form.title}
              </h2>
            </div>
            <div className={cn(backgroundImage && 'max-w-3xl mx-auto px-1 pb-2')}>
              <FormRenderer form={form} user={user} initialData={initialData} readOnly={readOnly} />
            </div>
          </div>
        )}
      </div>
    </FormAuthWrapper>
  )
}
