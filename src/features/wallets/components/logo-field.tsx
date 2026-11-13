import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Loader2, Plus, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

import { LOGO_MAX_BYTES, LOGO_TYPES } from '../api/wallets-api'
import { useRemoveWalletLogo, useUploadWalletLogo } from '../hooks/use-mutate-wallet'
import { useWalletLogo } from '../hooks/use-wallet-logo'
import type { Wallet } from '../types'

const EXTENSIONS = /\.(png|jpe?g|svg)$/i

/** Why a file can't be a logo, before it is sent — the API checks again,
 * from the bytes. Null when it looks fine. */
function problemWith(file: File): string | null {
  const known = LOGO_TYPES.includes(file.type) || (file.type === '' && EXTENSIONS.test(file.name))
  if (!known) return 'Upload a PNG, JPG or SVG image.'
  if (file.size > LOGO_MAX_BYTES) {
    const size =
      file.size >= 1024 * 1024
        ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`
    return `Too large (${size}). Use one under 256 KB.`
  }
  return null
}

/**
 * The wallet drawer's Logo field (design/wallet-logos.html): pick or drop a
 * PNG, JPG or SVG.
 *
 * Editing a wallet, a file uploads AT ONCE — Replace / Remove too — apart
 * from the drawer's Save, which is about the name and type. A new wallet has
 * no id yet, so the file is held (`pending`) and the drawer uploads it just
 * after creating the wallet.
 *
 * The logo shows as it is, no circle (the user's call), at the size the
 * lists will show it larger.
 */
export function LogoField({
  wallet,
  pending,
  onPendingChange,
}: {
  /** The wallet being edited, or null for a new one. */
  wallet: Wallet | null
  /** A new wallet's chosen file, uploaded once the wallet exists. */
  pending: File | null
  onPendingChange: (file: File | null) => void
}) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadWalletLogo()
  const remove = useRemoveWalletLogo()
  const [problem, setProblem] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  // The wallet the drawer was opened with doesn't change while it is open,
  // so the URL is tracked here from each upload's / removal's answer.
  const [logoUrl, setLogoUrl] = useState(wallet?.logo_url ?? null)
  const saved = useWalletLogo(logoUrl)

  // A new wallet's file previews from the file itself; the URL is let go
  // when the file changes or the field goes.
  const pendingPreview = useMemo(
    () => (pending ? URL.createObjectURL(pending) : undefined),
    [pending],
  )
  useEffect(
    () => () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    },
    [pendingPreview],
  )

  const preview = wallet ? saved : pendingPreview
  const busy = upload.isPending || remove.isPending
  const error = problem ?? (upload.isError ? getApiErrorMessage(upload.error) : null)

  const take = (file: File | undefined) => {
    if (!file) return
    upload.reset()
    const why = problemWith(file)
    setProblem(why)
    if (why) return
    if (!wallet) return onPendingChange(file)
    upload.mutate({ id: wallet.id, file }, { onSuccess: (next) => setLogoUrl(next.logo_url) })
  }

  const clear = () => {
    setProblem(null)
    upload.reset()
    if (!wallet) return onPendingChange(null)
    remove.mutate(wallet.id, { onSuccess: (next) => setLogoUrl(next.logo_url) })
  }

  const has = Boolean(preview) || (wallet ? Boolean(logoUrl) : Boolean(pending))
  const fileName = pending?.name

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        take(event.dataTransfer.files[0])
      }}
      className={cn(
        'flex items-center gap-3.5 rounded-xl border bg-background p-3 transition-colors',
        has ? 'border-border' : 'border-dashed border-border',
        dragging && 'border-primary bg-accent',
        error && 'border-destructive',
      )}
    >
      {preview ? (
        <img
          src={preview}
          alt="Logo preview"
          className="size-14 shrink-0 object-contain"
          draggable={false}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-muted-foreground text-muted-foreground',
            error && 'border-destructive text-destructive',
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : error ? (
            <TriangleAlert className="size-5" />
          ) : (
            <Plus className="size-5" />
          )}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {dragging
            ? 'Drop to use as the logo'
            : has
              ? (fileName ?? 'Logo')
              : 'Add a logo'}
        </p>
        <p
          className={cn('text-xs text-muted-foreground', error && 'font-semibold text-destructive')}
          role={error ? 'alert' : undefined}
        >
          {error ??
            (busy
              ? 'Saving…'
              : has
                ? wallet
                  ? 'Saved · shown wherever this wallet appears'
                  : 'Saved with the wallet'
                : 'PNG, JPG or SVG · up to 256 KB')}
        </p>
        {has && (
          <div className="mt-1.5 flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={busy}
              onClick={clear}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {!has && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {error ? 'Try another' : 'Upload'}
        </Button>
      )}

      <input
        ref={input}
        id={inputId}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        aria-label="Logo file"
        onChange={(event) => {
          take(event.target.files?.[0])
          // The same file chosen again after a refusal still fires.
          event.target.value = ''
        }}
      />
    </div>
  )
}
