/**
 * Public surface of the allocations feature. Nothing outside
 * `features/allocations` should import from its subfolders directly.
 */
export { AllocationBanner } from './components/allocation-banner'
export { AllocationEditor } from './components/allocation-editor'
export { useAllocation, useSaveAllocation } from './hooks/use-allocation'
export { allocationKeys } from './api/allocations-keys'
export type { Allocation, AllocationRule } from './types'
