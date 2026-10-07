import type { CollectionAfterChangeHook } from 'payload'
import { notifyApprovers } from './notifyApprovers'
import { sendConfirmationEmail } from './sendConfirmationEmail'

export const afterChange: CollectionAfterChangeHook = async (args) => {
  await notifyApprovers(args)
  await sendConfirmationEmail(args)
}
