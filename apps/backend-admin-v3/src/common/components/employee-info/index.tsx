'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'

interface EmployeeInfoProps {
  prefix?: string
}

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold text-[var(--theme-elevation-400)] uppercase">
        {label}
      </span>
      <span className="text-[14px] text-[var(--theme-elevation-800)]">{value}</span>
    </div>
  )
}

const EmployeeInfo: React.FC<EmployeeInfoProps> = ({ prefix = 'employee' }) => {
  const fields = useFormFields(([fields]) => {
    return {
      name: fields[`${prefix}_name`]?.value as string,
      h2a_id: (fields[`${prefix}_h2a_id`]?.value || fields[`${prefix}_id`]?.value) as string,
      designation: fields[`${prefix}_designation`]?.value as string,
      department: fields[`${prefix}_department_name`]?.value as string,
      operator: fields[`${prefix}_operator_name`]?.value as string,
      email: fields[`${prefix}_email`]?.value as string,
      doj: fields[`${prefix}_doj`]?.value as string,
    }
  })

  const hasData =
    fields.name ||
    fields.h2a_id ||
    fields.designation ||
    fields.department ||
    fields.operator ||
    fields.email ||
    fields.doj

  if (!hasData) {
    return null
  }

  return (
    <div className="p-5 bg-[var(--theme-elevation-50)] border border-[var(--theme-elevation-150)] rounded-md my-5">
      <h4 className="mb-4 text-base font-semibold text-[var(--theme-elevation-900)] border-b border-[var(--theme-elevation-150)] pb-2.5">
        Employee Information
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <InfoItem label="Full Name" value={fields.name} />
        <InfoItem label="Employee ID" value={fields.h2a_id} />
        <InfoItem label="Designation" value={fields.designation} />
        <InfoItem label="Department" value={fields.department} />
        <InfoItem label="Operator" value={fields.operator} />
        <InfoItem label="Email Address" value={fields.email} />
        <InfoItem
          label="Date of Joining"
          value={fields.doj ? new Date(fields.doj).toLocaleDateString() : undefined}
        />
      </div>
    </div>
  )
}

export default EmployeeInfo
