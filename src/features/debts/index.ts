/**
 * Public surface of the debts feature — what you owe, and paying it down.
 * Nothing outside `features/debts` should import from its subfolders
 * directly.
 *
 * Dependencies run one way: debts uses wallets, funds and transactions;
 * none of them imports anything from here.
 */
export { ChargeDrawer } from './components/charge-drawer'
export { DebtDetail } from './components/debt-detail'
export { DebtDrawer } from './components/debt-drawer'
export { DebtList } from './components/debt-list'
export { DeleteDebtDialog } from './components/delete-debt-dialog'
export { PayDebtDrawer } from './components/pay-debt-drawer'
export { RatesDrawer } from './components/rates-drawer'
export { debtKeys } from './api/debt-keys'
export { useDebts } from './hooks/use-debts'
export type { Debt, DebtCharge } from './types'
