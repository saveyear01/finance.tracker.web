/**
 * Public surface of the onboarding feature — Home's first-run checklist.
 * It only reads other features' data; nothing outside `features/onboarding`
 * should import from its subfolders directly.
 */
export { SetupChecklist } from './components/setup-checklist'
export { useSetupProgress, type SetupProgress, type SetupStep } from './hooks/use-setup-progress'
