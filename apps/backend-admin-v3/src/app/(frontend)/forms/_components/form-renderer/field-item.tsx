'use client'

import React from 'react'
import { cn } from '@/utilities/cn'
import { noah } from '@/utilities/fonts'
import { countries } from 'countries-list'
import { FormFields, buildIdSegment } from './helpers'
import { SignaturePadInput } from './signature-pad'
import { DynamicSelectField } from '@/common/components/dynamic-select-field'
import { uploadFileAction } from './actions'
import { useFormId, useLockedDepartment } from './form-id-context'
import {
  getRestaurantsAction,
  getOperatorsAction,
  getStoreDepartmentsAction,
  getCrmCategoriesAction,
  getSurveyDepartmentOptionsAction,
} from '@/common/actions/relation-options'
import type { RatingBlock, ScaleBlock } from '@/payload-types'
import { t, type Language } from '@/utilities/translations'

const CustomBlockWrapper: React.FC<{
  error?: string
  children: React.ReactNode
  className?: string
}> = ({ error, children, className }) => {
  return (
    <div
      className={cn(
        'w-full transition-colors rounded-box',
        error && 'border border-error ring-1 ring-error/30 p-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

const FieldErrorMessage: React.FC<{ error?: string; id?: string }> = ({ error, id }) => {
  if (!error) return null

  return (
    <p id={id} className={cn('text-error text-xs flex items-center gap-1 mt-1', noah.className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </p>
  )
}

// Extracted so `field` narrows to RatingBlock/ScaleBlock at the JSX prop-expression
// call site (`field.blockType === 'rating' && <RatingFieldControl field={field} .../>`).
// TS control-flow narrowing does not cross into a nested closure/IIFE body, so keeping
// these as sibling components (rather than inline `(() => {...})()` blocks) is what lets
// us read the blocks' custom fields with real types instead of `field as any`.
interface RatingFieldControlProps {
  noRatingLabel: string
  field: RatingBlock
  fieldName: string
  value: string | boolean | number | undefined
  onChange: (name: string, value: string | boolean | number) => void
  disabled: boolean
  isRequired: boolean
  fieldLabel: string
  sequenceBadge: React.ReactNode
  requiredMark: React.ReactNode
  error?: string
  errorId?: string
}

const RatingFieldControl: React.FC<RatingFieldControlProps> = ({
  noRatingLabel,
  field,
  fieldName,
  value,
  onChange,
  disabled,
  isRequired,
  fieldLabel,
  sequenceBadge,
  requiredMark,
  error,
  errorId,
}) => {
  const pointLabels = (field.labels ?? []).map((row) => row.label || '')
  const pointCount = pointLabels.length || field.point_count || 5
  const points = Array.from({ length: pointCount }, (_, i) => i + 1)
  const currentValue = value ? Number(value) : 0
  const isStars = field.display !== 'buttons'

  return (
    <fieldset className="fieldset w-full">
      <legend className={cn('fieldset-legend text-primary', noah.className)}>
        {sequenceBadge}
        {fieldLabel}
        {requiredMark}
      </legend>
      {isStars ? (
        <CustomBlockWrapper error={error} className="w-fit p-1">
          <div className="rating rating-lg pt-1">
            <input
              type="radio"
              name={fieldName}
              className="rating-hidden"
              aria-label={noRatingLabel}
              readOnly
              checked={currentValue === 0}
              disabled={disabled}
            />
            {points.map((point) => (
              <input
                key={point}
                type="radio"
                name={fieldName}
                className="mask mask-star bg-primary"
                aria-label={pointLabels[point - 1] || `${point}`}
                required={isRequired}
                checked={currentValue === point}
                onChange={() => onChange(fieldName, String(point))}
                disabled={disabled}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={errorId}
              />
            ))}
          </div>
        </CustomBlockWrapper>
      ) : (
        <CustomBlockWrapper error={error}>
          <div className="flex flex-wrap gap-4 pt-1">
            {points.map((point) => (
              <label key={point} className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  name={fieldName}
                  className={cn('radio radio-sm radio-primary', error && 'radio-error')}
                  required={isRequired}
                  checked={currentValue === point}
                  onChange={() => onChange(fieldName, String(point))}
                  disabled={disabled}
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={errorId}
                />
                <span className={cn('label-text text-sm', noah.className)}>
                  {pointLabels[point - 1] || point}
                </span>
              </label>
            ))}
          </div>
        </CustomBlockWrapper>
      )}
    </fieldset>
  )
}

interface ScaleFieldControlProps {
  notAnsweredLabel: string
  field: ScaleBlock
  fieldName: string
  elementId: string
  value: string | boolean | number | undefined
  onChange: (name: string, value: string | boolean | number) => void
  disabled: boolean
  isRequired: boolean
  fieldLabel: string
  sequenceBadge: React.ReactNode
  requiredMark: React.ReactNode
  error?: string
  errorId?: string
}

const SCALE_VALUE_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
])

const ScaleFieldControl: React.FC<ScaleFieldControlProps> = ({
  notAnsweredLabel,
  field,
  fieldName,
  elementId,
  value,
  onChange,
  disabled,
  isRequired,
  fieldLabel,
  sequenceBadge,
  requiredMark,
  error,
  errorId,
}) => {
  const min = field.min ?? 0
  const max = field.max ?? 10
  const step = field.step ?? 1
  const hasValue = value !== undefined && value !== null && value !== ''
  const currentValue = hasValue ? Number(value) : min

  return (
    <fieldset className="fieldset w-full">
      <legend className={cn('fieldset-legend text-primary', noah.className)}>
        {sequenceBadge}
        {fieldLabel}
        {requiredMark}
      </legend>
      <CustomBlockWrapper error={error}>
        <input
          id={elementId}
          type="range"
          min={min}
          max={max}
          step={step}
          required={isRequired}
          className={cn('range range-primary w-full', error && 'range-error', !hasValue && 'opacity-50')}
          name={fieldName}
          value={currentValue}
          onChange={(e) => {
            if (disabled) return
            onChange(fieldName, e.target.value)
          }}
          // Native range inputs do not fire change when clicking or pressing keys at min.
          onPointerUp={(e) => {
            if (disabled || hasValue) return
            onChange(fieldName, e.currentTarget.value)
          }}
          onKeyDown={(e) => {
            if (disabled || hasValue) return
            if (SCALE_VALUE_KEYS.has(e.key)) {
              onChange(fieldName, e.currentTarget.value)
            }
          }}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
        />
        <div className="flex justify-between text-xs text-base-content/70 pt-1">
          <span>{field.min_label || min}</span>
          <span className={cn('font-bold text-primary', noah.className)}>
            {hasValue ? (
              currentValue
            ) : (
              <span title={notAnsweredLabel}>
                <span aria-hidden="true">—</span>
                <span className="sr-only">{notAnsweredLabel}</span>
              </span>
            )}
          </span>
          <span>{field.max_label || max}</span>
        </div>
      </CustomBlockWrapper>
    </fieldset>
  )
}

export interface FieldItemProps {
  field: FormFields
  prefix?: string
  idPrefix?: string
  displayIndex: number
  values: Record<string, string | boolean | number>
  error?: string
  onChange: (name: string, value: string | boolean | number) => void
  disabled: boolean
  uploading: Record<string, boolean>
  setUploading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setError: (error: string | null) => void
  status: string
  showSequenceNumber?: boolean
  language: string
  readOnly: boolean
}

export const FieldItem: React.FC<FieldItemProps> = ({
  field,
  prefix = '',
  idPrefix = '',
  displayIndex,
  values,
  error,
  onChange,
  disabled,
  uploading,
  setUploading,
  setError,
  status,
  showSequenceNumber = true,
  language,
  readOnly,
}) => {
  const formId = useFormId()
  const lockedDepartmentId = useLockedDepartment()
  const surveyDepartmentAction = React.useCallback(() => getSurveyDepartmentOptionsAction(formId), [formId])
  const lang = language as Language
  const name = 'name' in field ? (field.name as string) : ''
  const fieldName = name ? (prefix ? `${prefix}${name}` : name) : ''

  const isCheckbox = field.blockType === 'checkbox'
  const isRadio = field.blockType === 'radio'
  const isFile = field.blockType === 'file'
  const isSignature = (field as { blockType: string }).blockType === 'signature'

  const fieldLabel = 'label' in field ? (field.label as string) : ''
  const fieldPlaceholder =
    'placeholder' in field && field.placeholder ? (field.placeholder as string) : ''
  const isRequired = 'required' in field && field.required
  const elementId = idPrefix + buildIdSegment(name, fieldLabel)
  const errorId = error ? `${elementId || field.id}-error` : undefined

  const isLabelOnTop = (field as any).variant === 'label-on-top'
  const radioDirection = (field as any).direction === 'row' ? 'row' : 'column'

  const SequenceBadge =
    displayIndex > 0 && showSequenceNumber ? (
      <span className="badge badge-info badge-outline badge-xs font-bold shrink-0">
        {displayIndex}
      </span>
    ) : null

  const RequiredMark = isRequired ? <span className="text-error ml-1">*</span> : null

  return (
    <div
      key={field.id}
      data-field-name={fieldName || undefined}
      className="flex flex-col gap-1"
      style={{
        width: 'width' in field && field?.width ? `${field.width}%` : '100%',
      }}
    >
      {/* ── date ─────────────────────────────────────────────────────────── */}
      {field.blockType === 'date' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="date"
              required={isRequired || false}
              className={cn('input w-full validator', error && 'input-error')}
              name={fieldName}
              placeholder={fieldPlaceholder || t('Select Date', lang)}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <input
              id={elementId}
              type="date"
              required={isRequired || false}
              className="grow text-xs"
              name={fieldName}
              placeholder={fieldPlaceholder || t('Select Date', lang)}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </label>
        ))}

      {/* ── time ─────────────────────────────────────────────────────────── */}
      {field.blockType === 'time' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="time"
              required={isRequired || false}
              className={cn('input w-full validator', error && 'input-error')}
              name={fieldName}
              placeholder={fieldPlaceholder || t('Select Time', lang)}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <input
              id={elementId}
              type="time"
              required={isRequired || false}
              className="grow text-xs"
              name={fieldName}
              placeholder={fieldPlaceholder || t('Select Time', lang)}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </label>
        ))}

      {/* ── text ─────────────────────────────────────────────────────────── */}
      {field.blockType === 'text' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="text"
              required={isRequired || false}
              className={cn('input w-full validator placeholder:text-xs', error && 'input-error')}
              placeholder={fieldPlaceholder || t('Type here...', lang)}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <input
              id={elementId}
              type="text"
              required={isRequired || false}
              className="grow placeholder:text-xs"
              placeholder={fieldPlaceholder || t('Type here...', lang)}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </label>
        ))}

      {/* ── email ────────────────────────────────────────────────────────── */}
      {field.blockType === 'email' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="email"
              required={isRequired || false}
              className={cn('input w-full validator placeholder:text-xs', error && 'input-error')}
              placeholder={fieldPlaceholder || 'example@domain.com'}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <input
              id={elementId}
              type="email"
              required={isRequired || false}
              className="grow placeholder:text-xs"
              placeholder={fieldPlaceholder || 'example@domain.com'}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </label>
        ))}

      {/* ── number ───────────────────────────────────────────────────────── */}
      {field.blockType === 'number' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="number"
              required={isRequired || false}
              className={cn('input w-full validator placeholder:text-xs', error && 'input-error')}
              placeholder={fieldPlaceholder || '0'}
              name={fieldName}
              value={
                values[fieldName] !== undefined &&
                values[fieldName] !== null &&
                values[fieldName] !== ''
                  ? String(values[fieldName])
                  : ''
              }
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <input
              id={elementId}
              type="number"
              required={isRequired || false}
              className="grow placeholder:text-xs"
              placeholder={fieldPlaceholder || '0'}
              name={fieldName}
              value={
                values[fieldName] !== undefined &&
                values[fieldName] !== null &&
                values[fieldName] !== ''
                  ? String(values[fieldName])
                  : ''
              }
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </label>
        ))}

      {/* ── phone ────────────────────────────────────────────────────────── */}
      {field.blockType === 'phone' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="tel"
              required={isRequired || false}
              className={cn('input w-full validator placeholder:text-xs', error && 'input-error')}
              placeholder={fieldPlaceholder || '+97400000000'}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <input
              id={elementId}
              type="tel"
              required={isRequired || false}
              className="grow placeholder:text-xs"
              placeholder={fieldPlaceholder || '+97400000000'}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </label>
        ))}

      {/* ── textarea ─────────────────────────────────────────────────────── */}
      {field.blockType === 'textarea' && (
        <fieldset className="fieldset w-full">
          <legend className={cn('fieldset-legend text-primary', noah.className)}>
            {SequenceBadge}
            {fieldLabel}
            {RequiredMark}
          </legend>
          <textarea
            id={elementId}
            required={isRequired || false}
            className={cn(
              'textarea md:textarea-lg textarea-sm md:text-sm h-28 w-full validator placeholder:text-xs',
              error && 'textarea-error',
            )}
            placeholder={fieldPlaceholder || t('Type here...', lang)}
            name={fieldName}
            value={(values[fieldName] as string) || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
          />
        </fieldset>
      )}

      {/* ── select ───────────────────────────────────────────────────────── */}
      {field.blockType === 'select' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <select
              id={elementId}
              required={isRequired || false}
              className={cn('select w-full', error && 'select-error', !values[fieldName] && 'text-xs')}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            >
              <option value="" disabled>
                {fieldPlaceholder || t('Pick an option', lang)}
              </option>
              {(field as any).options?.map((option: any) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <select
              id={elementId}
              required={isRequired || false}
              className={cn(
                'grow border-none focus:outline-none bg-transparent',
                error && 'select-error',
                !values[fieldName] && 'text-xs',
              )}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            >
              <option value="" disabled>
                {fieldPlaceholder || t('Pick an option', lang)}
              </option>
              {(field as any).options?.map((option: any) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}

      {/* ── country ──────────────────────────────────────────────────────── */}
      {field.blockType === 'country' &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <select
              id={elementId}
              required={isRequired || false}
              className={cn('select w-full', error && 'select-error', !values[fieldName] && 'text-xs')}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            >
              <option value="" disabled>
                {fieldPlaceholder || t('Select a country', lang)}
              </option>
              {Object.values(countries).map((country: any) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </fieldset>
        ) : (
          <label className={cn('input md:input-lg input-sm md:text-sm w-full validator', error && 'input-error')}>
            {SequenceBadge}
            <span className={cn('label-text-alt text-primary whitespace-nowrap', noah.className)}>
              {fieldLabel} {RequiredMark}
            </span>
            <select
              id={elementId}
              required={isRequired || false}
              className={cn(
                'grow border-none focus:outline-none bg-transparent',
                error && 'select-error',
                !values[fieldName] && 'text-xs',
              )}
              name={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={(e) => onChange(fieldName, e.target.value)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            >
              <option value="" disabled>
                {fieldPlaceholder || t('Select a country', lang)}
              </option>
              {Object.values(countries).map((country: any) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        ))}

      {/* ── rating ───────────────────────────────────────────────────────── */}
      {field.blockType === 'rating' && (
        <RatingFieldControl
          field={field}
          noRatingLabel={t('No rating', lang)}
          fieldName={fieldName}
          value={values[fieldName]}
          onChange={onChange}
          disabled={disabled}
          isRequired={isRequired || false}
          fieldLabel={fieldLabel}
          sequenceBadge={SequenceBadge}
          requiredMark={RequiredMark}
          error={error}
          errorId={errorId}
        />
      )}

      {/* ── scale ────────────────────────────────────────────────────────── */}
      {field.blockType === 'scale' && (
        <ScaleFieldControl
          field={field}
          notAnsweredLabel={t('Not answered', lang)}
          fieldName={fieldName}
          elementId={elementId}
          value={values[fieldName]}
          onChange={onChange}
          disabled={disabled}
          isRequired={isRequired || false}
          fieldLabel={fieldLabel}
          sequenceBadge={SequenceBadge}
          requiredMark={RequiredMark}
          error={error}
          errorId={errorId}
        />
      )}

      {/* ── select-restaurants / select-operators ────────────────────────── */}
      {field.blockType === 'select-restaurants' && (
        <CustomBlockWrapper error={error}>
          <DynamicSelectField
            field={field}
            fieldName={fieldName}
            elementId={elementId}
            fieldLabel={fieldLabel}
            fieldPlaceholder={fieldPlaceholder}
            isRequired={isRequired || false}
            displayIndex={displayIndex}
            showSequenceNumber={showSequenceNumber}
            values={values}
            onChange={onChange}
            disabled={disabled}
            isLabelOnTop={isLabelOnTop}
            action={getRestaurantsAction}
          />
        </CustomBlockWrapper>
      )}

      {field.blockType === 'select-operators' && (
        <CustomBlockWrapper error={error}>
          <DynamicSelectField
            field={field}
            fieldName={fieldName}
            elementId={elementId}
            fieldLabel={fieldLabel}
            fieldPlaceholder={fieldPlaceholder}
            isRequired={isRequired || false}
            displayIndex={displayIndex}
            showSequenceNumber={showSequenceNumber}
            values={values}
            onChange={onChange}
            disabled={disabled}
            isLabelOnTop={isLabelOnTop}
            action={getOperatorsAction}
          />
        </CustomBlockWrapper>
      )}

      {field.blockType === 'select-store-departments' && (
        <CustomBlockWrapper error={error}>
          <DynamicSelectField
            field={field}
            fieldName={fieldName}
            elementId={elementId}
            fieldLabel={fieldLabel}
            fieldPlaceholder={fieldPlaceholder}
            isRequired={isRequired || false}
            displayIndex={displayIndex}
            showSequenceNumber={showSequenceNumber}
            values={values}
            onChange={onChange}
            disabled={disabled}
            isLabelOnTop={isLabelOnTop}
            action={getStoreDepartmentsAction}
            valueKey="id"
          />
        </CustomBlockWrapper>
      )}

      {field.blockType === 'survey-department' && (
        <CustomBlockWrapper error={error}>
          <DynamicSelectField
            field={field}
            fieldName={fieldName}
            elementId={elementId}
            fieldLabel={fieldLabel}
            fieldPlaceholder={fieldPlaceholder}
            isRequired={isRequired || false}
            displayIndex={displayIndex}
            showSequenceNumber={showSequenceNumber}
            values={values}
            onChange={onChange}
            disabled={disabled}
            isLabelOnTop={isLabelOnTop}
            action={surveyDepartmentAction}
            valueKey="id"
            lockedValue={lockedDepartmentId}
          />
          {lockedDepartmentId && (
            <p className="text-xs text-base-content/70 mt-1">{t('Set by your invitation', lang)}</p>
          )}
        </CustomBlockWrapper>
      )}

      {field.blockType === 'select-crm-category' && (
        <CustomBlockWrapper error={error}>
          <DynamicSelectField
            field={field}
            fieldName={fieldName}
            elementId={elementId}
            fieldLabel={fieldLabel}
            fieldPlaceholder={fieldPlaceholder}
            isRequired={isRequired || false}
            displayIndex={displayIndex}
            showSequenceNumber={showSequenceNumber}
            values={values}
            onChange={onChange}
            disabled={disabled}
            isLabelOnTop={isLabelOnTop}
            action={getCrmCategoriesAction}
            valueKey="id"
          />
        </CustomBlockWrapper>
      )}

      {/* ── checkbox ─────────────────────────────────────────────────────── */}
      {isCheckbox &&
        (isLabelOnTop ? (
          <fieldset className="fieldset w-full">
            <legend className={cn('fieldset-legend text-primary', noah.className)}>
              {SequenceBadge}
              {fieldLabel}
              {RequiredMark}
            </legend>
            <input
              id={elementId}
              type="checkbox"
              required={isRequired || false}
              className={cn(
                'checkbox md:checkbox-md checkbox-sm checkbox-primary',
                error && 'checkbox-error',
              )}
              name={fieldName}
              checked={(values[fieldName] as boolean) || false}
              onChange={(e) => onChange(fieldName, e.target.checked)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
          </fieldset>
        ) : (
          <label className="label cursor-pointer justify-start gap-3">
            {SequenceBadge}
            <input
              id={elementId}
              type="checkbox"
              required={isRequired || false}
              className={cn(
                'checkbox md:checkbox-md checkbox-sm checkbox-primary',
                error && 'checkbox-error',
              )}
              name={fieldName}
              checked={(values[fieldName] as boolean) || false}
              onChange={(e) => onChange(fieldName, e.target.checked)}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={errorId}
            />
            <span className={cn('pb-1 pt-0 text-wrap font-bold text-primary', noah.className)}>
              {fieldLabel}
              {RequiredMark}
            </span>
          </label>
        ))}

      {/* ── radio ────────────────────────────────────────────────────────── */}
      {isRadio && (
        <fieldset className="fieldset w-full">
          <legend className={cn('fieldset-legend text-primary', noah.className)}>
            {SequenceBadge}
            {fieldLabel}
            {RequiredMark}
          </legend>
          <CustomBlockWrapper error={error}>
            <div
              className={cn(
                'flex pt-1 w-full',
                radioDirection === 'row' ? 'flex-row gap-4 flex-wrap' : 'flex-col gap-2',
              )}
            >
              {(field as any).options?.map((option: any) => (
                <label key={option.id} className="label cursor-pointer justify-start gap-3">
                  <input
                    id={`${elementId}.${buildIdSegment(option.value)}`}
                    type="radio"
                    required={isRequired || false}
                    className={cn('radio md:radio-md radio-sm radio-primary', error && 'radio-error')}
                    name={fieldName}
                    value={option.value}
                    checked={values[fieldName] === option.value}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    disabled={disabled}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={errorId}
                  />
                  <span className={cn('label-text text-sm', noah.className)}>{option.label}</span>
                </label>
              ))}
            </div>
          </CustomBlockWrapper>
        </fieldset>
      )}

      {/* ── file ─────────────────────────────────────────────────────────── */}
      {isFile && (
        <fieldset className="fieldset w-full">
          <legend className={cn('fieldset-legend text-primary', noah.className)}>
            {SequenceBadge}
            {fieldLabel}
            {RequiredMark}
          </legend>
          <CustomBlockWrapper error={error}>
            <div className="flex flex-col gap-3 w-full">
              {readOnly && values[fieldName] ? (
                (() => {
                  const fileData = values[fieldName]
                  let fileUrl = ''
                  let fileName = 'Uploaded Document'
                  let mimeType = ''

                  if (fileData && typeof fileData === 'object') {
                    fileUrl = (fileData as any).url || ''
                    fileName = (fileData as any).filename || 'Uploaded Document'
                    mimeType = (fileData as any).mimeType || ''
                  } else if (typeof fileData === 'string') {
                    if (fileData.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(fileData)
                        fileUrl = parsed.url || ''
                        fileName = parsed.filename || 'Uploaded Document'
                        mimeType = parsed.mimeType || ''
                      } catch (_) {}
                    } else if (
                      fileData.startsWith('http') ||
                      fileData.startsWith('/') ||
                      fileData.includes('.')
                    ) {
                      fileUrl = fileData
                      fileName = fileData.split('/').pop() || 'Uploaded Document'
                    } else {
                      fileUrl = `/api/media/file/${fileData}`
                      fileName = `Asset (${fileData.substring(0, 8)}...)`
                      mimeType = 'image/png'
                    }
                  }

                  const isImage =
                    mimeType.startsWith('image/') ||
                    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl.split('?')[0]) ||
                    (!fileUrl.includes('.') && !fileData.toString().startsWith('http'))

                  return (
                    <div className="flex flex-col gap-3 w-full max-w-md pt-1">
                      {isImage && fileUrl ? (
                        <div className="w-full max-w-sm pt-1">
                          <img
                            src={fileUrl}
                            alt={fileName}
                            className="h-auto max-h-40 w-auto object-contain rounded-lg transition-all opacity-95 hover:opacity-100"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-base-content font-medium py-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-primary shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="truncate opacity-90">{fileName}</span>
                        </div>
                      )}
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-primary btn-outline max-w-fit font-bold shadow-sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Full File
                        </a>
                      )}
                    </div>
                  )
                })()
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <input
                      id={elementId}
                      type="file"
                      className={cn(
                        'file-input md:file-input-sm file-input-xs w-full',
                        error && 'file-input-error',
                      )}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploading((prev) => ({ ...prev, [fieldName]: true }))
                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('alt', (field as any).label || 'Uploaded file')
                        const res = await uploadFileAction(formData)
                        if (res.success && res.data) {
                          onChange(fieldName, res.data.id)
                        } else {
                          setError(res.error || 'Failed to upload file')
                        }
                        setUploading((prev) => ({ ...prev, [fieldName]: false }))
                      }}
                      disabled={disabled || uploading[fieldName]}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={errorId}
                    />
                    {uploading[fieldName] && (
                      <span className="loading loading-spinner text-primary" />
                    )}
                  </div>
                  {values[fieldName] && !uploading[fieldName] && (
                    <div className="flex items-center gap-2 text-xs text-success font-medium">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      File uploaded successfully
                    </div>
                  )}
                </>
              )}
              <input
                type="hidden"
                name={fieldName}
                required={isRequired || false}
                value={
                  typeof values[fieldName] === 'object'
                    ? (values[fieldName] as any)?.id || ''
                    : (values[fieldName] as string) || ''
                }
              />
            </div>
          </CustomBlockWrapper>
        </fieldset>
      )}

      {/* ── signature ────────────────────────────────────────────────────── */}
      {isSignature && (
        <fieldset className="fieldset w-full">
          <legend className={cn('fieldset-legend text-primary', noah.className)}>
            {SequenceBadge}
            {fieldLabel}
            {RequiredMark}
          </legend>
          <CustomBlockWrapper error={error}>
            <SignaturePadInput
              fieldName={fieldName}
              value={(values[fieldName] as string) || ''}
              onChange={onChange}
              disabled={disabled}
              isRequired={isRequired || false}
            />
          </CustomBlockWrapper>
        </fieldset>
      )}

      <FieldErrorMessage error={error} id={errorId} />
    </div>
  )
}
