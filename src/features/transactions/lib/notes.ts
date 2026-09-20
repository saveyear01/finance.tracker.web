/**
 * Keeping one note one note.
 *
 * Left alone, the same note forks into spellings — "Groceries", "groceries",
 * "groceries " — which read as one thing to a person and as three to
 * anything that groups them. The note field suggests what has been used
 * before; these two functions are what make a suggestion stick even when it
 * was typed out by hand rather than picked from the list.
 */

/** How two spellings are judged the same: case and surrounding space aside. */
const key = (note: string) => note.trim().toLowerCase()

/**
 * The suggestions worth offering for what has been typed so far, best first.
 *
 * Matches anywhere in the note, not just at the start — "load" should find
 * "Globe load" — but what starts with the query comes first, since that is
 * what someone typing is usually reaching for.
 *
 * An empty query returns everything, though the field only shows the list
 * once something has been typed: on a phone, tapping the note and being met
 * with every note you have ever written would bury the form behind it.
 */
export function matchNotes(query: string, suggestions: string[]): string[] {
  const typed = key(query)
  if (!typed) return suggestions

  const starts = suggestions.filter((note) => key(note).startsWith(typed))
  const contains = suggestions.filter(
    (note) => !key(note).startsWith(typed) && key(note).includes(typed),
  )
  return [...starts, ...contains]
}

/**
 * The note as it should be saved: the existing spelling whenever what was
 * typed is that note in all but case or stray spaces, and the trimmed input
 * otherwise.
 *
 * This is the quiet half of the feature. Picking from the list is the easy
 * path; this catches the typed-it-out-anyway one, which is how the drift
 * started. Anything genuinely new is left exactly as written — a nudge
 * toward one spelling, never a closed list.
 */
export function snapNote(note: string, suggestions: string[]): string {
  const typed = key(note)
  return suggestions.find((suggestion) => key(suggestion) === typed) ?? note.trim()
}
