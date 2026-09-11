import { useEffect, useState } from 'react'
import { Delete, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-client'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'

import { useLogout } from '../hooks/use-logout'
import { useUnlock } from '../hooks/use-pin'
import type { CurrentUser } from '../types'

const LENGTH = 6
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const

/**
 * The app, locked: a full screen — not an overlay, so nothing of the app is
 * mounted behind it — with six dots and a phone-style keypad. The sixth
 * digit sends the PIN; a wrong one shakes the dots, clears them and says how
 * many tries are left. After the fifth the server signs out every session,
 * and this sends the user to the login page to use their password.
 *
 * Digits and Backspace work from a keyboard too.
 */
export function LockScreen({ user }: { user: CurrentUser }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(0)
  const unlock = useUnlock()
  const logout = useLogout()
  const navigate = useNavigate()

  const press = (key: (typeof KEYS)[number]) => {
    if (unlock.isPending || key === '') return
    unlock.reset()
    setPin((current) =>
      key === 'back' ? current.slice(0, -1) : current.length < LENGTH ? current + key : current,
    )
  }

  // The sixth digit is the submit button.
  useEffect(() => {
    if (pin.length !== LENGTH) return
    unlock.mutate(pin, {
      onError: (error) => {
        setPin('')
        setShake((n) => n + 1)
        if (getApiErrorCode(error) === 'pin_locked') {
          // Signed out everywhere — the password is the only way back in.
          logout.mutate(undefined, {
            onSettled: () =>
              navigate('/login', {
                replace: true,
                state: { notice: 'Too many wrong PINs, so you were signed out. Sign in with your password.' },
              }),
          })
        }
      },
    })
    // Keyed on the PIN alone: `unlock` and friends change identity each render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key as (typeof KEYS)[number])
      else if (event.key === 'Backspace') press('back')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const usePassword = () =>
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="size-16">
          <AvatarFallback className="bg-secondary text-xl font-semibold text-secondary-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg font-semibold">Welcome back, {user.first_name}</h1>
          <p className="text-sm text-muted-foreground">Enter your PIN to unlock.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div
          key={shake}
          role="status"
          aria-label={`${pin.length} of ${LENGTH} digits entered`}
          className={cn('flex gap-3', shake > 0 && 'animate-[pin-shake_0.35s_ease-in-out] motion-reduce:animate-none')}
        >
          {Array.from({ length: LENGTH }, (_, index) => (
            <span
              key={index}
              className={cn(
                'size-3.5 rounded-full border-2 transition-colors',
                index < pin.length
                  ? 'border-primary bg-primary'
                  : unlock.isError
                    ? 'border-destructive'
                    : 'border-muted-foreground/40',
              )}
            />
          ))}
        </div>
        <p className="h-5 text-sm" aria-live="polite">
          {unlock.isPending ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : unlock.isError ? (
            <span className="text-destructive">{getApiErrorMessage(unlock.error)}</span>
          ) : null}
        </p>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-2">
        {KEYS.map((key, index) =>
          key === '' ? (
            <span key={index} aria-hidden="true" />
          ) : (
            <button
              key={key}
              type="button"
              aria-label={key === 'back' ? 'Delete last digit' : key}
              disabled={unlock.isPending}
              onClick={() => press(key)}
              className="grid h-16 place-items-center rounded-full text-2xl font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-accent disabled:opacity-50"
            >
              {key === 'back' ? <Delete className="size-6 text-muted-foreground" /> : key}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={usePassword}
        className="text-sm font-medium text-primary hover:underline"
      >
        Forgot your PIN? Sign in with your password
      </button>
    </main>
  )
}
