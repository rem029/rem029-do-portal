// src/utilities/trip-scheduling/io/helpers.ts
export const formatForCSV = (dateISO: string | Date) => {
  if (!dateISO) return ''
  const d = new Date(dateISO)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export const escapeCSV = (value: any) => {
  const stringValue = value === null || value === undefined ? '' : String(value)
  return `"${stringValue.replace(/"/g, '""')}"`
}
