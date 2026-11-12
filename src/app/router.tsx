import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layouts/app-layout'
import { ProtectedRoute } from '@/features/auth'

import { AnalyticsRoute } from './routes/analytics'
import { AnalyticsNoteRoute } from './routes/analytics-note'
import { DebtDetailRoute } from './routes/debt-detail'
import { DebtsRoute } from './routes/debts'
import { FundsRoute } from './routes/funds'
import { FundsAllocationDetailRoute } from './routes/funds-allocation-detail'
import { FundsWalletDetailRoute } from './routes/funds-wallet-detail'
import { HomeRoute } from './routes/home'
import { LoginRoute } from './routes/login'
import { ProfileRoute } from './routes/profile'
import { ProfileExportRoute } from './routes/profile-export'
import { ProfileIncomeSplitRoute } from './routes/profile-income-split'
import { ProfileSettingsRoute } from './routes/profile-settings'
import { TransactionsRoute } from './routes/transactions'
import { UpcomingDetailRoute } from './routes/upcoming-detail'
import { UpcomingRoute } from './routes/upcoming'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        {/*
         * One guard around the whole signed-in shell, so a new page is a
         * <Route> and nothing else — there is no per-page check to forget.
         */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRoute />} />
          {/* Wallets and Funds became one page; old links land on its tab. */}
          <Route path="/wallets" element={<Navigate to="/funds?tab=wallets" replace />} />
          <Route path="/funds" element={<FundsRoute />} />
          <Route path="/funds/wallets/:walletId" element={<FundsWalletDetailRoute />} />
          <Route path="/funds/allocations/:fundId" element={<FundsAllocationDetailRoute />} />
          <Route path="/transactions" element={<TransactionsRoute />} />
          <Route path="/upcoming" element={<UpcomingRoute />} />
          <Route path="/upcoming/:expenseId/:dueDate" element={<UpcomingDetailRoute />} />
          <Route path="/analytics" element={<AnalyticsRoute />} />
          <Route path="/analytics/note" element={<AnalyticsNoteRoute />} />
          <Route path="/debts" element={<DebtsRoute />} />
          <Route path="/debts/:debtId" element={<DebtDetailRoute />} />
          <Route path="/profile" element={<ProfileRoute />} />
          <Route path="/profile/settings" element={<ProfileSettingsRoute />} />
          <Route path="/profile/income-split" element={<ProfileIncomeSplitRoute />} />
          <Route path="/profile/export" element={<ProfileExportRoute />} />
          <Route
            path="/profile/allocation"
            element={<Navigate to="/profile/income-split" replace />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
