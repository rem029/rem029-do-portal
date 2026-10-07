import { nodemailerAdapter, NodemailerAdapterArgs } from '@payloadcms/email-nodemailer'

const adapter: NodemailerAdapterArgs = {
  defaultFromAddress: process.env.SMTP_FROM_ADDRESS || 'info@test.com',
  defaultFromName: process.env.SMTP_FROM_NAME || 'Info',
  transportOptions: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_MAILER_TLS_REJECT_UNAUTHORIZED === 'true',
    },
    logger: process.env.SMTP_DEBUG === 'true',
    debug: process.env.SMTP_DEBUG === 'true',
  },
}
const email = nodemailerAdapter(adapter)
export default email
