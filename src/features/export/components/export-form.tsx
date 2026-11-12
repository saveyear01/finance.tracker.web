import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'

import { DatePicker } from '@/components/date-picker'
import { SegmentedControl } from '@/components/segmented-control'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'

import { downloadExport, saveFile, type ExportedFile } from '../api/export-api'
import {
  DEFAULT_PARTS,
  FORMAT_OPTIONS,
  PARTS,
  PERIOD_OPTIONS,
  daysIn,
  describeWindow,
  presetWindow,
  type ExportFormat,
  type ExportPart,
  type ExportPeriod,
  type ExportWindow,
} from '../lib/export-options'
import { ExportDoneDrawer } from './export-done-drawer'

/**
 * Profile → Export data: pick a period, tick what goes in, pick a format,
 * download. The API builds the file; this page only chooses.
 */
export function ExportForm() {
  const today = localToday()
  const [period, setPeriod] = useState<ExportPeriod>('month')
  // Custom starts as this month, so the pickers open somewhere sensible.
  const [custom, setCustom] = useState(() => {
    const month = presetWindow('month', today)
    return { start: month.start as string, end: month.end }
  })
  const [parts, setParts] = useState<ExportPart[]>(DEFAULT_PARTS)
  const [fileFormat, setFileFormat] = useState<ExportFormat>('csv')
  const [done, setDone] = useState<{
    file: ExportedFile
    parts: ExportPart[]
    range: ExportWindow
  } | null>(null)

  const range: ExportWindow = period === 'custom' ? custom : presetWindow(period, today)
  const backwards = period === 'custom' && custom.end < custom.start
  // In the API's fixed order, whatever order the boxes were ticked in.
  const chosen = PARTS.filter((part) => parts.includes(part.value))
  // Debts are two tables: the debts, and their payments and charges.
  const tables = chosen.length + (parts.includes('debts') ? 1 : 0)

  const exporting = useMutation({ mutationFn: downloadExport })

  const toggle = (part: ExportPart, on: boolean) =>
    setParts((current) => (on ? [...current, part] : current.filter((p) => p !== part)))

  const download = () =>
    exporting.mutate(
      {
        ...range,
        include: chosen.map((part) => part.value),
        format: fileFormat,
      },
      {
        onSuccess: (file) => {
          saveFile(file)
          setDone({ file, parts: chosen.map((part) => part.value), range })
        },
      },
    )

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="export-period">
        <h2 id="export-period" className="text-sm font-semibold">
          Period
        </h2>
        <SegmentedControl
          variant="chips"
          label="Period"
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
        />
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="export-from">From</Label>
              <DatePicker
                id="export-from"
                compact
                value={custom.start}
                onChange={(start) => setCustom((c) => ({ ...c, start }))}
                invalid={backwards}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="export-to">To</Label>
              <DatePicker
                id="export-to"
                compact
                value={custom.end}
                onChange={(end) => setCustom((c) => ({ ...c, end }))}
                invalid={backwards}
              />
            </div>
          </div>
        )}
        <p className={backwards ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {backwards
            ? 'The end date is before the start date.'
            : range.start === null
              ? `${describeWindow(range)} · since your first entry`
              : `${describeWindow(range)} · ${daysIn({ start: range.start, end: range.end })} days`}
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="export-parts">
        <h2
          id="export-parts"
          className="flex items-baseline justify-between gap-2 text-sm font-semibold"
        >
          What’s included
          <span className="text-xs font-normal text-muted-foreground">
            {chosen.length} of {PARTS.length}
          </span>
        </h2>
        <ul className="divide-y divide-border overflow-hidden card-surface">
          {PARTS.map((part) => (
            <li key={part.value}>
              {/* A label, so the whole row ticks — not just the small box. */}
              <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 font-medium">
                    {part.label}
                    {part.allTime && (
                      <span className="rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                        All time
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">{part.description}</span>
                </span>
                <Checkbox
                  className="size-5"
                  checked={parts.includes(part.value)}
                  onCheckedChange={(on) => toggle(part.value, on)}
                />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="export-format">
        <h2 id="export-format" className="text-sm font-semibold">
          Format
        </h2>
        <SegmentedControl
          label="Format"
          value={fileFormat}
          onChange={setFileFormat}
          options={FORMAT_OPTIONS}
        />
        <p className="text-sm text-muted-foreground">
          {fileFormat === 'csv'
            ? tables > 1
              ? `${tables} CSV files in one .zip · opens in any spreadsheet`
              : 'One CSV file · opens in any spreadsheet'
            : tables > 1
              ? `One Excel file with ${tables} sheets`
              : 'One Excel file'}
        </p>
      </section>

      {exporting.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessage(exporting.error, "Couldn't make the export. Try again.")}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Button
          size="lg"
          className="h-12 w-full"
          disabled={chosen.length === 0 || backwards || exporting.isPending}
          onClick={download}
        >
          {exporting.isPending ? <Loader2 className="animate-spin" /> : <Download />}
          {exporting.isPending
            ? 'Preparing…'
            : chosen.length === 0
              ? 'Pick something to export'
              : 'Download'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Amounts are plain numbers in your currency · dates as YYYY-MM-DD
        </p>
      </div>

      <ExportDoneDrawer done={done} onOpenChange={(open) => !open && setDone(null)} />
    </div>
  )
}
