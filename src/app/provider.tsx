import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, useTheme } from 'next-themes'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from '@/lib/query-client'

/**
 * `--background` for each theme, as hex. The browser chrome colour cannot
 * read a CSS variable, so these duplicate index.css — keep them in step.
 */
const BROWSER_CHROME = { light: '#fcfcfc', dark: '#000000' } as const

/**
 * Point `<meta name="theme-color">` at the active theme, so the mobile status
 * bar matches the page instead of staying light in dark mode. index.html
 * ships the light value for the first paint.
 */
function ThemeColorMeta() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', BROWSER_CHROME[resolvedTheme === 'dark' ? 'dark' : 'light'])
  }, [resolvedTheme])

  return null
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    /*
     * Light by default; a signed-in user's saved preference then takes over
     * (see `useSyncUserTheme`). `enableSystem` is off: the choice is the
     * user's toggle, stored on their account, not the phone's setting.
     * next-themes' localStorage copy only caches that choice so a reload
     * paints in the right theme before `/users/me/` answers.
     */
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ThemeColorMeta />
      <QueryClientProvider client={queryClient}>
        {/* The sidebar's collapsed-state tooltips need this ancestor. */}
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
