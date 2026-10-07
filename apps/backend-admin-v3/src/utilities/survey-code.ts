import { randomInt } from 'node:crypto'
import type { Payload } from 'payload'

/**
 * 32 characters, excludes 0/O/1/I/L to avoid visual ambiguity when a recipient types the code
 * back in by hand. Used for the random, per-recipient half of an invitation code.
 */
export const SURVEY_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Length of the random per-recipient prefix, e.g. the `ABC123` in `ABC123-A1`. */
const INVITATION_RANDOM_LENGTH = 6
const MAX_GENERATION_ATTEMPTS = 5

/**
 * Survey-form codes: a short identifier assigned to each survey form and used as the suffix of
 * every invitation code for that form (invitation `ABC123-A1` belongs to the survey whose code
 * is `A1`). Built from whole `letter+digit` pairs (`A1`, then `A2`..`A9`, `B1`.. and so on,
 * skipping visually ambiguous letters/digits) — 207 combinations per pair. Codes are never
 * reused (a deleted form's code is gone for good), so once a length is fully used up the next
 * code grows by one more pair rather than recycling a shorter one: 2 chars (207 codes) → 4 chars
 * (207² ≈ 42,849) → 6 chars (207³ ≈ 8.87M). See `MIN/MAX_SURVEY_FORM_CODE_PAIRS`.
 *
 * Plain string sort only orders correctly *within one fixed length* (each pair position compares
 * before the next, exactly like place values in a number) — never across mixed lengths, so
 * callers must always compare same-length codes only (see `nextAvailableSurveyFormCode`).
 */
export const SURVEY_FORM_CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ' // no I, O, L
export const SURVEY_FORM_CODE_DIGITS = '123456789' // no 0

/** Every survey-form code is built from whole `letter+digit` pairs, e.g. `A1`, `A1B2`. */
const SURVEY_FORM_CODE_PAIR_LENGTH = 2

/** Minimum (2 chars) / maximum (6 chars) survey-form code length, in pairs. */
const MIN_SURVEY_FORM_CODE_PAIRS = 1
const MAX_SURVEY_FORM_CODE_PAIRS = 3

/** The first survey-form code ever handed out, and the first code of any newly-grown length. */
export const FIRST_SURVEY_FORM_CODE = `${SURVEY_FORM_CODE_LETTERS[0]}${SURVEY_FORM_CODE_DIGITS[0]}`

function isWellFormedSurveyFormCode(code: string): boolean {
  if (code.length % SURVEY_FORM_CODE_PAIR_LENGTH !== 0) return false
  for (let i = 0; i < code.length; i += SURVEY_FORM_CODE_PAIR_LENGTH) {
    if (SURVEY_FORM_CODE_LETTERS.indexOf(code[i]) === -1) return false
    if (SURVEY_FORM_CODE_DIGITS.indexOf(code[i + 1]) === -1) return false
  }
  return true
}

/** Increments one `letter+digit` pair. Returns `null` when `pair` is already `Z9` — the last
 * pair in the sequence, and the caller's cue to reset-and-carry to the pair on its left. */
function nextPair(pair: string): string | null {
  const letterIndex = SURVEY_FORM_CODE_LETTERS.indexOf(pair[0])
  const digitIndex = SURVEY_FORM_CODE_DIGITS.indexOf(pair[1])

  if (digitIndex < SURVEY_FORM_CODE_DIGITS.length - 1) {
    return `${pair[0]}${SURVEY_FORM_CODE_DIGITS[digitIndex + 1]}`
  }
  if (letterIndex < SURVEY_FORM_CODE_LETTERS.length - 1) {
    return `${SURVEY_FORM_CODE_LETTERS[letterIndex + 1]}${SURVEY_FORM_CODE_DIGITS[0]}`
  }
  return null
}

/**
 * Increments a same-length code by incrementing its rightmost pair and carrying left, like an
 * odometer. Returns `null` once every pair has overflowed — i.e. `current` was the last code at
 * this length (`Z9`, `Z9Z9`, `Z9Z9Z9`, ...), meaning this length is fully exhausted.
 */
function nextCodeAtSameLength(current: string): string | null {
  const pairs: string[] = []
  for (let i = 0; i < current.length; i += SURVEY_FORM_CODE_PAIR_LENGTH) {
    pairs.push(current.slice(i, i + SURVEY_FORM_CODE_PAIR_LENGTH))
  }

  for (let i = pairs.length - 1; i >= 0; i--) {
    const incremented = nextPair(pairs[i])
    if (incremented !== null) {
      pairs[i] = incremented
      return pairs.join('')
    }
    pairs[i] = FIRST_SURVEY_FORM_CODE // this pair overflowed — reset it and carry left
  }

  return null // every pair overflowed — this whole length is exhausted
}

