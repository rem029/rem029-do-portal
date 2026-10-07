'use client'

import React, { useState } from 'react'
import { useAuth, Gutter } from '@payloadcms/ui'
import { User } from '@/payload-types'
import { triggerSeedAction } from './actions'

const SeedDashboard = () => {
  const { user } = useAuth<User>()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Only show for super users and in development
  if (!user?.super_user || process.env.NODE_ENV === 'production') {
    return null
  }

  const handleSeed = async () => {
    if (
      !confirm(
        'Are you sure you want to run the seeding process? This will add dummy data to your collections.',
      )
    ) {
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const response = await triggerSeedAction()
      setResult(response)
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="bg-(--theme-elevation-50) shadow-sm rounded-sm px-6 py-2 border border-(--theme-elevation-150)">
        <h3 className="text-xl font-bold mb-2 text-(--theme-elevation-800) m-0">
          🛠️ Development Seeding
        </h3>
        <p className="text-sm text-(--theme-elevation-500) mb-4">
          Quickly populate the database with FnB menus, restaurants, and dummy users for testing.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="btn! btn-sm! disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Seeding in progress...' : 'Run Full Seed'}
          </button>

          {result && (
            <div
              className={`text-sm font-medium ${result.success ? 'text-(--theme-success-500)' : 'text-(--theme-error-500)'}`}
            >
              {result.success ? '✅ ' : '❌ '} {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SeedDashboard
