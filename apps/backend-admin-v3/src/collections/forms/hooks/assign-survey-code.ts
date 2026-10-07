import type { CollectionBeforeChangeHook } from 'payload'
import { Form } from '@/payload-types'
import { nextAvailableSurveyFormCode } from '@/utilities/survey-code'

/**
 * Assigns a short, sequential `survey_code` (e.g. `A1`) the first time a form is marked as a
 * survey. Every invitation code for that form carries this value as its suffix (`ABC123-A1`), so
 * it identifies the survey a code belongs to. Once set it is never changed or cleared — toggling
 * `is_survey` off and on again keeps the original code, so existing invitations stay valid.
 */
export const assignSurveyCode: CollectionBeforeChangeHook<Form> = async ({
  data,
  originalDoc,
  req,
}) => {
  // Both fields may be absent from `data` on a partial update (`survey_code` is `readOnly`, and
  // any Local-API `update` only carries changed fields) — fall back to the persisted doc so an
  // existing code is never regenerated and a survey form always eventually gets one.
  const persisted = originalDoc as Form | undefined
  const existingCode = data?.survey_code || persisted?.survey_code
  const isSurvey = data?.is_survey ?? persisted?.is_survey

  if (isSurvey && !existingCode) {
    data.survey_code = await nextAvailableSurveyFormCode(req.payload)
  }

  return data
}
