'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth, useConfig } from '@payloadcms/ui'
import slugify from 'slugify'
import type { User } from '@/payload-types'
import {
  ensureMenuCategoryAction,
  ensureMenuAllergensAction,
  uploadMenuMediaAction,
  upsertMenuItemAction,
  updateMenuAction,
} from '../actions'

interface MenuItem {
  id: string
  sn: string
  name: string
  slug: string
  description: string
  price: string | number
  category: string
  imageFileName: string
  imageFile?: File
  imagePreview?: string
  allergens?: string
  lang?: {
    ar?: {
      name?: string
      description?: string
      category?: string
      allergens?: string
    }
  }
  status?: 'pending' | 'uploading' | 'success' | 'error'
  statusMessage?: string
  steps?: {
    image: 'pending' | 'processing' | 'success' | 'error'
    category: 'pending' | 'processing' | 'success' | 'error'
    allergens: 'pending' | 'processing' | 'success' | 'error'
    item: 'pending' | 'processing' | 'success' | 'error'
    menu: 'pending' | 'processing' | 'success' | 'error'
  }
}

interface Restaurant {
  id: string
  title: string
  slug?: string
  operator?: string | { id: string }
}

const StepIcon = ({ icon, status, title }: { icon: string; status?: string; title: string }) => {
  const getColor = () => {
    switch (status) {
      case 'success':
        return '#28a745'
      case 'error':
        return '#dc3545'
      case 'processing':
        return '#007bff'
      default:
        return '#ccc'
    }
  }
  return (
    <span
      title={`${title}: ${status}`}
      style={{
        opacity: status === 'pending' ? 0.4 : 1,
        color: getColor(),
        fontSize: '16px',
        display: 'inline-block',
        animation: status === 'processing' ? 'fnb-pulse 1.5s infinite' : 'none',
        filter: status === 'pending' ? 'grayscale(1)' : 'none',
      }}
    >
      {icon}
    </span>
  )
}

