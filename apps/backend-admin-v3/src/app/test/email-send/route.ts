import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/payload-types'

export const GET = async (request: NextRequest) => {
  // Only accessible on development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }

  const payload = await getPayload({ config: configPromise })

  // Authenticate user
  const { user } = await payload.auth({ headers: request.headers })

  // Ensure the user exists and is a super user
  if (!user || !(user as User).super_user) {
    return NextResponse.json(
      { error: 'Unauthorized. Super user access is required.' },
      { status: 401 }
    )
  }

  try {
    const envCount = process.env.TEST_EMAIL_COUNT
    const count = envCount ? parseInt(envCount, 10) : 10
    
    if (isNaN(count) || count <= 0) {
      return NextResponse.json(
        { error: 'Invalid count. TEST_EMAIL_COUNT must be a positive number.' },
        { status: 400 }
      )
    }

    const emailAddress = (user as User).email

    // Queue the requested number of email jobs
    for (let i = 0; i < count; i++) {
      await payload.jobs.queue({
        task: 'send-email',
        input: {
          to: emailAddress,
          subject: `Test Email #${i + 1} from API`,
          html: `<p>This is test email <strong>#${i + 1}</strong> generated from the <code>/email-send</code> endpoint by ${(user as User).email}.</p>`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${count} test emails to ${emailAddress}.`,
    })
  } catch (err) {
    payload.logger.error(`Error in /email-send route: ${err}`)
    return NextResponse.json(
      { error: 'An error occurred while queueing emails.' },
      { status: 500 }
    )
  }
}
