'use client'

import React, { useEffect, useRef, useState } from 'react'
import { buildColGroups, ColGroup, DynamicField } from './submissions-table'

interface ColumnSelectorProps {
  fields: DynamicField[]
  visibleKeys: Set<string>
  onChange: (keys: Set<string>) => void
  onReorder: (fields: DynamicField[]) => void
}

// ─── Reorder helpers ──────────────────────────────────────────────────────────

function reorderTopLevel(fields: DynamicField[], dragKey: string, dropKey: string): DynamicField[] {
  const groups = buildColGroups(fields)
  const groupKey = (g: ColGroup) => (g.kind === 'single' ? g.field.key : g.parentKey)
  const di = groups.findIndex((g) => groupKey(g) === dragKey)
  const oi = groups.findIndex((g) => groupKey(g) === dropKey)
  if (di === -1 || oi === -1 || di === oi) return fields
  const next = [...groups]
  const [removed] = next.splice(di, 1)
  next.splice(oi, 0, removed)
  return next.flatMap((g) => (g.kind === 'single' ? [g.field] : g.fields))
}

function reorderSubField(
  fields: DynamicField[],
  parentKey: string,
  dragKey: string,
  dropKey: string,
): DynamicField[] {
  const group = fields.filter((f) => f.parentKey === parentKey)
  const di = group.findIndex((f) => f.key === dragKey)
  const oi = group.findIndex((f) => f.key === dropKey)
  if (di === -1 || oi === -1 || di === oi) return fields
  const next = [...group]
  const [removed] = next.splice(di, 1)
  next.splice(oi, 0, removed)
  let gi = 0
  return fields.map((f) => (f.parentKey === parentKey ? next[gi++] : f))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="shrink-0 opacity-40">
      <circle cx="3" cy="2.5" r="1.5" />
      <circle cx="7" cy="2.5" r="1.5" />
      <circle cx="3" cy="7" r="1.5" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="3" cy="11.5" r="1.5" />
      <circle cx="7" cy="11.5" r="1.5" />
    </svg>
  )
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="cursor-pointer shrink-0"
    />
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DragState =
  | { key: string; kind: 'top' }
  | { key: string; kind: 'sub'; parentKey: string }

