import { useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useReorderDebts } from '../hooks/use-debts'
import { formatRate, ORDER_PRESETS, rankBy, type OrderPreset } from '../lib/debt-meta'
import type { Debt } from '../types'

/** One debt being placed: a drag handle, its rank, and ▲▼ for exact moves. */
function SortableDebt({
  debt,
  rank,
  count,
  onMove,
}: {
  debt: Debt
  rank: number
  count: number
  onMove: (offset: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: debt.id })
  const rate = formatRate(debt.current_rate)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative grid grid-cols-[2.5rem_1.75rem_minmax(0,1fr)_auto] items-center gap-x-2 border-border bg-card py-2 pr-3 pl-1 not-first:border-t',
        isDragging && 'z-10 rounded-xl border bg-muted ring-2 ring-ring/40',
      )}
    >
      {/* The handle alone starts a drag, so the page still scrolls under a
          thumb anywhere else on the row. touch-none keeps the browser from
          taking the gesture for a scroll. */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="grid size-10 cursor-grab touch-none place-items-center rounded-lg text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        aria-label={`Drag ${debt.name} to reorder`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <span className="grid size-7 place-items-center rounded-full bg-muted text-xs font-bold tabular-nums">
        {rank}
      </span>
      <div className="min-w-0">
        <p className="font-medium break-words">{debt.name}</p>
        <p className="text-xs text-muted-foreground">
          {[rate, `${formatMoney(debt.remaining)} left`].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          disabled={rank === 1}
          onClick={() => onMove(-1)}
          aria-label={`Move ${debt.name} up`}
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10"
          disabled={rank === count}
          onClick={() => onMove(1)}
          aria-label={`Move ${debt.name} down`}
        >
          <ChevronDown />
        </Button>
      </div>
    </li>
  )
}

/**
 * Put the open debts in the order you're paying them down.
 *
 * Drag a row by its handle, or move it a place with ▲▼ — the buttons are
 * there for exact moves and for anyone not dragging (a screen reader, a
 * keyboard; the handle takes the arrow keys too). The two presets rank the
 * whole list in one tap — highest rate first saves the most interest,
 * smallest balance first clears a debt soonest — and the rows can still be
 * moved after.
 *
 * Nothing is saved until Done, and then in one request: the order is the
 * household's whole list, so it is replaced as a whole. Paid-off debts aren't
 * ranked here; they keep their places after the open ones, so one reopened
 * by a charge comes back where it was.
 */
export function DebtOrderEditor({
  debts,
  onClose,
}: {
  /** Every debt of the household, as the list has them (open first). */
  debts: Debt[]
  onClose: () => void
}) {
  const reorder = useReorderDebts()
  const openDebts = debts.filter((debt) => debt.status === 'open')
  const paidOff = debts.filter((debt) => debt.status !== 'open')
  const byId = new Map(openDebts.map((debt) => [debt.id, debt]))

  const [ids, setIds] = useState(() => openDebts.map((debt) => debt.id))
  const [preset, setPreset] = useState<OrderPreset | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const moved = (next: string[]) => {
    setIds(next)
    setPreset(null)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    moved(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }

  const applyPreset = (value: OrderPreset) => {
    setIds(rankBy(openDebts, value).map((debt) => debt.id))
    setPreset(value)
  }

  const changed = ids.some((id, index) => id !== openDebts[index]?.id)

  const save = () => {
    if (!changed) return onClose()
    reorder.mutate([...ids, ...paidOff.map((debt) => debt.id)], {
      onSuccess: () => {
        toast.success('Priority saved.')
        onClose()
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Edit order</h2>
          <p className="text-sm text-muted-foreground">
            Drag a row, or use the arrows. Saved when you tap Done.
          </p>
        </div>
        <Button onClick={save} disabled={reorder.isPending} className="h-10 px-4">
          {reorder.isPending && <Loader2 className="animate-spin" />}
          Done
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Rank by">
          {ORDER_PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={preset === option.value}
              onClick={() => applyPreset(option.value)}
              className={cn(
                'h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                preset === option.value
                  ? 'border-transparent bg-secondary text-secondary-foreground'
                  : 'border-border bg-card hover:bg-muted/60',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="px-0.5 text-xs text-muted-foreground">
          {ORDER_PRESETS.map((option, index) => (
            <span key={option.value}>
              {index > 0 && ', '}
              <span className="font-semibold text-foreground">{option.label}</span> {option.hint}
            </span>
          ))}
          . You can still move rows after.
        </p>
      </div>

      {reorder.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(reorder.error)}</AlertDescription>
        </Alert>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="card-surface text-card-foreground">
            {ids.map((id, index) => {
              const debt = byId.get(id)
              if (!debt) return null
              return (
                <SortableDebt
                  key={id}
                  debt={debt}
                  rank={index + 1}
                  count={ids.length}
                  onMove={(offset) => moved(arrayMove(ids, index, index + offset))}
                />
              )
            })}
          </ul>
        </SortableContext>
      </DndContext>

      {paidOff.length > 0 && (
        <p className="px-0.5 text-xs text-muted-foreground">
          Paid-off debts aren't ranked. If a charge reopens one, it goes back to its old place.
        </p>
      )}

      <Button variant="outline" className="h-11 w-full" onClick={onClose} disabled={reorder.isPending}>
        Cancel
      </Button>
    </div>
  )
}
