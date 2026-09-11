import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type PickerOption = { value: string; label: string; detail?: string }

/**
 * A labelled Select bound to a react-hook-form field holding an id string
 * ('' for none). Base UI's Select needs a formatter to show the label of the
 * picked value rather than the value itself; `detail` is shown on the right
 * of an option (a balance, say). Shared by the ledger's action drawer and
 * the upcoming-expense drawers.
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
  const labelOf = new Map(options.map((option) => [option.value, option.label]))
  const NONE = '__none__'

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value || null}
            onValueChange={(value) => {
              field.onChange(value === NONE ? '' : (value ?? ''))
              onPicked?.()
            }}
          >
            <SelectTrigger className="h-11! w-full" aria-label={label} aria-invalid={Boolean(error)}>
              <SelectValue>
                {(value) =>
                  value ? (
                    (labelOf.get(value as string) ?? '—')
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clearable && (
                <SelectItem value={NONE}>
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
              )}
              {options.length === 0 && !clearable ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Nothing to choose here.</p>
              ) : (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex w-full justify-between gap-3">
                      <span>{option.label}</span>
                      {option.detail && (
                        <span className="text-muted-foreground tabular-nums">{option.detail}</span>
                      )}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError errors={[error]} />
    </div>
  )
}
