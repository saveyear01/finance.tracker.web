import axios from 'axios'

import { apiClient } from '@/lib/api-client'

import type { ExportFormat, ExportPart, ExportWindow } from '../lib/export-options'

export type ExportRequest = ExportWindow & {
  include: ExportPart[]
  format: ExportFormat
}

export type ExportedFile = { blob: Blob; filename: string }

/** The file name from `Content-Disposition: attachment; filename="…"`. */
function filenameOf(header: unknown): string | undefined {
  return typeof header === 'string' ? /filename="([^"]+)"/.exec(header)?.[1] : undefined
}

/**
 * `GET /api/export/` — the chosen parts for the window as one file: a CSV, a
 * zip of CSVs, or an Excel workbook. Built by the API, so a year of entries
 * is one request rather than pages fetched on the phone.
 *
 * Asked for as a blob, so an error's JSON body arrives as a blob too — it is
 * parsed back here, so `getApiErrorMessage` reads the API's own message.
 */
export async function downloadExport({
  start,
  end,
  include,
  format,
}: ExportRequest): Promise<ExportedFile> {
  const params = new URLSearchParams({ end, format })
  if (start) params.set('start', start)
  for (const part of include) params.append('include', part)

  try {
    const response = await apiClient.get<Blob>('/export/', {
      params,
      responseType: 'blob',
    })
    return {
      blob: response.data,
      filename:
        filenameOf(response.headers['content-disposition']) ??
        `finance-export_${start ?? 'all'}_to_${end}.${format === 'xlsx' ? 'xlsx' : 'zip'}`,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text())
      } catch {
        // Not JSON (a proxy's HTML page): leave it; the fallback message shows.
      }
    }
    throw error
  }
}

/** Hand the file to the browser as a download. */
export function saveFile({ blob, filename }: ExportedFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Revoked a moment later: Safari reads the URL after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
