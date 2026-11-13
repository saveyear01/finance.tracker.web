import { Button } from '@/components/ui/button'
import { useIsCompact } from '@/hooks/use-compact'
import {
  NoteSearch,
  TransactionFeed,
  TransactionTable,
  useListFilters,
} from '@/features/transactions'

/**
 * Transactions. From `lg` a filterable table (design/large-screen.html,
 * rule 4); on a phone the feed as before, with only the note search on top —
 * the one filter that fits a phone's width without crowding the list. Both
 * read the search from the same `?q=`, so it survives a rotate or a resize.
 */
export function TransactionsRoute() {
  const compact = useIsCompact()

  if (!compact) {
    return (
      <div className="mx-auto w-full max-w-310">
        <TransactionTable />
      </div>
    )
  }

  return <PhoneTransactions />
}

function PhoneTransactions() {
  const { filters, update } = useListFilters()
  const q = filters.q.trim()

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <NoteSearch value={q} onSearch={(next) => update({ q: next })} />
      <TransactionFeed
        filter={q ? { q } : undefined}
        keepPrevious
        empty={
          q
            ? {
                title: `No notes match “${q}”`,
                description: 'Try another word.',
                action: (
                  <Button variant="outline" onClick={() => update({ q: '' })}>
                    Clear search
                  </Button>
                ),
              }
            : undefined
        }
      />
    </div>
  )
}
