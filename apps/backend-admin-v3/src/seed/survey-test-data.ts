import type { Payload } from 'payload'
import type { Department, Form, FormSubmission, Operator, UsersAccess } from '@/payload-types'
import { createUniqueSurveyCode } from '@/utilities/survey-code'
import { buildSurveyInvitationLink } from '@/collections/survey-invitations/utilities/invitation-email'
import { createUserIfNotExists } from './helpers/create-user'
import { accessNonAdmin } from './helpers/create-user-access'
import { employeeExperienceSurveySlug } from './forms-employee-experience-survey'
import { employeePulseSurveySlug } from './forms-employee-pulse-survey'
import { guestFeedbackSurveySlug } from './forms-guest-feedback-survey'
import type { SurveyDepartmentKey, SurveyDepartmentMap } from './survey-departments'

type SubmissionData = NonNullable<FormSubmission['submissionData']>

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const EMPLOYEES: { email: string; department: SurveyDepartmentKey }[] = [
  { email: 'employee-01@test.com', department: 'it' },
  { email: 'employee-02@test.com', department: 'it' },
  { email: 'employee-03@test.com', department: 'fnb' },
  { email: 'employee-04@test.com', department: 'fnb' },
  { email: 'employee-05@test.com', department: 'fnb' },
  { email: 'employee-06@test.com', department: 'retail' },
  { email: 'employee-07@test.com', department: 'retail' },
  { email: 'employee-08@test.com', department: 'retail' },
  { email: 'employee-09@test.com', department: 'hr' },
  { email: 'employee-10@test.com', department: 'guestRelations' },
]

// Answer both surveys with paragraph-length text, to check how the report UI wraps long answers.
const LONG_TEXT_EMPLOYEES: { email: string; department: SurveyDepartmentKey }[] = [
  { email: 'employee-11@test.com', department: 'it' },
  { email: 'employee-12@test.com', department: 'fnb' },
  { email: 'employee-13@test.com', department: 'retail' },
  { email: 'employee-14@test.com', department: 'it' },
  { email: 'employee-15@test.com', department: 'fnb' },
  { email: 'employee-16@test.com', department: 'retail' },
]

const LONG_WORKS_WELL = [
  'The team genuinely looks out for each other, especially during the busy weekend shifts. When someone is struggling with a queue or a difficult guest, a colleague usually steps in without being asked. Our supervisor also makes a point of thanking people at the end of the day. It sounds small, but it makes the long hours feel much more manageable.',
  'Training for new joiners has improved a lot over the last year. The buddy system means nobody is left alone on their first week, and the checklists are clear and easy to follow. I also appreciate that refresher sessions are scheduled during working hours rather than on our days off. As a result, I feel confident handling most situations on the floor. It would be great to keep this going as the team grows.',
  'Communication from management has become much more consistent. We now get a short weekly update that explains upcoming events, staffing changes and any new procedures. Questions raised in the team huddle are usually answered within a few days. This has reduced a lot of the rumours and confusion we used to have.',
  'I really value the flexibility around shift swaps. The new rota tool makes it easy to find a colleague and get the swap approved the same day. This has helped me manage family commitments without having to take unpaid leave. Managers are understanding as long as we give reasonable notice. It is one of the main reasons I would recommend working here. Please do not change this process.',
  'Our kitchen and service teams work together far better than they did before. The pre-shift briefing means everyone knows the specials, the allergens and the expected covers. Problems are now raised early instead of during the rush. Guests have noticed the difference, and we have received several positive reviews mentioning the service.',
  'The recognition programme is motivating and feels fair. Nominations come from colleagues as well as managers, so people who work quietly in the background also get noticed. The monthly winners are announced in a friendly way without making anyone uncomfortable. Small rewards like an extra day off or a meal voucher are appreciated. Overall it has created a more positive atmosphere across departments.',
]

