import { TransactionFeed } from '@/features/transactions'

export function TransactionsRoute() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <TransactionFeed />
    </div>
  )
}
