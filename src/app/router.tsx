import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layouts/app-layout'
import { ProtectedRoute } from '@/features/auth'

import { AnalyticsRoute } from './routes/analytics'
import { AnalyticsNoteRoute } from './routes/analytics-note'
import { DebtDetailRoute } from './routes/debt-detail'
import { DebtsRoute } from './routes/debts'
import { AllocationDetailRoute } from './routes/allocation-detail'
import { AllocationsRoute } from './routes/allocations'
import { FundsDetailRedirect, FundsRedirect } from './routes/funds-redirect'
import { HomeRoute } from './routes/home'
import { LoginRoute } from './routes/login'
import { ProfileRoute } from './routes/profile'
import { ProfileExportRoute } from './routes/profile-export'
import { ProfileIncomeSplitRoute } from './routes/profile-income-split'
import { ProfileSettingsRoute } from './routes/profile-settings'
import { TransactionsRoute } from './routes/transactions'
import { UpcomingDetailRoute } from './routes/upcoming-detail'
import { UpcomingRoute } from './routes/upcoming'
import { WalletDetailRoute } from './routes/wallet-detail'
import { WalletsRoute } from './routes/wallets'

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
          {/* Two pages since 2026-11-13; Funds' old URLs land on them. */}
          <Route path="/wallets" element={<WalletsRoute />} />
          <Route path="/wallets/:walletId" element={<WalletDetailRoute />} />
          <Route path="/allocations" element={<AllocationsRoute />} />
          <Route path="/allocations/:fundId" element={<AllocationDetailRoute />} />
          <Route path="/funds" element={<FundsRedirect />} />
          <Route path="/funds/wallets/:id" element={<FundsDetailRedirect to="wallets" />} />
          <Route path="/funds/allocations/:id" element={<FundsDetailRedirect to="allocations" />} />
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
