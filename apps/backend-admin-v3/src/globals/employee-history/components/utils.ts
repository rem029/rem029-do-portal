import React from 'react'

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const getCollectionLabel = (slug: string) => {
  const labels: Record<string, string> = {
    'salary-deduction': 'Salary Deduction',
    'hr-requests': 'HR Request',
    'business-justifications': 'Business Justification',
  }
  return labels[slug] || slug
}

export const getStatusStyle = (statusSlug: string) => {
  const status = statusSlug?.toLowerCase()
  if (status === 'completed') {
    return {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      backgroundColor: '#4ade80', // success
      color: '#000000',
      fontSize: '0.75rem',
      fontWeight: '600' as const,
    }
  }
  if (status === 'rejected') {
    return {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      backgroundColor: '#6d2e15', // error
      color: '#ffffff',
      fontSize: '0.75rem',
      fontWeight: '600' as const,
    }
  }
  return {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: '#bcccd3', // info
    color: '#000000',
    fontSize: '0.75rem',
    fontWeight: '600' as const,
  }
}
