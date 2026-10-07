import React from 'react'
import { StaffVoiceForm } from './staff-voice-form'
import { getTripSchedulingPublicSettings } from '@/utilities/trip-scheduling-public-settings'

export const dynamic = 'force-dynamic'

export default async function StaffVoicePage() {
  const { generalBackground } = await getTripSchedulingPublicSettings()

  return (
    <main
      className="min-h-screen py-12 xl:py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(20, 52, 34, 0.55), rgba(20, 52, 34, 0.75)), ${generalBackground}`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-2xl xl:max-w-4xl relative z-10">
        <StaffVoiceForm />
      </div>
    </main>
  )
}
