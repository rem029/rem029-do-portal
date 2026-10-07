'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import { getMenuItemAction } from './actions'

interface MenuItemData {
  id: string
  title?: string
  description?: string
  price?: number
  image?: {
    url?: string
    filename?: string
  } | string
  allergen?: { id: string; title?: string }[] | string[]
  availability_period?: string[]
}

interface FnbMenuItemPreviewProps {
  path: string
}

const FnbMenuItemPreview: React.FC<FnbMenuItemPreviewProps> = ({ path }) => {
  const { value: id } = useField<string>({ path: `${path}.item` })
  const { setValue: setTitle } = useField<string>({ path: `${path}._title` })
  const [item, setItem] = useState<MenuItemData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchItem = useCallback(async (itemId: string) => {
    if (!itemId) return
    setLoading(true)
    try {
      const result = await getMenuItemAction(itemId)
      if (result.success && result.data) {
        const data = result.data as MenuItemData
        setItem(data)
        if (data?.title) {
          setTitle(data.title)
        }
      }
    } catch (err) {
      console.error('Error fetching menu item preview:', err)
    } finally {
      setLoading(false)
    }
  }, [setTitle])

  useEffect(() => {
    if (id) {
      fetchItem(id)
    } else {
      setItem(null)
    }
  }, [id, fetchItem])

  if (loading) {
    return (
      <div style={{ padding: '8px', opacity: 0.5 }}>Loading preview...</div>
    )
  }

  if (!item) return null

  const imageUrl =
    typeof item.image === 'object' && item.image?.url ? item.image.url : null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: imageUrl ? '1fr 1fr' : '1fr',
        gap: '16px',
        width: '100%',
        padding: '8px 0',
      }}
    >
      {imageUrl && (
        <img
          style={{
            aspectRatio: '16/9',
            objectFit: 'cover',
            borderRadius: '8px',
            width: '100%',
          }}
          src={imageUrl}
          alt={item.title || 'Menu Item'}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', opacity: 0.75 }}>ID: {item.id}</span>
        <span style={{ fontWeight: 'bold' }}>{item.title}</span>
        <span style={{ fontSize: '14px', opacity: 0.75, flex: 1 }}>
          {item.description || 'No description'}
        </span>
        <span style={{ fontWeight: 'bold' }}>QR {item.price}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', opacity: 0.75, fontWeight: 'bold' }}>Allergens:</span>
        {item.allergen && Array.isArray(item.allergen) && item.allergen.length > 0 ? (
          item.allergen.map((a, idx) => {
            const allergenTitle = typeof a === 'object' ? a.title : a
            return (
              <span key={`allergen-${idx}`} style={{ fontSize: '12px', opacity: 0.75 }}>
                {allergenTitle}
              </span>
            )
          })
        ) : (
          <span style={{ fontSize: '12px', opacity: 0.75 }}>No allergens found</span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', opacity: 0.75, fontWeight: 'bold' }}>Availability:</span>
        <span style={{ fontSize: '12px', opacity: 0.75 }}>
          {item.availability_period?.join(', ') || 'N/A'}
        </span>
      </div>
    </div>
  )
}

export default FnbMenuItemPreview
