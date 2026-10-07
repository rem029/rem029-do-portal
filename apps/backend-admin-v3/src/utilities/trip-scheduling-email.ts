// Sender for trip-scheduling emails: the app's configured SMTP address (the only one the SMTP account
// may send as) with a trip-scheduling display name. Undefined when it isn't configured, so the email
// adapter's default sender applies.
export const getTripSchedulingEmailFrom = (): string | undefined => {
  const address = process.env.SMTP_FROM_ADDRESS
  return address ? `"Doha Oasis Logistics" <${address}>` : undefined
}
