'use client'
import React from 'react'

interface AdminLabelProps {
  label: string
}

const AdminLabel: React.FC<AdminLabelProps> = ({ label }) => {
  return (
    <div className="field-type ui mb-6">
      <h2>{label}</h2>
    </div>
  )
}

export default AdminLabel