const LONG_TO_IMPROVE = [
  'Schedules are often published only a few days before the week starts, which makes it hard to plan anything outside work. Last-minute changes also happen without much explanation. I understand that business needs change, but two weeks of notice would make a big difference. It would also help if changes were communicated directly rather than just updated in the system.',
  'The staff room is too small for the number of people on a typical shift. During peak lunch breaks there are not enough seats, and the microwave queue can take most of the break. The lockers are also old and several of them do not close properly. A modest investment here would noticeably improve morale. Even a second microwave and a few extra chairs would help.',
  'Equipment issues take too long to be fixed once they are reported. A broken card terminal or fridge can stay out of service for over a week, which slows everyone down and frustrates guests. There is no clear way to see whether a request has been picked up. A simple tracking system with expected repair dates would reduce the number of follow-ups. It would also show that reported problems are taken seriously.',
  'Career progression is not very clear for frontline staff. Many of us would like to take on more responsibility, but we do not know which skills or certifications are needed for the next role. Internal openings are sometimes filled before most people hear about them. Regular development conversations with managers would help people plan their growth. Sharing open positions internally first would also be appreciated.',
  'Handover between morning and evening shifts is inconsistent. Important information about guest complaints, low stock or special requests is sometimes passed on verbally and then forgotten. A short written handover note, even on a shared tablet, would avoid repeated mistakes. This would also make it easier for part-time staff who are not in every day. Some teams already do this well, so it should be shared as a standard.',
  'Workload is uneven across the week, with some days heavily understaffed and others quiet. On busy days breaks are often delayed or shortened, which leads to fatigue and mistakes. Forecasting staffing from past footfall and booking data could balance this better. I would also suggest having one or two flexible floaters who can support whichever area is under pressure. People would feel less stretched and service would be more consistent.',
]

const OPEN_INVITES: { email: string; department?: SurveyDepartmentKey }[] = [
  { email: 'survey-seed-1@test.com', department: 'it' },
  { email: 'survey-seed-2@test.com', department: 'fnb' },
  { email: 'survey-seed-3@test.com', department: 'retail' },
  { email: 'survey-seed-4@test.com' },
  { email: 'survey-seed-5@test.com' },
]

type ReportAccessRows = NonNullable<UsersAccess['access']>

const REPORT_USERS: {
  email: string
  department?: SurveyDepartmentKey
  accessName: string
  rows: ReportAccessRows
}[] = [
  {
    email: 'survey-report-super@test.com',
    accessName: 'Survey Report (super user)',
    rows: [{ slug: 'survey-report', read: true, hidden: false, super_user: true }],
  },
  {
    email: 'survey-report-it@test.com',
    department: 'it',
    accessName: 'Survey Report (department)',
    rows: [{ slug: 'survey-report', read: true, hidden: false }],
  },
  {
    email: 'survey-report-it-pulse@test.com',
    department: 'it',
    accessName: 'Survey Report (department, pulse only)',
    rows: [
      { slug: 'survey-report', read: true, hidden: false },
      { slug: `survey-report-${employeePulseSurveySlug}`, read: true },
    ],
  },
  {
    // Non-super invitation sender for the pulse survey: manages its invitations, but the
    // recipient email field is super-user only.
    email: 'survey-sender@test.com',
    accessName: 'Survey Invitations (pulse sender)',
    rows: [
      { slug: 'survey-send-invitation', read: true, hidden: false },
      {
        slug: `survey-send-invitation-${employeePulseSurveySlug}`,
        read: true,
        create: true,
        update: true,
      },
    ],
  },
  {
    // Department-scoped access but no department on the account: every survey is blocked.
    email: 'survey-report-nodept@test.com',
    accessName: 'Survey Report (department)',
    rows: [{ slug: 'survey-report', read: true, hidden: false }],
  },
  {
    email: 'survey-report-hr@test.com',
    department: 'hr',
    accessName: 'Survey Report (HR department)',
    rows: [{ slug: 'survey-report', read: true, hidden: false }],
  },
  {
    email: 'survey-report-none@test.com',
    department: 'it',
    accessName: 'Survey Report (no access)',
    rows: [],
  },
]

/** Deterministic PRNG (mulberry32) so re-seeding an empty DB gives the same answers. */
const createRandom = (seed: number) => {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
  }
}

const answer = (field: string, value: string | number): SubmissionData[number] => ({
  field,
  value: String(value),
})