const FnbImportUI: React.FC = () => {
  const { user } = useAuth<User>()
  const { config } = useConfig()
  const serverURL = config?.serverURL || ''
  const basePath = config?.routes?.api || '/api'

  const [restaurantId, setRestaurantId] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [data, setData] = useState<MenuItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${serverURL}${basePath}/restaurants?limit=100&sort=title`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          setRestaurants(json.docs || [])
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err)
      }
    }
    fetchRestaurants()
  }, [serverURL, basePath])

  // Load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('fnbImportData')
    if (savedData) setData(JSON.parse(savedData))
    const savedRestaurant = localStorage.getItem('fnbImportRestaurantId')
    if (savedRestaurant) setRestaurantId(savedRestaurant)
  }, [])

  // Save to localStorage
  useEffect(() => {
    const dataToSave = data.map(({ imageFile, imagePreview, ...rest }) => rest)
    localStorage.setItem('fnbImportData', JSON.stringify(dataToSave))
  }, [data])

  // Parse Excel/CSV
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessing(true)

    try {
      const ExcelJS = (await import('exceljs')) as any
      const workbook = new ExcelJS.Workbook()
      const buffer = await file.arrayBuffer()
      console.log('File buffer loaded, size:', buffer.byteLength)
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.worksheets[0]
      console.log('Worksheet loaded:', worksheet.name)

      const items: MenuItem[] = []

      // Process rows (skipping header row 1)
      worksheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber <= 2) return

        const name = String(row.getCell(2).value || '')
        const slugValue = String(row.getCell(3).value || '').trim()
        const generatedSlug =
          slugValue || slugify(name, { lower: true, strict: true }) || `item-${rowNumber}`
        if (!slugValue)
          console.log(
            `Row ${rowNumber}: Auto-generated slug "${generatedSlug}" from name "${name}"`,
          )

        const item: MenuItem = {
          id: `row-${rowNumber}-${Date.now()}`,
          sn: String(row.getCell(1).value || ''),
          name: name,
          slug: generatedSlug,
          description: String(row.getCell(4).value || ''),
          price: Number(row.getCell(5).value) || 0,
          imageFileName: String(row.getCell(6).value || ''),
          category: String(row.getCell(7).value || ''),
          allergens: String(row.getCell(8).value || ''),
          lang: {
            ar: {
              name: String(row.getCell(10).value || ''),
              description: String(row.getCell(11).value || ''),
              category: String(row.getCell(12).value || ''),
              allergens: String(row.getCell(13).value || ''),
            },
          },
          steps: {
            image: 'pending',
            category: 'pending',
            allergens: 'pending',
            item: 'pending',
            menu: 'pending',
          },
        }
        items.push(item)
      })
      console.log(`Processed ${items.length} data rows`)

      // 1. Handle Floating Images (Standard)
      const images = worksheet.getImages()
      console.log(`Found ${images.length} floating images in worksheet`)
      const handledRows = new Set<number>()
      for (const img of images) {
        const imgData = workbook.model.media[img.imageId]
        if (!imgData) continue

        const rowIndex = img.range.tl.nativeRow // 0-indexed
        const colIndex = img.range.tl.nativeCol // 0-indexed, Col F is 5

        // We accept images in column F (5) or images that are roughly in that horizontal area
        if (colIndex === 5 || (colIndex >= 4 && colIndex <= 6)) {
          const targetItem = items[rowIndex - 1]
          if (targetItem && !targetItem.imageFile) {
            const blob = new Blob([imgData.buffer], { type: `image/${imgData.extension}` })
            const imageFile = new File(
              [blob],
              `${targetItem.slug || 'image'}.${imgData.extension}`,
              {
                type: `image/${imgData.extension}`,
              },
            )
            targetItem.imageFile = imageFile
            targetItem.imagePreview = URL.createObjectURL(imageFile)
            handledRows.add(rowIndex)
            console.log(`Matched floating image to row ${rowIndex} (Item: ${targetItem.name})`)
          }
        }
      }

      // 2. Handle modern "Place in Cell" & "Rich Data" Images (Deep Extraction)
      try {
        const PizZip = (await import('pizzip')).default
        const zip = new PizZip(buffer)
        const parser = new DOMParser()

        const sheetXml = zip.file('xl/worksheets/sheet1.xml')?.asText()
        const metadataXml = zip.file('xl/metadata.xml')?.asText()
        const richValueXml = zip.file('xl/richData/rdrichvalue.xml')?.asText()
        const richValueRelXml = zip.file('xl/richData/richValueRel.xml')?.asText()
        const richValueRelRelsXml = zip.file('xl/richData/_rels/richValueRel.xml.rels')?.asText()

        if (sheetXml && metadataXml && richValueXml && richValueRelXml && richValueRelRelsXml) {
          console.log('Deep Extraction: Modern Rich Data detected. Starting precise mapping...')

          // A. Map Rich Value Rel Indices to Paths
          const relsRelsDoc = parser.parseFromString(richValueRelRelsXml, 'text/xml')
          const relsRelsMap: Record<string, string> = {}
          const relsRels = relsRelsDoc.getElementsByTagName('Relationship')
          for (let i = 0; i < relsRels.length; i++) {
            const rId = relsRels[i].getAttribute('Id')
            const target = relsRels[i].getAttribute('Target')
            if (rId && target) relsRelsMap[rId] = target.replace('../', 'xl/')
          }

          const relDoc = parser.parseFromString(richValueRelXml, 'text/xml')
          const relTags = relDoc.getElementsByTagName('rel')
          const relPaths: string[] = []
          for (let i = 0; i < relTags.length; i++) {
            const rId = relTags[i].getAttribute('r:id')
            if (rId && relsRelsMap[rId]) relPaths.push(relsRelsMap[rId])
          }

          // B. Map Rich Value Data to Rel Indices
          const rvDoc = parser.parseFromString(richValueXml, 'text/xml')
          const rvTags = rvDoc.getElementsByTagName('rv')
          const rvToRelIdx: number[] = []
          for (let i = 0; i < rvTags.length; i++) {
            const firstV = rvTags[i].getElementsByTagName('v')[0]
            if (firstV) rvToRelIdx.push(parseInt(firstV.textContent || '0', 10))
          }

          // C. Map Metadata Index to Rich Value Index
          const metaDoc = parser.parseFromString(metadataXml, 'text/xml')
          const rvbTags = metaDoc.getElementsByTagName('xlrd:rvb')
          const metaToRvIdx: number[] = []
          for (let i = 0; i < rvbTags.length; i++) {
            metaToRvIdx.push(parseInt(rvbTags[i].getAttribute('i') || '0', 10))
          }

          // D. Scan Worksheet for Column F cells with Metadata (vm)
          const sheetDoc = parser.parseFromString(sheetXml, 'text/xml')
          const cells = sheetDoc.getElementsByTagName('c')
          const rowToImagePath: Record<number, string> = {}

          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i]
            const r = cell.getAttribute('r')
            const vm = cell.getAttribute('vm')
            if (r && r.startsWith('F') && vm) {
              const rowNum = parseInt(r.replace('F', ''), 10)
              const metaIdx = parseInt(vm, 10) - 1 // vm is 1-indexed in sheet
              const rvIdx = metaToRvIdx[metaIdx]
              const relIdx = rvToRelIdx[rvIdx]
              const path = relPaths[relIdx]
              if (path) rowToImagePath[rowNum] = path
            }
          }

          // E. Apply images to items
          Object.entries(rowToImagePath).forEach(([rowNumStr, path]) => {
            const rowNum = parseInt(rowNumStr, 10)
            const item = items.find((it) => it.id.startsWith(`row-${rowNum}-`))
            if (item) {
              const fileData = zip.file(path)?.asUint8Array()
              if (fileData) {
                const ext = path.split('.').pop() || 'png'
                const blob = new Blob([fileData as any], { type: `image/${ext}` })
                const imageFile = new File([blob], `${item.slug || 'image'}.${ext}`, {
                  type: `image/${ext}`,
                })
                item.imageFile = imageFile
                item.imagePreview = URL.createObjectURL(imageFile)
                console.log(`Precisely matched Rich Image to row ${rowNum} via metadata chain`)
              }
            }
          })
        } else {
          // Fallback to simpler in-cell extraction if rich data not present
          const cellImagesXml = zip.file('xl/cellimages.xml')?.asText()
          const cellImagesRelsXml = zip.file('xl/_rels/cellimages.xml.rels')?.asText()
          if (cellImagesXml && cellImagesRelsXml) {
            console.log('Deep Extraction: Standard In-Cell format detected.')
            // ... (keep previous simple matching as fallback if needed, or just let it skip)
          }
        }
      } catch (err) {
        console.warn('Deep image extraction failed:', err)
      }

      setData((prev) => {
        const dataMap = new Map(prev.map((item) => [item.slug, item]))
        items.forEach((newItem) => {
          if (dataMap.has(newItem.slug)) {
            Object.assign(dataMap.get(newItem.slug)!, newItem)
          } else {
            dataMap.set(newItem.slug, newItem)
          }
        })
        return Array.from(dataMap.values())
      })
    } catch (error) {
      console.error('Error parsing Excel:', error)
      alert('Failed to parse Excel file. Please ensure it is a valid .xlsx file.')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Bulk image matching
  const handleBulkImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    setData((prev) =>
      prev.map((item) => {
        const match = files.find(
          (f) =>
            f.name.toLowerCase().includes(item.slug.toLowerCase()) || f.name === item.imageFileName,
        )
        if (match) {
          return { ...item, imageFile: match, imagePreview: URL.createObjectURL(match) }
        }
        return item
      }),
    )
    if (imageInputRef.current) imageInputRef.current.value = ''
  }, [])

  const updateField = useCallback((id: string, field: string, value: unknown) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        if (field.startsWith('lang.ar.')) {
          const langField = field.split('.').pop()!
          return { ...row, lang: { ...row.lang, ar: { ...row.lang?.ar, [langField]: value } } }
        }
        return { ...row, [field]: value }
      }),
    )
  }, [])

  const addNewRow = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setData((prev) => [
      {
        id: `new-${Date.now()}`,
        sn: '',
        name: '',
        slug: '',
        description: '',
        price: 0,
        category: '',
        imageFileName: '',
      },
      ...prev,
    ])
  }, [])

  const removeRow = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setData((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const clearData = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setData([])
  }, [])

  // Helper to update granular steps
  const updateStep = useCallback(
    (
      itemId: string,
      step: keyof NonNullable<MenuItem['steps']>,
      status: 'pending' | 'processing' | 'success' | 'error',
    ) => {
      setData((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                steps: {
                  ...(item.steps || {
                    image: 'pending',
                    category: 'pending',
                    allergens: 'pending',
                    item: 'pending',
                    menu: 'pending',
                  }),
                  [step]: status,
                },
              }
            : item,
        ),
      )
    },
    [],
  )

  // Upload handler using Server Actions
  const handleUpload = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      if (!restaurantId) {
        alert('Please select a restaurant first')
        return
      }
      const restaurant = restaurants.find((r) => r.id === restaurantId)
      if (!restaurant) return
      const operatorId =
        typeof restaurant.operator === 'object' ? restaurant.operator?.id : restaurant.operator
      if (!operatorId) {
        alert('Restaurant has no operator assigned')
        return
      }

      setIsUploading(true)

      for (const item of data) {
        if (item.status === 'success') continue // Skip already done

        setData((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: 'uploading' } : d)))

        try {
          // STEP 1: Image
          let imageId: string | undefined
          if (item.imageFile) {
            updateStep(item.id, 'image', 'processing')
            const formData = new FormData()
            formData.append('file', item.imageFile)
            formData.append('operatorId', operatorId)
            try {
              imageId = await uploadMenuMediaAction(formData)
              updateStep(item.id, 'image', 'success')
            } catch (err) {
              console.error('Image upload failed:', err)
              updateStep(item.id, 'image', 'error')
            }
          } else {
            updateStep(item.id, 'image', 'success') // Skip
          }

          // STEP 2: Category
          updateStep(item.id, 'category', 'processing')
          const categoryId = await ensureMenuCategoryAction({
            name: item.category || 'Uncategorized',
            arName: item.lang?.ar?.category,
            operatorId,
          })
          updateStep(item.id, 'category', 'success')

          // STEP 3: Allergens
          updateStep(item.id, 'allergens', 'processing')
          const splitAllergens = (str: string) =>
            str
              .split(/[,,،]/)
              .map((a) => a.trim())
              .filter(Boolean)
          const enAllergens = splitAllergens(item.allergens || '')
          const arAllergens = splitAllergens(item.lang?.ar?.allergens || '')
          const allergenIds = await ensureMenuAllergensAction({
            names: enAllergens,
            arNames: arAllergens,
            operatorId,
          })
          updateStep(item.id, 'allergens', 'success')

          // STEP 4: Item (Upsert)
          updateStep(item.id, 'item', 'processing')
          const itemId = await upsertMenuItemAction({
            item,
            restaurantId,
            operatorId,
            categoryId,
            imageId,
            allergenIds,
          })
          updateStep(item.id, 'item', 'success')

          // STEP 5: Menu Mapping
          updateStep(item.id, 'menu', 'processing')
          const restaurantSlug = restaurant.slug || 'unknown'
          const catSlug = slugify(item.category || 'Uncategorized', { lower: true, strict: true })
          const menuSlug = `${restaurantSlug}-${catSlug}`
          await updateMenuAction({
            menuSlug,
            itemId,
            restaurantId,
            categoryId,
            operatorId,
          })
          updateStep(item.id, 'menu', 'success')

          setData((prev) =>
            prev.map((d) =>
              d.id === item.id ? { ...d, status: 'success', statusMessage: 'Imported' } : d,
            ),
          )
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Upload failed'
          console.error(`Item ${item.name} failed:`, error)
          setData((prev) =>
            prev.map((d) => (d.id === item.id ? { ...d, status: 'error', statusMessage: msg } : d)),
          )
        }
      }

      setIsUploading(false)
    },
    [data, restaurantId, restaurants, updateStep],
  )

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--theme-border-color)',
      }}
    >
      <style>{`
        @keyframes fnb-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            style={{
              padding: '8px',
              border: '1px solid var(--theme-border-color)',
              borderRadius: '4px',
              minWidth: '200px',
            }}
            value={restaurantId}
            onChange={(e) => {
              setRestaurantId(e.target.value)
              localStorage.setItem('fnbImportRestaurantId', e.target.value)
            }}
          >
            <option value="">Select Restaurant</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>

          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
            <span
              className="btn btn--style-primary"
              style={{ padding: '8px 16px', borderRadius: '4px' }}
            >
              📄 Import Excel/CSV
            </span>
          </label>

          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkImageUpload}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
            <span
              className="btn btn--style-primary"
              style={{ padding: '8px 16px', borderRadius: '4px' }}
            >
              🖼️ Bulk Match Images
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={addNewRow}
            className="btn btn--style-secondary"
            style={{ padding: '8px 16px', borderRadius: '4px' }}
          >
            ➕ Add Item
          </button>
          <button
            onClick={clearData}
            className="btn btn--style-secondary"
            style={{ padding: '8px 16px', borderRadius: '4px', color: 'red' }}
          >
            ✕ Clear Data
          </button>
        </div>
      </div>

      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--theme-border-color)',
          borderRadius: '8px',
          maxHeight: '70vh',
        }}
      >
        <table
          style={{
            width: '100%',
            fontSize: '13px',
            textAlign: 'left',
            minWidth: '900px',
            borderCollapse: 'collapse',
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--theme-bg)' }}>
            <tr>
              {[
                'Name (EN/AR)',
                'Slug',
                'Description (EN/AR)',
                'Price',
                'Category (EN/AR)',
                'Allergens (EN/AR)',
                'Image',
                'Status',
                '',
              ].map((h) => (
                <th
                  key={h}
                  style={{ padding: '8px', borderBottom: '1px solid var(--theme-border-color)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={isUploading ? { pointerEvents: 'none', opacity: 0.7 } : undefined}>
            {data.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                  No data loaded. Import a CSV to start.
                </td>
              </tr>
            )}
            {data.map((row) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: '1px solid var(--theme-border-color)',
                  verticalAlign: 'top',
                }}
              >
                <td style={{ padding: '4px' }}>
                  <input
                    value={row.name}
                    onChange={(e) => updateField(row.id, 'name', e.target.value)}
                    placeholder="Name (EN)"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    value={row.lang?.ar?.name || ''}
                    onChange={(e) => updateField(row.id, 'lang.ar.name', e.target.value)}
                    placeholder="الاسم (AR)"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      opacity: 0.7,
                    }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <input
                    value={row.slug}
                    onChange={(e) => updateField(row.id, 'slug', e.target.value)}
                    placeholder="slug"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <textarea
                    value={row.description}
                    onChange={(e) => updateField(row.id, 'description', e.target.value)}
                    placeholder="Description (EN)"
                    rows={2}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      resize: 'vertical',
                    }}
                  />
                  <textarea
                    value={row.lang?.ar?.description || ''}
                    onChange={(e) => updateField(row.id, 'lang.ar.description', e.target.value)}
                    placeholder="الوصف (AR)"
                    rows={2}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      resize: 'vertical',
                      opacity: 0.7,
                    }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <input
                    value={row.price}
                    onChange={(e) => updateField(row.id, 'price', e.target.value)}
                    style={{
                      width: '60px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <input
                    value={row.category}
                    onChange={(e) => updateField(row.id, 'category', e.target.value)}
                    placeholder="Category"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    value={row.lang?.ar?.category || ''}
                    onChange={(e) => updateField(row.id, 'lang.ar.category', e.target.value)}
                    placeholder="الفئة (AR)"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      opacity: 0.7,
                    }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <input
                    value={row.allergens || ''}
                    onChange={(e) => updateField(row.id, 'allergens', e.target.value)}
                    placeholder="Allergens (EN)"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                  <input
                    value={row.lang?.ar?.allergens || ''}
                    onChange={(e) => updateField(row.id, 'lang.ar.allergens', e.target.value)}
                    placeholder="المواد المسببة للحساسية (AR)"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      opacity: 0.7,
                    }}
                  />
                </td>
                <td style={{ padding: '4px' }}>
                  <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id={`file-${row.id}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          updateField(row.id, 'imageFile', file)
                          updateField(row.id, 'imagePreview', URL.createObjectURL(file))
                        }
                      }}
                    />
                    <label
                      htmlFor={`file-${row.id}`}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '1px dashed var(--theme-border-color)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                      }}
                    >
                      {row.imagePreview ? (
                        <img
                          src={row.imagePreview}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>📷</span>
                      )}
                    </label>
                    {row.imageFile && (
                      <button
                        onClick={() => {
                          updateField(row.id, 'imageFile', null)
                          updateField(row.id, 'imagePreview', null)
                        }}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'red',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ padding: '4px', fontSize: '11px' }}>
                  {row.status === 'uploading' && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <StepIcon icon="🖼️" status={row.steps?.image} title="Image" />
                      <StepIcon icon="📂" status={row.steps?.category} title="Category" />
                      <StepIcon icon="🥜" status={row.steps?.allergens} title="Allergens" />
                      <StepIcon icon="📝" status={row.steps?.item} title="Item" />
                      <StepIcon icon="🔗" status={row.steps?.menu} title="Menu" />
                    </div>
                  )}
                  {row.status === 'success' && (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>
                      ✓ {row.statusMessage}
                    </span>
                  )}
                  {row.status === 'error' && (
                    <span style={{ color: 'red' }}>✕ {row.statusMessage}</span>
                  )}
                </td>
                <td style={{ padding: '4px' }}>
                  <button
                    onClick={(e) => removeRow(e, row.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn--style-primary"
          style={{ padding: '8px 24px', borderRadius: '8px' }}
          onClick={handleUpload}
          disabled={isUploading || isProcessing || data.length === 0}
        >
          {isUploading ? 'Uploading...' : `Upload ${data.length} Items`}
        </button>
      </div>
    </div>
  )
}

export default FnbImportUI
