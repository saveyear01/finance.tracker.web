import { Navigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * Funds split into Wallets and Allocations on 2026-11-13. Its old URLs —
 * bookmarks, an installed app's last page, links in old notes — land on the
 * page that took over: `/funds?tab=…` on that list, a detail on its new path.
 */
export function FundsRedirect() {
  const [params] = useSearchParams()
  return <Navigate to={params.get('tab') === 'allocations' ? '/allocations' : '/wallets'} replace />
}

export function FundsDetailRedirect({ to }: { to: 'wallets' | 'allocations' }) {
  const { id } = useParams()
  return <Navigate to={`/${to}/${id ?? ''}`} replace />
}
