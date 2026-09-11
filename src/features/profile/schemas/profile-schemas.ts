import { z } from 'zod'

/** Mirrors the API's `PersonName`: trimmed, 1–50 characters. */
const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(50, `${label} must be 50 characters or fewer.`)

export const nameSchema = z.object({
  first_name: personName('First name'),
  last_name: personName('Last name'),
})

export type NameFormValues = z.infer<typeof nameSchema>

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    // Same bounds as the API's `PasswordChange.new_password`.
    new_password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(128, 'Use 128 characters or fewer.'),
    // Client-only: the API takes the new password once. A confirmation field
    // is what stops a typo from locking someone out of their own account.
    confirm_password: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.confirm_password !== values.new_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirm_password'],
        message: "Passwords don't match.",
      })
    }
    if (values.new_password && values.new_password === values.current_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_password'],
        message: 'Choose a password different from your current one.',
      })
    }
  })

export type PasswordFormValues = z.infer<typeof passwordSchema>
