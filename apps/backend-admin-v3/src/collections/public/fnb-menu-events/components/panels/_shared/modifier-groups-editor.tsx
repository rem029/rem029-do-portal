'use client'

import React from 'react'
import { Button, TextInput, SelectInput, CheckboxInput } from '@payloadcms/ui'
import type { ModifierGroupRow } from '../../actions'
import { sp, RowAction, EditingRow, EmptyHint } from './ui'

export interface ModifierGroupsEditorProps {
  groups: ModifierGroupRow[]
  onChange: (groups: ModifierGroupRow[]) => void
  disabled?: boolean
  fieldPrefix: string
  localeLabel?: string // e.g. "English" — appended to the group name / option label field labels
}

export const ModifierGroupsEditor: React.FC<ModifierGroupsEditorProps> = ({
  groups,
  onChange,
  disabled,
  fieldPrefix,
  localeLabel,
}) => {
  const localeSuffix = localeLabel ? ` - ${localeLabel}` : ''
  const handleAddGroup = () => {
    onChange([
      ...groups,
      {
        name: '',
        input_type: 'checkbox',
        required: false,
        options: [{ label: '' }],
      },
    ])
  }

  const handleRemoveGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index))
  }

  const handleUpdateGroup = (index: number, patch: Partial<ModifierGroupRow>) => {
    onChange(groups.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  const handleAddOption = (groupIndex: number) => {
    onChange(
      groups.map((g, i) =>
        i === groupIndex ? { ...g, options: [...g.options, { label: '' }] } : g,
      ),
    )
  }

  const handleRemoveOption = (groupIndex: number, optionIndex: number) => {
    onChange(
      groups.map((g, i) =>
        i === groupIndex ? { ...g, options: g.options.filter((_, oi) => oi !== optionIndex) } : g,
      ),
    )
  }

  const handleUpdateOption = (groupIndex: number, optionIndex: number, label: string) => {
    onChange(
      groups.map((g, i) =>
        i === groupIndex
          ? {
              ...g,
              options: g.options.map((opt, oi) => (oi === optionIndex ? { ...opt, label } : opt)),
            }
          : g,
      ),
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
      {groups.length === 0 ? (
        <EmptyHint>No modifier groups yet.</EmptyHint>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
          {groups.map((group, groupIndex) => (
            <EditingRow key={groupIndex}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: sp.sm,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--theme-elevation-700)',
                  }}
                >
                  {group.name.trim() ? group.name : `Modifier Group #${groupIndex + 1}`}
                </span>
                <RowAction
                  icon="x"
                  label="Remove group"
                  onClick={() => handleRemoveGroup(groupIndex)}
                  disabled={disabled}
                />
              </div>

              <TextInput
                path={`${fieldPrefix}_mg_${groupIndex}_name`}
                label={`Group Name${localeSuffix}`}
                required
                value={group.name}
                placeholder="e.g. Size, Temperature, Milk"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleUpdateGroup(groupIndex, { name: e.target.value })
                }
                readOnly={disabled}
              />

              <div style={{ display: 'flex', gap: sp.md, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <SelectInput
                    path={`${fieldPrefix}_mg_${groupIndex}_type`}
                    name={`${fieldPrefix}_mg_${groupIndex}_type`}
                    label="Input Type"
                    required
                    options={[
                      { label: 'Checkbox (multiple choice)', value: 'checkbox' },
                      { label: 'Radio (single choice)', value: 'radio' },
                    ]}
                    value={group.input_type}
                    onChange={(selected) => {
                      // Structural cast: `selected` is a ReactSelectOption
                      const opt = selected as unknown as { value?: string } | null | undefined
                      handleUpdateGroup(groupIndex, {
                        input_type: opt?.value === 'radio' ? 'radio' : 'checkbox',
                      })
                    }}
                    readOnly={disabled}
                  />
                </div>
                <div
                  className="field-type checkbox"
                  style={{ marginBottom: 'calc(var(--base) * 0.4)' }}
                >
                  <CheckboxInput
                    id={`${fieldPrefix}_mg_${groupIndex}_req`}
                    name={`${fieldPrefix}_mg_${groupIndex}_req`}
                    label="Required"
                    checked={group.required}
                    onToggle={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleUpdateGroup(groupIndex, {
                        required:
                          typeof e?.target?.checked === 'boolean'
                            ? e.target.checked
                            : !group.required,
                      })
                    }
                    readOnly={disabled}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: sp.xs,
                  marginTop: sp.xs,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--theme-elevation-600)',
                  }}
                >
                  Options{localeSuffix}
                </div>
                {group.options.map((opt, optIndex) => (
                  <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        path={`${fieldPrefix}_mg_${groupIndex}_opt_${optIndex}`}
                        value={opt.label}
                        placeholder="Option label (e.g. Small, Large)"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleUpdateOption(groupIndex, optIndex, e.target.value)
                        }
                        readOnly={disabled}
                      />
                    </div>
                    <RowAction
                      icon="x"
                      label="Remove option"
                      onClick={() => handleRemoveOption(groupIndex, optIndex)}
                      disabled={disabled || group.options.length <= 1}
                    />
                  </div>
                ))}
                <div>
                  <Button
                    buttonStyle="transparent"
                    size="small"
                    icon="plus"
                    iconPosition="left"
                    iconStyle="without-border"
                    onClick={() => handleAddOption(groupIndex)}
                    disabled={disabled}
                  >
                    Add option
                  </Button>
                </div>
              </div>
            </EditingRow>
          ))}
        </div>
      )}

      <div>
        <Button
          buttonStyle="secondary"
          size="small"
          icon="plus"
          iconPosition="left"
          iconStyle="without-border"
          onClick={handleAddGroup}
          disabled={disabled}
        >
          Add modifier group
        </Button>
      </div>
    </div>
  )
}

export default ModifierGroupsEditor
