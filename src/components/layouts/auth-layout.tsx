import type { ReactNode } from 'react'

import { Logo } from '@/components/logo'
import { env } from '@/config/env'

/**
 * The split screen behind sign in.
 *
 * A layout rather than inline in the route: a signup or password-reset page
 * would share the brand panel, and two copies would drift the moment the copy
 * changes.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  /** A link across to a sibling auth page, when there is one. */
  footer?: ReactNode
}) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/*
        Brand panel — decorative, hidden on small screens. Drawn in the
        theme's `secondary`, which is its dark navy (with white text) — the
        dark card of the design reference, from a token rather than a
        hard-coded black, so a theme change carries it along.
      */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-secondary p-12 text-secondary-foreground lg:flex lg:flex-col lg:justify-between"
      >
        <div className="pointer-events-none absolute -top-24 -right-16 size-96 rounded-full bg-primary/15 blur-3xl" />

        <Logo className="relative" wordmarkClassName="text-secondary-foreground" />

        <div className="relative max-w-md space-y-4">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Know where your money is,{' '}
            <span className="whitespace-nowrap text-primary">
              and what it's for.
            </span>
          </h2>
          <p className="text-base leading-relaxed text-secondary-foreground/70">
            Keep balances across banks, e-wallets and cash, and split each one
            across what it's meant for — without shuffling money between
            accounts.
          </p>
        </div>

        <p className="relative text-sm text-secondary-foreground/50">
          © {new Date().getFullYear()} {env.APP_NAME}. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />

          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          {footer && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

/**
 * Held in place while the initial `/users/me/` check resolves, so a form does
 * not appear only to be replaced by a redirect.
 */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-6" aria-hidden="true">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-11 animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
      <div className="h-11 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
