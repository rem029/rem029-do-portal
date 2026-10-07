import React from 'react'
import { TripSchedulingHeader } from './trip-scheduling-header'

interface TripSchedulingFormCardProps {
  title: string
  children: React.ReactNode
}

export const TripSchedulingFormCard: React.FC<TripSchedulingFormCardProps> = ({ title, children }) => (
  <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
    <TripSchedulingHeader title={title} className="py-8" />

    {children}
  </div>
)
