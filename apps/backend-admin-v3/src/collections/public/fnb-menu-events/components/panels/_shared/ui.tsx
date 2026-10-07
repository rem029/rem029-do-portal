'use client'

/**
 * Shared presentational primitives for the event menu builder panels.
 * Quiet-operator register: Payload elevation + status tokens only, 1px hairlines,
 * flat at rest. Icons are drawn only where Payload has no equivalent (InfoIcon);
 * every other icon is Payload's own `icon="edit"|"plus"|"x"`.
 *
 * Density pass (2026-09-13): lists read as one flat, hairline-divided block —
 * the same shape as Payload's own List View table rows — rather than individual
 * bordered/filled cards. Row actions are icon-only with Payload's built-in
 * `tooltip` prop, so a row with two actions doesn't out-grow its neighbors.
 */

import React from 'react'
import { Pill, Button } from '@payloadcms/ui'

/* -------------------------------------------------------------------------- */
/* InfoIcon — the one glyph Payload's Button set has no equivalent for.        */
/* -------------------------------------------------------------------------- */

export const InfoIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/* spacing scale — everything keys off Payload's --base (20px)                */
/* -------------------------------------------------------------------------- */

export const sp = {
  xs: 'calc(var(--base) * 0.25)',
  sm: 'calc(var(--base) * 0.5)',
  md: 'calc(var(--base) * 0.75)',
  lg: 'var(--base)',
  xl: 'calc(var(--base) * 1.5)',
}

/* -------------------------------------------------------------------------- */
/* PanelSection — a titled block. More air above the heading than below it.   */
/* -------------------------------------------------------------------------- */

export const PanelSection: React.FC<{
  title: string
  count?: number
  actions?: React.ReactNode
  children: React.ReactNode
  first?: boolean
}> = ({ title, count, actions, children, first = false }) => (
  <section
    style={{
      marginTop: first ? 0 : sp.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: sp.sm,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: sp.sm,
        minHeight: 26,
      }}
    >
      <h4
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: sp.sm,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--theme-elevation-800)',
        }}
      >
        {title}
        {typeof count === 'number' && (
          <Pill pillStyle="light-gray" size="small">
            {count}
          </Pill>
        )}
      </h4>
      {actions && <div style={{ display: 'flex', gap: sp.xs }}>{actions}</div>}
    </div>
    {children}
  </section>
)

/* -------------------------------------------------------------------------- */
/* List / Row — a flat, hairline-divided block (Payload's own List View row    */
/* shape), not individual cards. Divider + hover live in PanelStyles, scoped   */
/* to .event-menu-row so an in-place edit box (its own bg/border) is unaffected.*/
/* -------------------------------------------------------------------------- */

export const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--theme-elevation-150)',
      borderRadius: 'var(--style-radius-s)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
)

export const Row: React.FC<{
  children: React.ReactNode
  trailing?: React.ReactNode
}> = ({ children, trailing }) => (
  <div
    className="event-menu-row"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: sp.sm,
      padding: `calc(var(--base) * 0.4) calc(var(--base) * 0.75)`,
      minHeight: 36,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: sp.sm, minWidth: 0 }}>
      {children}
    </div>
    {trailing}
  </div>
)

export const RowTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--theme-elevation-800)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
)

export const RowMeta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)', whiteSpace: 'nowrap' }}>
    {children}
  </span>
)

/**
 * Icon-only row action (Edit / Remove / …), using Payload's own Button
 * icon-only mode (`icon` set, no `children`) + its built-in `tooltip`. Keeps a
 * two-action row (badge + edit, or edit + remove) no wider than a one-action row.
 */
export const RowAction: React.FC<{
  icon: 'edit' | 'x' | 'plus'
  label: string
  onClick: () => void
  disabled?: boolean
}> = ({ icon, label, onClick, disabled }) => (
  <Button
    buttonStyle="transparent"
    size="small"
    icon={icon}
    iconStyle="without-border"
    tooltip={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
  />
)

/**
 * The container an item's normal Row becomes while it's being edited in place —
 * its own filled/bordered surface so it reads as "active", set apart from the
 * flat hairline list around it.
 */
export const EditingRow: React.FC<{ children: React.ReactNode; gap?: string }> = ({
  children,
  gap = sp.sm,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap,
      padding: `calc(var(--base) * 0.5) calc(var(--base) * 0.75)`,
      background: 'var(--theme-elevation-50)',
    }}
  >
    {children}
  </div>
)

/* -------------------------------------------------------------------------- */
/* status pill — semantic, theme-correct via Payload's own component          */
/* -------------------------------------------------------------------------- */

export const StatusPill: React.FC<{ tone: 'ready' | 'idle'; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <Pill pillStyle={tone === 'ready' ? 'success' : 'light-gray'} size="small">
    {children}
  </Pill>
)

/* -------------------------------------------------------------------------- */
/* EmptyHint — quiet "nothing here yet" state                                 */
/* -------------------------------------------------------------------------- */

export const EmptyHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    style={{
      margin: 0,
      padding: `${sp.md} var(--base)`,
      textAlign: 'center',
      fontSize: 13,
      lineHeight: 1.5,
      color: 'var(--theme-elevation-450)',
      border: '1px dashed var(--theme-elevation-200)',
      borderRadius: 'var(--style-radius-m)',
    }}
  >
    {children}
  </p>
)

