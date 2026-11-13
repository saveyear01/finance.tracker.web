import { useEffect, useRef } from 'react'

/**
 * Loads the next page as the end of a list scrolls into view — the phone
 * feed's and the table's infinite scroll, so both behave alike.
 *
 * A sentinel under the list is watched with an IntersectionObserver rather
 * than listening to scroll events: no work runs while scrolling, and it works
 * inside any scroll container. The margin starts the next fetch a little
 * before the end is reached, so a steady scroll rarely waits.
 *
 * Attach the returned ref to the sentinel. A "Load more" button should sit in
 * the same place as the fallback — for keyboard and screen-reader users, and
 * for a screen tall enough that the sentinel shows before any scroll.
 */
export function useLoadMore<T extends HTMLElement>({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => unknown
}) {
  const sentinel = useRef<T>(null)

  useEffect(() => {
    const node = sentinel.current
    // Stop watching after a failed page: retrying on every scroll would hammer
    // the API. The button offers the retry instead.
    if (!node || !hasNextPage || isFetchNextPageError) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  return sentinel
}
