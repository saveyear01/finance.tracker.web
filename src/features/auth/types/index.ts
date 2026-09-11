/** The themes the API accepts — the same list as `ThemePreference` there. */
export const THEMES = ['light', 'dark'] as const

export type ThemePreference = (typeof THEMES)[number]

/** Response of `GET /api/users/me/` and `POST /api/auth/login/` (`UserRead`). */
export type CurrentUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  /** ISO-8601, or null if the user has never signed in. */
  last_login: string | null
  /** Stored per user, so it follows them across devices. */
  theme: ThemePreference
  /** Whether a quick-unlock PIN is set. The PIN never leaves the server. */
  has_pin: boolean
  /** Derived server-side from first/last name. */
  name: string
}

/** Input for `PATCH /api/users/me/`. Only the fields sent are changed. */
export type ProfileUpdate = {
  first_name?: string
  last_name?: string
  theme?: ThemePreference
}

/** Input for `PUT /api/users/me/password/`. */
export type PasswordChange = {
  current_password: string
  new_password: string
}

export type LoginCredentials = {
  email: string
  password: string
}

/** Input for `PUT /api/users/me/pin/` — `pin: null` turns the PIN off. */
export type PinChange = {
  current_password: string
  /** Exactly six digits, as a string so a leading zero survives. */
  pin: string | null
}