export const LoadingHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ margin: 0, padding: `${sp.xs} 0`, fontSize: 13, color: 'var(--theme-elevation-450)' }}>
    {children}
  </p>
)

/* -------------------------------------------------------------------------- */
/* ErrorText — inline form / fetch error                                      */
/* -------------------------------------------------------------------------- */

export const ErrorText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    role="alert"
    style={{
      margin: 0,
      padding: `${sp.sm} calc(var(--base) * 0.6)`,
      fontSize: 13,
      lineHeight: 1.45,
      color: 'var(--theme-error-700)',
      background: 'var(--theme-error-50)',
      border: '1px solid var(--theme-error-500)',
      borderRadius: 'var(--style-radius-s)',
    }}
  >
    {children}
  </p>
)

/* -------------------------------------------------------------------------- */
/* Note — a quiet inline advisory (e.g. "save to apply")                      */
/* -------------------------------------------------------------------------- */

export const Note: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'attention' }> = ({
  children,
  tone = 'neutral',
}) => {
  const attention = tone === 'attention'
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sp.sm,
        padding: `${sp.xs} calc(var(--base) * 0.6)`,
        fontSize: 12.5,
        lineHeight: 1.4,
        borderRadius: 'var(--style-radius-s)',
        color: attention ? 'var(--theme-warning-700)' : 'var(--theme-elevation-700)',
        background: attention ? 'var(--theme-warning-50)' : 'var(--theme-elevation-100)',
        border: `1px solid ${attention ? 'var(--theme-warning-200)' : 'var(--theme-elevation-200)'}`,
      }}
    >
      <span style={{ flexShrink: 0, display: 'inline-flex', opacity: 0.8 }}>
        <InfoIcon size={13} />
      </span>
      <span>{children}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* SubForm — the container for an inline create / build panel                 */
/* -------------------------------------------------------------------------- */

export const SubForm: React.FC<{ heading: string; children: React.ReactNode }> = ({
  heading,
  children,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: sp.sm,
      padding: `calc(var(--base) * 0.75)`,
      background: 'var(--theme-elevation-50)',
      border: '1px solid var(--theme-elevation-150)',
      borderRadius: 'var(--style-radius-m)',
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-elevation-700)' }}>
      {heading}
    </div>
    {children}
  </div>
)

export const FormActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: sp.xs }}>{children}</div>
)

/* -------------------------------------------------------------------------- */
/* SectionDivider — separates a multi-section form (e.g. ItemForm's basic     */
/* info / categories / image / modifier groups) into visually distinct        */
/* blocks. With a label, the label sits directly on top of the rule (no gap)  */
/* so the rule reads as an underline rather than a separate divider line.     */
/* Pass no label where the section already renders its own heading (e.g.      */
/* CategoryPicker's own "Categories" label) to avoid showing it twice.        */
/* -------------------------------------------------------------------------- */

export const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', margin: `${sp.xs} 0` }}>
    {label && (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: 'var(--theme-elevation-400)',
        }}
      >
        {label}
      </span>
    )}
    <div style={{ borderTop: '1px solid var(--theme-elevation-150)' }} />
  </div>
)

/* -------------------------------------------------------------------------- */
/* FieldRow — pairs a wide field with one or more narrow ones on one line      */
/* (Title + Price, Table Label + Seat Count) instead of each burning a full-   */
/* width row for a few characters of input. Wraps on its own container's      */
/* width rather than a fixed breakpoint, so it degrades safely if this ever    */
/* renders in a narrower column.                                              */
/* -------------------------------------------------------------------------- */

export const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: sp.sm, flexWrap: 'wrap' }}>{children}</div>
)

export const FieldRowItem: React.FC<{
  children: React.ReactNode
  flexGrow?: number
  minWidth?: number
}> = ({ children, flexGrow = 1, minWidth = 140 }) => (
  <div style={{ flex: `${flexGrow} 1 ${minWidth}px`, minWidth: 0 }}>{children}</div>
)

/* -------------------------------------------------------------------------- */
/* PanelStyles — rendered once by the shell. The two things inline styles      */
/* can't reach: the flat list's row divider/hover, and the item-picker         */
/* scrollbar + its row hover.                                                  */
/* -------------------------------------------------------------------------- */

export const PanelStyles: React.FC = () => (
  <style>{`
    .event-menu-row + .event-menu-row { border-top: 1px solid var(--theme-elevation-100); }
    .event-menu-row:hover { background: var(--theme-elevation-50); }

    .event-menu-item-picker { scrollbar-width: thin; scrollbar-color: var(--theme-elevation-200) transparent; }
    .event-menu-item-picker::-webkit-scrollbar { width: 8px; }
    .event-menu-item-picker::-webkit-scrollbar-thumb { background: var(--theme-elevation-200); border-radius: 4px; border: 2px solid var(--theme-elevation-0); }
    .event-menu-item-picker::-webkit-scrollbar-track { background: transparent; }
    .event-menu-item-picker > label:not([data-selected="true"]):hover { background: var(--theme-elevation-50); }
  `}</style>
)
