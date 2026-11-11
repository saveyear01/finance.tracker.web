import { useId } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { Picker, type PickerOption } from '@/components/picker'
import { FieldError } from '@/components/ui/field'

export type { PickerOption }

/**
 * A labelled `Picker` bound to a react-hook-form field holding an id string
 * ('' for none) — a bottom sheet on a phone, a popover on a wider screen.
 * `detail` is shown on the right of an option (a balance, say). Shared by
 * the ledger's action drawer and the upcoming-expense and debt drawers.
 *
 * For a short FIXED list (two or three options that never grow) use a
 * `SegmentedControl` instead: one tap, every option in view.
 */
export function FormPicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  error,
  onPicked,
  clearable = false,
}: {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder: string
  options: PickerOption[]
  error?: { message?: string }
  onPicked?: () => void
  /** Offer a first option that sets the field back to none. */
  clearable?: boolean
}) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      {/* A real label, so tapping it opens the picker like tapping the field. */}
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Picker
            id={id}
            value={field.value ?? ''}
            onChange={(value) => {
              field.onChange(value)
              onPicked?.()
            }}
            options={options}
            label={label}
            placeholder={placeholder}
            invalid={Boolean(error)}
            clearable={clearable}
          />
        )}
      />
      <FieldError errors={[error]} />
    </div>
  )
}
