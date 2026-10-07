'use client'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'
import { HexColorPicker } from 'react-colorful'
import type { TextFieldClientComponent } from 'payload'
import './index.css'

const ColorPickerField: TextFieldClientComponent = (props) => {
  const { path, field } = props
  const { value, setValue } = useField<string>({ path })
  const [isOpen, setIsOpen] = useState(false)
  const [localColor, setLocalColor] = useState(value || '#000000')
  const popover = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setIsOpen(false), [])

  // Update local color when field value changes from outside (e.g. form reset or initial load)
  useEffect(() => {
    if (value && value !== localColor) {
      setLocalColor(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Debounce the setValue call to avoid rapid form state updates while dragging the picker
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localColor !== value) {
        setValue(localColor)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [localColor, setValue, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popover.current && !popover.current.contains(event.target as Node)) {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, close])

  const onChange = useCallback((color: string) => {
    setLocalColor(color)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    // Ensure it starts with #
    if (newValue && !newValue.startsWith('#')) {
      newValue = `#${newValue}`
    }
    setLocalColor(newValue)
  }

  return (
    <div className="field-type color-picker-field">
      <FieldLabel label={field.label} />

      <div className="color-picker-compact-container">
        <div className="swatch-wrapper">
          <div
            className="color-swatch"
            style={{ backgroundColor: localColor }}
            onClick={() => setIsOpen(!isOpen)}
            title="Click to open color picker"
          />

          {isOpen && (
            <div className="color-picker-popover" ref={popover}>
              <HexColorPicker color={localColor} onChange={onChange} />
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <input
            type="text"
            value={localColor}
            onChange={handleInputChange}
            placeholder="#000000"
            spellCheck={false}
            id={`field-${path.replace(/\./g, '__')}`}
          />
        </div>
      </div>
    </div>
  )
}

export default ColorPickerField