// ─── Main component ───────────────────────────────────────────────────────────

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  fields,
  visibleKeys,
  onChange,
  onReorder,
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const colGroups = buildColGroups(fields)
  const allVisible = fields.length > 0 && fields.every((f) => visibleKeys.has(f.key))
  const someVisible = fields.some((f) => visibleKeys.has(f.key))
  const visibleCount = fields.filter((f) => visibleKeys.has(f.key)).length

  // ── Visibility ─────────────────────────────────────────────────────────────
  const toggleAll = () => onChange(allVisible ? new Set() : new Set(fields.map((f) => f.key)))

  const toggle = (key: string) => {
    const next = new Set(visibleKeys)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange(next)
  }

  const toggleGroup = (group: Extract<ColGroup, { kind: 'group' }>) => {
    const allOn = group.fields.every((f) => visibleKeys.has(f.key))
    const next = new Set(visibleKeys)
    group.fields.forEach((f) => (allOn ? next.delete(f.key) : next.add(f.key)))
    onChange(next)
  }

  // ── Drag ───────────────────────────────────────────────────────────────────
  const endDrag = () => { setDrag(null); setOverKey(null) }

  const handleDrop = (dropKey: string, kind: 'top' | 'sub', parentKey?: string) => {
    if (!drag || drag.key === dropKey) { endDrag(); return }
    let next = fields
    if (kind === 'top' && drag.kind === 'top') {
      next = reorderTopLevel(fields, drag.key, dropKey)
    } else if (kind === 'sub' && drag.kind === 'sub' && drag.parentKey === parentKey) {
      next = reorderSubField(fields, parentKey!, drag.key, dropKey)
    }
    onReorder(next)
    endDrag()
  }

  const dropBorder = (key: string, kind: 'top' | 'sub') =>
    overKey === key && drag?.kind === kind
      ? 'border-t-2 border-(--theme-elevation-600)'
      : 'border-t-2 border-transparent'

  if (fields.length === 0) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-(--theme-elevation-100) hover:bg-(--theme-elevation-150) text-(--theme-elevation-700) border border-(--theme-elevation-200) transition-colors cursor-pointer whitespace-nowrap"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="1" y="4" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
          <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="1" y="10.5" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
        </svg>
        Columns
        <span className="text-(--theme-elevation-500) font-normal tabular-nums">
          {visibleCount}/{fields.length}
        </span>
        <span className="opacity-40 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-40 w-[240px] bg-(--theme-elevation-0) border border-(--theme-elevation-200) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-(--theme-elevation-150) bg-(--theme-elevation-50)">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <IndeterminateCheckbox
                checked={allVisible}
                indeterminate={someVisible && !allVisible}
                onChange={toggleAll}
              />
              <span className="text-[11px] font-bold text-(--theme-elevation-600) uppercase tracking-[0.06em]">
                All columns
              </span>
            </label>
          </div>

          {/* Field list */}
          <div className="overflow-y-auto max-h-[340px] py-1">
            {colGroups.map((group) =>
              group.kind === 'single' ? (
                // Ungrouped field — draggable at top level
                <div
                  key={group.field.key}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    setDrag({ key: group.field.key, kind: 'top' })
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = drag?.kind === 'top' ? 'move' : 'none'
                    if (drag?.kind === 'top') setOverKey(group.field.key)
                  }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(group.field.key, 'top') }}
                  onDragEnd={endDrag}
                  className={`flex items-center gap-2 px-3 py-[7px] hover:bg-(--theme-elevation-50) select-none ${dropBorder(group.field.key, 'top')} ${drag?.key === group.field.key ? 'opacity-30' : ''}`}
                >
                  <span className="cursor-grab text-(--theme-elevation-500) shrink-0"><GripIcon /></span>
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={visibleKeys.has(group.field.key)}
                      onChange={() => toggle(group.field.key)}
                      className="cursor-pointer shrink-0"
                    />
                    <span className="text-[13px] text-(--theme-elevation-800) truncate">
                      {group.field.label}
                    </span>
                  </label>
                </div>
              ) : (
                // Group — header draggable at top level; sub-fields constrained within
                <div key={group.parentKey}>
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      setDrag({ key: group.parentKey, kind: 'top' })
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = drag?.kind === 'top' ? 'move' : 'none'
                      if (drag?.kind === 'top') setOverKey(group.parentKey)
                    }}
                    onDrop={(e) => { e.preventDefault(); handleDrop(group.parentKey, 'top') }}
                    onDragEnd={endDrag}
                    className={`flex items-center gap-2 px-3 py-[6px] hover:bg-(--theme-elevation-100) select-none bg-(--theme-elevation-50) border-t border-(--theme-elevation-100) mt-0.5 ${dropBorder(group.parentKey, 'top')} ${drag?.key === group.parentKey ? 'opacity-30' : ''}`}
                  >
                    <span className="cursor-grab text-(--theme-elevation-400) shrink-0"><GripIcon /></span>
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <IndeterminateCheckbox
                        checked={group.fields.every((f) => visibleKeys.has(f.key))}
                        indeterminate={
                          group.fields.some((f) => visibleKeys.has(f.key)) &&
                          !group.fields.every((f) => visibleKeys.has(f.key))
                        }
                        onChange={() => toggleGroup(group)}
                      />
                      <span className="text-[11px] font-bold text-(--theme-elevation-600) uppercase tracking-[0.06em] truncate">
                        {group.parentLabel}
                      </span>
                    </label>
                  </div>

                  {group.fields.map((f) => (
                    <div
                      key={f.key}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move'
                        setDrag({ key: f.key, kind: 'sub', parentKey: group.parentKey })
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        const sameGroup = drag?.kind === 'sub' && drag.parentKey === group.parentKey
                        e.dataTransfer.dropEffect = sameGroup ? 'move' : 'none'
                        if (sameGroup) setOverKey(f.key)
                      }}
                      onDrop={(e) => { e.preventDefault(); handleDrop(f.key, 'sub', group.parentKey) }}
                      onDragEnd={endDrag}
                      className={`flex items-center gap-2 pl-8 pr-3 py-[6px] hover:bg-(--theme-elevation-50) select-none ${dropBorder(f.key, 'sub')} ${drag?.key === f.key ? 'opacity-30' : ''}`}
                    >
                      <span className="cursor-grab text-(--theme-elevation-400) shrink-0"><GripIcon /></span>
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={visibleKeys.has(f.key)}
                          onChange={() => toggle(f.key)}
                          className="cursor-pointer shrink-0"
                        />
                        <span className="text-[12px] text-(--theme-elevation-700) truncate">{f.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}