/**
 * Given the current highest survey-form code *at its own length* (or nothing, for the very first
 * survey), returns the next one in sequence — growing to the next pair length once the current
 * one is exhausted. Throws if `current` is malformed, or the sequence is exhausted at the
 * maximum length (`MAX_SURVEY_FORM_CODE_PAIRS`).
 */
export function nextSurveyFormCode(current?: string | null): string {
  if (!current) return FIRST_SURVEY_FORM_CODE

  const pairCount = current.length / SURVEY_FORM_CODE_PAIR_LENGTH
  if (
    !Number.isInteger(pairCount) ||
    pairCount < MIN_SURVEY_FORM_CODE_PAIRS ||
    !isWellFormedSurveyFormCode(current)
  ) {
    throw new Error(`Malformed survey-form code "${current}" — cannot compute the next code.`)
  }

  const next = nextCodeAtSameLength(current)
  if (next !== null) return next

  const nextPairCount = pairCount + 1
  if (nextPairCount > MAX_SURVEY_FORM_CODE_PAIRS) {
    throw new Error('All survey-form codes have been used — the sequence is exhausted.')
  }
  return FIRST_SURVEY_FORM_CODE.repeat(nextPairCount)
}

/**
 * Finds the next unused survey-form code by reading back the current highest one. Not race-proof
 * on its own (two forms marked `is_survey` in the same instant could compute the same code) — the
 * unique index on `forms.survey_code` is the actual guard; a collision there just fails that save
 * and the admin retries.
 *
 * Codes are compared within their own length only (see the module doc comment on why a plain sort
 * across mixed lengths doesn't work) — this collection is small (one row per survey form ever
 * created), so fetching every code and comparing in memory is simpler and cheaper than trying to
 * express "longest length, then highest within it" as a single query.
 */
export async function nextAvailableSurveyFormCode(payload: Payload): Promise<string> {
  const existing = await payload.find({
    collection: 'forms',
    where: {
      and: [{ survey_code: { exists: true } }, { survey_code: { not_equals: '' } }],
    },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const codes = existing.docs
    .map((doc) => doc.survey_code)
    .filter((code): code is string => typeof code === 'string' && code.length > 0)
    // Ignore malformed rows (e.g. "A1 - Copy") so they cannot make nextSurveyFormCode throw.
    .filter((code) => isWellFormedSurveyFormCode(code))

  if (codes.length === 0) return FIRST_SURVEY_FORM_CODE

  const longestLength = Math.max(...codes.map((code) => code.length))
  const latestAtLongestLength = codes
    .filter((code) => code.length === longestLength)
    .sort()
    .pop()

  return nextSurveyFormCode(latestAtLongestLength)
}

/** The random, per-recipient half of an invitation code, e.g. `ABC123`. */
function generateInvitationRandomPart(): string {
  let code = ''
  for (let i = 0; i < INVITATION_RANDOM_LENGTH; i++) {
    code += SURVEY_CODE_ALPHABET[randomInt(SURVEY_CODE_ALPHABET.length)]
  }
  return code
}

/**
 * Builds a full invitation code: a random 6-character per-recipient part + `-` + the survey
 * form's own code, e.g. `ABC123-A1`. The suffix is identical for every recipient of the same
 * survey; the random prefix is what makes each individual invitation unique.
 */
export function generateInvitationCode(surveyFormCode: string): string {
  return `${generateInvitationRandomPart()}-${surveyFormCode}`
}

/** Trims whitespace and uppercases user-entered input for comparison against stored codes. */
export function normalizeSurveyCode(input: string): string {
  return input.trim().toUpperCase()
}

/**
 * Generates an invitation code (`<random 6>-<survey form code>`) that is unique among
 * `survey-invitations` docs for the given form. The same code may legitimately exist under a
 * different form — uniqueness is enforced only within `formId`, matching the collection's
 * compound (form, code) unique index.
 *
 * Only the random prefix varies within a form (the suffix is fixed per survey), so this is
 * really checking 31^6 ≈ 887M combinations for a collision — vanishingly unlikely inside a
 * single form's invite list, but the retry keeps a freak collision from surfacing as an error.
 */
export async function createUniqueSurveyCode(
  payload: Payload,
  formId: string,
  surveyFormCode: string,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateInvitationCode(surveyFormCode)

    const existing = await payload.find({
      collection: 'survey-invitations',
      where: {
        and: [{ form: { equals: formId } }, { code: { equals: code } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.totalDocs === 0) {
      return code
    }
  }

  throw new Error(
    `Unable to generate a unique survey code for form ${formId} after ${MAX_GENERATION_ATTEMPTS} attempts.`,
  )
}
