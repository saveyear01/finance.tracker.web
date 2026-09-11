/**
 * One line of context under the header.
 *
 * Deliberately not an <h1>: dashboard-01's SiteHeader already renders the page
 * name as the h1, and a second one both duplicates the title on screen and
 * gives the page two top-level headings.
 */
export function PageIntro({ children }: { children: string }) {
  return <p className="-mt-1 mb-2 text-sm text-muted-foreground">{children}</p>
}