const findSurvey = async (payload: Payload, slug: string): Promise<Form | undefined> => {
  const result = await payload.find({
    collection: 'forms',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0]
}

const findUser = async (payload: Payload, email: string) => {
  const result = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0]
}

const experienceAnswers = (index: number, departmentId: string): SubmissionData => {
  const random = createRandom(1000 + index)
  const answers: SubmissionData = [
    answer('department', departmentId),
    answer('tenure', random.pick(['lt_1_year', '1_to_3_years', '3_to_5_years', 'gt_5_years'])),
    answer('overall_satisfaction', random.int(2, 5)),
    answer('manager_support', random.int(1, 5)),
    answer('recommend_score', random.int(3, 10)),
  ]
  if (index % 3 !== 0) {
    answers.push(
      answer('what_works_well', random.pick(['Friendly team', 'Good training', 'Clear goals'])),
    )
  }
  if (index % 2 === 0) {
    answers.push(
      answer('what_to_improve', random.pick(['Staff rooms', 'Shift planning', 'Communication'])),
    )
  }
  return answers
}

const PULSE_HAS_MANAGER = new Set([1, 2, 3, 5, 6, 8])
const PULSE_TWO_BENEFITS = 4
const PROJECT_NAMES = ['Menu refresh', 'POS upgrade', 'Store layout', 'Loyalty app', 'Staff rota']

const pulseAnswers = (index: number, departmentId: string): SubmissionData => {
  const random = createRandom(2000 + index)
  const benefits = ['health_insurance', 'flexible_hours', 'training', 'staff_meals'] as const
  const answers: SubmissionData = [
    answer('department', departmentId),
    answer('work_mode', random.pick(['on_site', 'on_site', 'hybrid', 'remote'])),
    answer('workload_balance', random.int(1, 5)),
    answer('recommend_score', random.int(2, 10)),
    // Stored comma-joined so the report's multi-value split has a case to handle.
    answer(
      'benefits_valued',
      index === PULSE_TWO_BENEFITS ? 'flexible_hours,training' : random.pick(benefits),
    ),
    answer('has_manager', PULSE_HAS_MANAGER.has(index) ? 'yes' : 'no'),
  ]
  if (PULSE_HAS_MANAGER.has(index)) {
    answers.push(answer('manager_support', random.int(1, 5)))
  }
  answers.push(answer('wellbeing.stress_level', random.int(1, 5)))

  const projectCount = index % 4
  for (let i = 0; i < projectCount; i++) {
    answers.push(answer(`projects.${i}.project_name`, random.pick(PROJECT_NAMES)))
    answers.push(answer(`projects.${i}.project_satisfaction`, random.int(1, 5)))
  }

  if (index % 3 !== 1) answers.push(answer('what_works_well', 'Supportive colleagues'))
  if (index % 2 === 1) answers.push(answer('what_to_improve', 'More notice on schedule changes'))
  if (index % 4 !== 0) answers.push(answer('one_word', random.pick(['Busy', 'Kind', 'Driven'])))
  return answers
}

const withLongText = (answers: SubmissionData, i: number): SubmissionData => [
  ...answers.filter((a) => a.field !== 'what_works_well' && a.field !== 'what_to_improve'),
  answer('what_works_well', LONG_WORKS_WELL[i % LONG_WORKS_WELL.length]),
  answer('what_to_improve', LONG_TO_IMPROVE[i % LONG_TO_IMPROVE.length]),
]

// Includes Arabic answers so the CSV export's UTF-8 BOM can be checked in Excel.
const GUEST_COMMENTS: (string | null)[] = [
  'Lovely atmosphere and very attentive staff.',
  'الخدمة كانت ممتازة والموظفون ودودون جداً. سنعود بالتأكيد مع العائلة.',
  null,
  'Parking was hard to find on a Friday evening, but the visit itself was great.',
  'المكان نظيف ومرتب، لكن الانتظار عند الدفع كان طويلاً بعض الشيء.',
  'Good selection, prices a little high.',
]

const guestFeedbackAnswers = (index: number): SubmissionData => {
  const random = createRandom(4000 + index)
  const answers: SubmissionData = [
    answer('visit_rating', random.int(2, 5)),
    answer('would_return', index % 4 === 0 ? 'no' : 'yes'),
  ]
  const comment = GUEST_COMMENTS[(index - 1) % GUEST_COMMENTS.length]
  if (comment) answers.push(answer('comments', comment))
  return answers
}

