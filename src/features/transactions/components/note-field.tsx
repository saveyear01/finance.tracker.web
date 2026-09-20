import { useMemo } from 'react'

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
} from '@/components/ui/autocomplete'

import { useNoteSuggestions } from '../hooks/use-transactions'
import { matchNotes, snapNote } from '../lib/notes'
import type { EditableAction } from '../types'

/**
 * The note on an entry, type-ahead over the notes already used on this kind
 * of action.
 *
 * Free text throughout — the list is a shortcut, not a set of choices. What
 * it buys is that "Groceries" stays one note instead of quietly becoming
 * four: picking a suggestion reuses a spelling exactly, and typing one out
 * anyway is snapped onto the existing spelling when it differs only in case
 * or spacing (`snapNote`, applied here on blur so the change is visible, and
 * again when the form is submitted in case the keyboard is closed by
 * submitting).
 *
 * Suggestions come from a list cached per action, filtered here as you type:
 * no request per keystroke, and an entry logged offline still gets snapped
 * onto the last list that was fetched.
 */
export function NoteField({
  action,
  value,
  onChange,
  placeholder = 'Add notes…',
}: {
  /** Which kind of action's notes to suggest; null while the drawer is shut. */
  action: EditableAction | null
  value: string
  onChange: (note: string) => void
  placeholder?: string
}) {
  const { suggestions } = useNoteSuggestions(action)
  const matches = useMemo(() => matchNotes(value, suggestions), [value, suggestions])

  return (
    <Autocomplete
      value={value}
      onValueChange={onChange}
      items={matches}
      // Already filtered, and ranked by how much the note is used rather than
      // how closely it matches — Base UI's own filter would undo both.
      filter={null}
    >
      <AutocompleteInput
        placeholder={placeholder}
        aria-label="Note"
        className="h-11 text-base md:text-sm"
        onBlur={() => onChange(snapNote(value, suggestions))}
      />
      {matches.length > 0 && (
        <AutocompleteContent>
          {matches.map((note) => (
            <AutocompleteItem key={note} value={note}>
              {note}
            </AutocompleteItem>
          ))}
        </AutocompleteContent>
      )}
    </Autocomplete>
  )
}
