import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChartPie, Loader2, X } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { AddCard } from '@/components/add-card'
import { EmptyState } from '@/components/layouts/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFunds } from '@/features/funds'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { useAllocation, useSaveAllocation } from '../hooks/use-allocation'
import {
  allocationSchema,
  totalOf,
  type AllocationFormValues,
} from '../schemas/allocation-schema'

/** What the total card says, and whether it reads as done. */
function totalStatus(total: number, rows: number): { text: string; done: boolean } {
  if (rows === 0) {
    return { text: 'No income split — income stays in Unallocated.', done: true }
  }
  if (total === 100) {
    return { text: 'Every income will be split like this.', done: true }
  }
  if (total < 100) {
    return { text: `${100 - total}% left to allocate.`, done: false }
  }
  return { text: `${total - 100}% over — lower something.`, done: false }
}

/**
 * The allocation: which funds every income is split into, and by how much.
 *
 * The whole list is one form and one save, because the 100% total spans every
 * row — saving rows one by one would pass through totals the API refuses.
 */
export function AllocationEditor() {
  const { rules, isLoading: loadingRules, isError, error } = useAllocation()
  const { funds, isLoading: loadingFunds } = useFunds()
  const saveAllocation = useSaveAllocation()

  // Only real, active funds can take a share: never Unallocated (that is
  // where income goes when there is no allocation), never archived.
  const eligible = useMemo(
    () => funds.filter((fund) => !fund.is_unallocated && fund.archived_at === null),
    [funds],
  )
  const nameOf = useMemo(() => new Map(funds.map((fund) => [fund.id, fund.name])), [funds])

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: { rules: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' })
  const watched = useWatch({ control, name: 'rules' }) ?? []

  // Load the saved allocation — and re-load after a save, so "dirty" resets
  // to what the server now holds.
  useEffect(() => {
    reset({
      rules: rules.map((rule) => ({
        fund_id: rule.fund_id,
        percentage: String(rule.percentage),
      })),
    })
  }, [rules, reset])

  const total = totalOf(watched)
  const status = totalStatus(total, watched.length)
  const chosen = new Set(watched.map((rule) => rule.fund_id))
  const canAdd = eligible.some((fund) => !chosen.has(fund.id))

  const onSubmit = handleSubmit((values) => {
    saveAllocation.mutate(
      {
        rules: values.rules.map((rule) => ({
          fund_id: rule.fund_id,
          percentage: Number(rule.percentage),
        })),
      },
      { onSuccess: () => toast.success('Income split saved.') },
    )
  })

  if (loadingRules || loadingFunds) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getApiErrorMessage(error, 'Could not load your income split.')}
        </AlertDescription>
      </Alert>
    )
  }

  // Nothing to allocate to yet — and no saved rules to show or clear.
  if (eligible.length === 0 && fields.length === 0) {
    return (
      <EmptyState
        icon={ChartPie}
        title="Create an allocation first"
        description="An income split divides your income across your allocations — Savings, Emergency Fund, Travel. Add some on the Funds page, under Allocations."
      />
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/* The running total — the one number this page is about. */}
      <section
        className="rounded-xl bg-secondary p-5 text-secondary-foreground"
        aria-live="polite"
      >
        <p className="text-sm text-secondary-foreground/70">Total</p>
        <p className="text-4xl font-semibold tabular-nums">{total}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary-foreground/15">
          <div
            className={cn(
              'h-full rounded-full transition-[width]',
              total > 100 ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-secondary-foreground/70">{status.text}</p>
      </section>

      {saveAllocation.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(saveAllocation.error)}</AlertDescription>
        </Alert>
      )}

      {/* At the top of the list, like adding everywhere else. A new row goes
          at the end: row order is the tie-break for spare cents, so adding
          one never changes which existing row gets them. */}
      <AddCard
        label={canAdd ? 'Add an allocation' : 'Every allocation is in the list'}
        disabled={!canAdd}
        onClick={() =>
          append({
            fund_id: '',
            // Pre-fill with what is left, so the last row usually completes
            // the 100% without any arithmetic.
            percentage: total < 100 ? String(100 - total) : '',
          })
        }
      />
      {!canAdd && eligible.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Need another?{' '}
          <Link to="/funds?tab=allocations" className="font-medium text-primary hover:underline">
            Create an allocation
          </Link>
        </p>
      )}

      {fields.length > 0 && (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const rowErrors = errors.rules?.[index]
            // Each picker offers the funds not already used by another row.
            const options = eligible.filter(
              (fund) => fund.id === watched[index]?.fund_id || !chosen.has(fund.id),
            )

            return (
              <li
                key={field.id}
                className="rounded-xl border border-border bg-card p-3 text-card-foreground"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Controller
                      control={control}
                      name={`rules.${index}.fund_id`}
                      render={({ field: select }) => (
                        <Select
                          value={select.value || null}
                          onValueChange={(value) => select.onChange(value ?? '')}
                        >
                          <SelectTrigger
                            className="h-11! w-full"
                            aria-label={`Allocation for row ${index + 1}`}
                            aria-invalid={Boolean(rowErrors?.fund_id)}
                          >
                            <SelectValue>
                              {(value) =>
                                value ? (
                                  (nameOf.get(value as string) ?? 'Unknown allocation')
                                ) : (
                                  <span className="text-muted-foreground">Choose an allocation</span>
                                )
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id}>
                                {fund.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError errors={[rowErrors?.fund_id]} />
                  </div>

                  <div className="w-24 shrink-0">
                    <div className="relative">
                      <Input
                        inputMode="numeric"
                        aria-label={`Percentage for row ${index + 1}`}
                        aria-invalid={Boolean(rowErrors?.percentage)}
                        placeholder="0"
                        className="h-11 pr-7 text-right text-base tabular-nums md:text-sm"
                        {...register(`rules.${index}.percentage`)}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                    <FieldError errors={[rowErrors?.percentage]} />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-1.5 shrink-0 rounded-full"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Array-level errors (the 100% rule) land on `rules.root`. */}
      <FieldError errors={[errors.rules?.root]} />

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={!isDirty || !status.done || saveAllocation.isPending}
      >
        {saveAllocation.isPending && <Loader2 className="animate-spin" />}
        {saveAllocation.isPending
          ? 'Saving…'
          : watched.length === 0 && isDirty
            ? 'Clear income split'
            : 'Save income split'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        When a split doesn't divide evenly to the centavo, the spare cents go to
        the allocation with the largest remainder — ties to the one listed first.
      </p>
    </form>
  )
}
