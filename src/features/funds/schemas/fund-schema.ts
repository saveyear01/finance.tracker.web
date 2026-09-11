import { z } from 'zod'

/** Mirrors the API's reserved name, so the form says so before a round trip. */
const RESERVED = 'unallocated'

export const fundSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be 100 characters or fewer.')
    .refine(
      (value) => value.toLowerCase() !== RESERVED,
      '“Unallocated” is reserved for money that has no allocation yet.',
    ),
})

export type FundFormValues = z.infer<typeof fundSchema>
