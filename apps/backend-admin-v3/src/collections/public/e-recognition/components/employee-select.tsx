'use client'
import React, { useEffect, useState } from 'react'
import { useField, SelectInput } from '@payloadcms/ui'
import { OasysH2AEmployeeData } from '@/services/h2a-oasys/types'
import { fetchEmployeesAction } from './actions'

type EmployeeOption = {
  label: string
  value: string
}

const EmployeeSelectField = ({ path }: { path: string }) => {
  const { value, setValue } = useField<string>({ path })
  const [options, setOptions] = useState<EmployeeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        setError(null)

        const employees = await fetchEmployeesAction()

        if (employees.length > 0) {
          const employeeMap = new Map<string, EmployeeOption>()

          for (const emp of employees) {
            const email = emp['COMPANY EMAIL'] as string
            const name = emp.NAME as string
            const department = emp['Sub Department'] as string

            if (email && name) {
              if (!employeeMap.has(email)) {
                employeeMap.set(email, {
                  label: `${name} | ${email} | ${department || 'N/A'}`,
                  value: email,
                })
              }
            }
          }

          const employeeOptions: EmployeeOption[] = Array.from(employeeMap.values()).sort((a, b) =>
            a.label.localeCompare(b.label),
          )
          setOptions(employeeOptions)
        } else {
          throw new Error('No employee data found')
        }
      } catch (err) {
        console.error('Error fetching employees:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  if (error) {
    return (
      <div className="field-type">
        <label className="field-label">Employee</label>
        <div style={{ color: 'red', padding: '8px' }}>Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="field-type">
      <SelectInput
        path={path}
        name={path}
        label="Employee"
        required={false}
        options={options}
        value={value}
        onChange={(selectedOption: any) => {
          const newValue = selectedOption?.value || ''
          setValue(newValue)
        }}
        isClearable
      />
      {loading && <div style={{ fontSize: '12px', color: '#666' }}>Loading employees...</div>}
    </div>
  )
}

export default EmployeeSelectField
