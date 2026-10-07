import { CollectionBeforeValidateHook, ValidationError } from 'payload'

export const validateEmailDomain: CollectionBeforeValidateHook = async ({ data, req }) => {
  // 1. SAFETY GUARD: Skip if no payload context or email data exists
  if (!req?.payload || !data?.email) return data

  let allowedDomains: string[] = []

  try {
    // 2. Safely read configuration settings dynamically from our global option table
    const settings = await req.payload.findGlobal({
      slug: 'trip-scheduling-settings',
    })

    allowedDomains = settings?.allowedDomains?.map((d: any) => d.domain.trim().toLowerCase()) || []
  } catch (err) {
    // Catch database connection issues or missing global document instances smoothly
    req.payload.logger.error(
      `⚠️ High Priority: Skipped domain validation checks due to settings fetch failure: ${err instanceof Error ? err.message : String(err)}`,
    )
    return data
  }

  // 3. If no restriction criteria are active in the options page, pass validation smoothly
  if (allowedDomains.length === 0) return data

  const userDomain = data.email.split('@')[1]?.toLowerCase().trim()

  // 4. Execute assertion rule safely outside the try-catch block scope
  if (!userDomain || !allowedDomains.includes(userDomain)) {
    throw new ValidationError({
      errors: [
        {
          message: `The email domain '@${userDomain || 'unknown'}' is not authorized for transport scheduling.`,
          path: 'email',
        },
      ],
    })
  }

  return data
}
