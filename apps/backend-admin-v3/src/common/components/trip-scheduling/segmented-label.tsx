'use client'
import React from 'react'

const TripSchedulingSegmentedLabel = () => {
  return (
    <div
      style={{
        width: '100%',
        marginTop: '2.5rem', // Added extra air above to separate from previous section
        paddingBottom: '6px',
        borderBottom: '1px solid var(--theme-elevation-150)',
        marginBottom: '8px', // Reduced to bring fields closer
        color: 'var(--theme-elevation-800)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 700,
      }}
    >
      Pick-up Times (by Passenger Type)
    </div>
  )
}

export default TripSchedulingSegmentedLabel