type Respondent = {
  index: number
  email: string
  invitationDepartment?: Department
  answers: SubmissionData
  daysAgo?: number
}

const seedResponded = async (
  payload: Payload,
  operator: Operator,
  form: Form,
  respondents: Respondent[],
): Promise<void> => {
  const surveyCode = form.survey_code
  if (!surveyCode) throw new Error(`[survey seed] Form "${form.slug}" has no survey_code.`)

  const now = Date.now()
  let created = 0
  for (const respondent of respondents) {
    const random = createRandom(3000 + respondent.index)
    const daysAgo = respondent.daysAgo ?? 30 - respondent.index * 2
    const sentAt = new Date(now - daysAgo * DAY_MS - random.int(0, 8) * HOUR_MS)
    const respondedAt = new Date(sentAt.getTime() + random.int(2, 60) * HOUR_MS)

    const existing = await payload.find({
      collection: 'survey-invitations',
      where: { and: [{ form: { equals: form.id } }, { email: { equals: respondent.email } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    // Per respondent, so re-seeding an existing DB only adds the respondents that are new.
    if (existing.docs[0]?.status === 'responded') continue
    const code =
      existing.docs[0]?.code ?? (await createUniqueSurveyCode(payload, form.id, surveyCode))

    if (!existing.docs[0]) {
      await payload.create({
        collection: 'survey-invitations',
        data: {
          form: form.id,
          email: respondent.email,
          code,
          status: 'responded',
          sent_at: sentAt.toISOString(),
          responded_at: respondedAt.toISOString(),
          department: respondent.invitationDepartment?.id,
          operator: operator.id,
        },
        overrideAccess: true,
      })
    }

    const submission = await payload.create({
      collection: 'form-submissions',
      data: {
        form: form.id,
        survey_code: code,
        operator: operator.id,
        submissionData: respondent.answers,
        createdAt: respondedAt.toISOString(),
      },
      overrideAccess: true,
    })
    // Payload may ignore a createdAt passed on create; back-date it explicitly if so.
    if (submission.createdAt !== respondedAt.toISOString()) {
      await payload.update({
        collection: 'form-submissions',
        id: submission.id,
        data: { createdAt: respondedAt.toISOString() },
        overrideAccess: true,
      })
    }
    created++
  }

  payload.logger.info(`[survey seed] "${form.slug}": ${created} responses created.`)
}

type OpenCodeRow = { survey: string; email: string; code: string; department: string; link: string }

const seedOpenInvitations = async (
  payload: Payload,
  operator: Operator,
  form: Form,
  departments: SurveyDepartmentMap,
): Promise<OpenCodeRow[]> => {
  const surveyCode = form.survey_code
  if (!surveyCode) throw new Error(`[survey seed] Form "${form.slug}" has no survey_code.`)

  const rows: OpenCodeRow[] = []
  for (const invite of OPEN_INVITES) {
    const department = invite.department ? departments[invite.department] : undefined
    const existing = await payload.find({
      collection: 'survey-invitations',
      where: { and: [{ form: { equals: form.id } }, { email: { equals: invite.email } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    let row = existing.docs[0]
    if (!row) {
      row = await payload.create({
        collection: 'survey-invitations',
        data: {
          form: form.id,
          email: invite.email,
          code: await createUniqueSurveyCode(payload, form.id, surveyCode),
          status: 'sent',
          sent_at: new Date().toISOString(),
          department: department?.id,
          operator: operator.id,
        },
        overrideAccess: true,
      })
    }

    rows.push({
      survey: form.slug,
      email: row.email,
      code: row.code,
      department: department?.title ?? '(untagged)',
      link: buildSurveyInvitationLink(form, row.code),
    })
  }
  return rows
}

const findOrCreateAccess = async (
  payload: Payload,
  name: string,
  rows: ReportAccessRows,
): Promise<UsersAccess> => {
  const existing = await payload.find({
    collection: 'users-access',
    where: { name: { equals: name } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return existing.docs[0]

  return payload.create({
    collection: 'users-access',
    data: { name, access: [...(accessNonAdmin.access ?? []), ...rows] },
    overrideAccess: true,
  })
}

const seedReportUsers = async (
  payload: Payload,
  operator: Operator,
  departments: SurveyDepartmentMap,
): Promise<void> => {
  for (const reportUser of REPORT_USERS) {
    if (await findUser(payload, reportUser.email)) continue

    const access = await findOrCreateAccess(payload, reportUser.accessName, reportUser.rows)
    await payload.create({
      collection: 'users',
      data: {
        email: reportUser.email,
        password: reportUser.email,
        _verified: true,
        operator: operator.id,
        department: reportUser.department ? departments[reportUser.department].id : undefined,
        access: access.id,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })
    payload.logger.info(`✓ Created survey report user: ${reportUser.email}`)
  }
}

/**
 * Dev-only survey report fixtures: employees, responded + open invitations, submissions and one
 * user per report-access case. Writes invitations directly, so no email is ever queued.
 */
export const seedSurveyTestData = async (
  payload: Payload,
  operator: Operator,
  departments: SurveyDepartmentMap,
): Promise<void> => {
  if (process.env.NODE_ENV === 'production') return

  const experience = await findSurvey(payload, employeeExperienceSurveySlug)
  const pulse = await findSurvey(payload, employeePulseSurveySlug)
  const guestFeedback = await findSurvey(payload, guestFeedbackSurveySlug)
  if (!experience || !pulse || !guestFeedback) {
    payload.logger.warn('[survey seed] Survey forms not found — skipping survey test data.')
    return
  }

  for (const employee of [...EMPLOYEES, ...LONG_TEXT_EMPLOYEES]) {
    await createUserIfNotExists(payload, employee.email, operator, departments[employee.department])
  }

  const withIndex = EMPLOYEES.map((employee, i) => ({ ...employee, index: i + 1 }))
  const longText = LONG_TEXT_EMPLOYEES.map((employee, i) => ({
    ...employee,
    i,
    index: EMPLOYEES.length + i + 1,
    daysAgo: 3 + i * 3,
  }))

  await seedResponded(
    payload,
    operator,
    experience,
    withIndex.map(({ index, email, department }) => ({
      index,
      email,
      invitationDepartment: departments[department],
      answers: experienceAnswers(index, departments[department].id),
    })),
  )
  await seedResponded(
    payload,
    operator,
    experience,
    longText.map(({ i, index, email, department, daysAgo }) => ({
      index,
      email,
      daysAgo,
      invitationDepartment: departments[department],
      answers: withLongText(experienceAnswers(index, departments[department].id), i),
    })),
  )

  const pulseOffered: SurveyDepartmentKey[] = ['it', 'fnb', 'retail']
  await seedResponded(
    payload,
    operator,
    pulse,
    withIndex
      .filter(({ department }) => department !== 'hr')
      .map(({ index, email, department }) => ({
        index,
        email,
        // Guest Relations isn't offered: untagged invite, simulating a department removed later.
        invitationDepartment: pulseOffered.includes(department)
          ? departments[department]
          : undefined,
        answers: pulseAnswers(index, departments[department].id),
      })),
  )
  await seedResponded(
    payload,
    operator,
    pulse,
    longText.map(({ i, index, email, department, daysAgo }) => ({
      index,
      email,
      daysAgo,
      invitationDepartment: departments[department],
      // Offset so the two surveys don't show identical paragraphs side by side
      answers: withLongText(pulseAnswers(index, departments[department].id), i + 3),
    })),
  )

  await seedResponded(
    payload,
    operator,
    guestFeedback,
    withIndex.slice(0, GUEST_COMMENTS.length).map(({ index, email }) => ({
      index,
      email,
      answers: guestFeedbackAnswers(index),
    })),
  )

  const openCodes = [
    ...(await seedOpenInvitations(payload, operator, experience, departments)),
    ...(await seedOpenInvitations(payload, operator, pulse, departments)),
  ]

  await seedReportUsers(payload, operator, departments)

  console.log('\nOpen survey invitation codes (no emails sent):')
  console.table(openCodes)
}
