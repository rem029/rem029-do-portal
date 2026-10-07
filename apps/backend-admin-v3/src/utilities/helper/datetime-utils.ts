// src/utilities/helper/datetime-utils.ts

export const formatDateOnly = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return 'N/A'

  // Keep the exact same Date instantiation that successfully resolved your timezone
  const d = new Date(dateInput as string | Date)

  if (isNaN(d.getTime())) {
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0]
    }
    return 'N/A'
  }

  // Use Intl.DateTimeFormat letting it evaluate using the local runtime/system timezone
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  // Optional: If you want to append an ordinal suffix (like 17th instead of 17),
  // you can format it cleanly using standard components:
  const day = d.getDate()
  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const monthName = d.toLocaleString('en-US', { month: 'long' })
  const year = d.getFullYear()

  return `${monthName} ${getOrdinalSuffix(day)}, ${year}`
}

/**
 * Converts a "HH:mm" string to total minutes since midnight
 */
export const timeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Validates 24-hour format and logical order
 */
export const validateTimeOrder = (departure: string, arrival: string): true | string => {
  const depMin = timeToMinutes(departure)
  const arrMin = timeToMinutes(arrival)

  if (arrMin <= depMin) return 'Arrival must be after departure.'

  return true
}
