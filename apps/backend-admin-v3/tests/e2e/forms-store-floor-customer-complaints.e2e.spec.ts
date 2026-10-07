/**
 * Store Floor Customer Complaints — Form E2E Tests
 *
 * Seed: seed/forms-store-floor-customer-complaints.ts
 *   - requires_auth: true, required_access: 'form-store-floor-customer-complaints'.
 *   - enable_workflow: true, uses the SAME "crm-case-management" workflow-v2 blueprint as
 *     seed/workflow-v2.ts (see tests/e2e/crm-workflow-v2.e2e.spec.ts for the full step map —
 *     this file drives the identical engine, just via a form with different intake fields).
 *   - Step 1: store_department (select-store-departments), date, time.
 *   - Step 2: communication_channel, customer_name, customer_account, customer_email, customer_phone.
 *   - Step 3: complaint_details, immediate_action_taken, escalated_to, follow_up_person, target_date_closure.
 *
 * Test 1 drives the actual public multi-step submission UI (not a direct API POST — this is
 * what exercises the form renderer and catches regressions like the async store_department
 * select or the exact-text Continue/Review button match; see file header notes in
 * forms-store-floor-customer-service.e2e.spec.ts for both issues, discovered via manual QA).
 * It then drives the workflow through completion via the token-email review flow (same
 * pattern as crm-workflow-v2.e2e.spec.ts), checking the reviewer "Action Required" email at
 * the first step and the customer's completion "Approved" email at the end (this form has a
 * customer_email field, so the blueprint's approval_notifications resolves a real recipient).
 *
 * A real workflow-engine quirk found via manual QA, handled here: a step whose `reviewer`
 * is still unassigned shows only a "Reassign" button, not the approve/reject controls — but
 * since we drive this via the actual emailed reviewer token (not a super-user session), the
 * token IS the assigned reviewer's, so this file never needs the Reassign flow.
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/pv3`
  : 'http://localhost:3015/pv3'
const API = `${BASE_URL}/api`

const ETHEREAL_URL = 'https://ethereal.email'
const ETHEREAL_USER = 'agustin55@ethereal.email'
const ETHEREAL_PASS = 'KuqjB4TWqSaxNfuXx4'

const FORM_SLUG = 'store-floor-customer-complaints'
const SUBMITTER_EMAIL = 'crm.form@user.com'
const SUBMITTER_PASSWORD = 'crm.form@user.com1'
const ADMIN_EMAIL = 'default@payload.com'
const ADMIN_PASS = 'default@payload.com'

const OP_SLUG = 'doha-oasis-crm-case-management'
const STEP = {
  register: `${OP_SLUG}.register-case`,
  vipReview: `${OP_SLUG}.vip-review`,
  classify: `${OP_SLUG}.classify-prioritize`,
  classifyVip: `${OP_SLUG}.classify-prioritize-vip`,
  ack: `${OP_SLUG}.acknowledge-customer`,
  ackVip: `${OP_SLUG}.acknowledge-customer-vip`,
  investigation: `${OP_SLUG}.department-investigation`,
  confirm: `${OP_SLUG}.confirm-resolution`,
  confirmVip: `${OP_SLUG}.confirm-resolution-vip`,
  close: `${OP_SLUG}.close-case`,
  report: `${OP_SLUG}.report-review`,
} as const

const CS_TEAM_EMAIL = 'cs-team@crm.com'
const CRM_MANAGER_EMAIL = 'crm-manager@crm.com'
const FNB_MANAGER_EMAIL = 'fnb-director@crm-department.com'

let etherealContext: import('@playwright/test').BrowserContext
let etherealPage: Page

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiGet<T = any>(page: Page, path: string): Promise<T> {
  return page.evaluate(
    ([api, p]) => fetch(`${api}${p}`).then((r) => r.json()),
    [API, path] as [string, string],
  )
}

interface InstanceState {
  id: string
  step: string
  status: string
  reviews: any[]
}

async function waitForWorkflowInstance(
  page: Page,
  submissionId: string,
  timeoutMs = 15_000,
): Promise<InstanceState> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const data: any = await apiGet(
      page,
      `/workflow-instances?where[document_id][equals]=${submissionId}&limit=1&depth=0`,
    )
    const inst = data.docs?.[0]
    if (inst?.id) {
      return { id: inst.id, step: inst.current_step, status: inst.status, reviews: inst.reviews ?? [] }
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`No workflow instance found for submission ${submissionId} after ${timeoutMs}ms`)
}

async function getWorkflowInstance(page: Page, instanceId: string): Promise<InstanceState> {
  const data: any = await apiGet(page, `/workflow-instances/${instanceId}?depth=0`)
  return { id: instanceId, step: data.current_step, status: data.status, reviews: data.reviews ?? [] }
}

function findReview(
  reviews: any[],
  slug: string,
  opts: { pending?: boolean; iteration?: number } = {},
): any {
  return reviews.find((r: any) => {
    if (r.status_slug !== slug) return false
    if (opts.pending && r.response !== 'pending') return false
    if (opts.iteration !== undefined && (r.iteration || 1) !== opts.iteration) return false
    return true
  })
}

function buildTokenUrl(submissionId: string, token: string): string {
  return `${BASE_URL}/forms/submissions/${submissionId}?token=${token}`
}

function workflowHeading(page: Page, text: 'Your Action Required' | 'View Only') {
  return page.locator('h3:visible').filter({ hasText: text })
}

// ── Public form submission (UI-driven) ─────────────────────────────────────────

function stepButton(page: Page) {
  return page.locator('button:visible').filter({ hasText: /^\s*(Continue|Review)\s*$/ })
}

function submitButton(page: Page) {
  return page.locator('button:visible').filter({ hasText: /^\s*Submit\s*$/ })
}

async function loginIfPrompted(page: Page): Promise<void> {
  const emailInput = page.locator('input[type="email"]:visible').first()
  const needsLogin = await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)
  if (!needsLogin) return
  await emailInput.fill(SUBMITTER_EMAIL)
  await page.locator('input[type="password"]:visible').first().fill(SUBMITTER_PASSWORD)
  await page.locator('button:visible').filter({ hasText: /^\s*Sign In\s*$/ }).first().click()
  await page.waitForTimeout(2_000)
}

async function selectStoreDepartment(page: Page): Promise<void> {
  const select = page.locator('select[name="store_department"]:visible').first()
  await expect(select).toBeEnabled({ timeout: 45_000 })
  await select.selectOption({ index: 1 })
}

/**
 * Reading back /api/form-submissions or /api/workflow-instances requires a session with
 * read access — the submitter (crm.form@user.com, "crm entry access") only has create access
 * on this form's own slug. Logs a fresh page in as the super user purely for verification
 * queries; never used for the actual public-form submission itself.
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/admin/login`)
  const emailInput = page.getByRole('textbox', { name: /email/i })
  await emailInput.waitFor({ state: 'visible', timeout: 20_000 })
  await emailInput.fill(ADMIN_EMAIL)
  await page.locator('input[type="password"]').fill(ADMIN_PASS)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.waitForURL(`${BASE_URL}/admin**`, { timeout: 20_000 })
  await page.waitForTimeout(1_000)
}

async function submitComplaintForm(
  page: Page,
  data: { customerName: string; customerEmail: string },
): Promise<void> {
  await page.goto(`${BASE_URL}/forms/${FORM_SLUG}`)
  await loginIfPrompted(page)

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  await selectStoreDepartment(page)
  await page.locator('input[name="date"]:visible').fill('2026-07-26')
  await page.locator('input[name="time"]:visible').fill('12:00')
  await stepButton(page).first().click()

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  await page.locator('input[name="communication_channel"]:visible').fill('Phone')
  await page.locator('input[name="customer_name"]:visible').fill(data.customerName)
  await page.locator('input[name="customer_email"]:visible').fill(data.customerEmail)
  await page.locator('input[name="customer_phone"]:visible').fill('+97455512345')
  await stepButton(page).first().click()

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  await page.locator('textarea[name="complaint_details"]:visible').fill('E2E test complaint details')
  await page
    .locator('textarea[name="immediate_action_taken"]:visible')
    .fill('E2E test immediate action taken')
  await stepButton(page).first().click() // → Review screen

  // ── Review screen ───────────────────────────────────────────────────────────
  await expect(page.getByText('Review Your Submission')).toBeVisible({ timeout: 10_000 })
  await submitButton(page).first().click()
  await expect(page.getByText('Thanks!')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2_000) // let the create-submission POST fully commit
}

/** Resolves the most recent submission ID for this form via an admin-authenticated page. */
async function resolveLatestSubmissionId(adminPage: Page): Promise<string> {
  const list: any = await apiGet(
    adminPage,
    `/form-submissions?where[form.slug][equals]=${FORM_SLUG}&sort=-createdAt&limit=1&depth=0`,
  )
  const submissionId = list.docs?.[0]?.id
  if (!submissionId) throw new Error('Could not resolve submission ID after form submit')
  return submissionId
}

// ── Ethereal helpers ───────────────────────────────────────────────────────────

async function loginToEthereal(page: Page) {
  await page.goto(`${ETHEREAL_URL}/login`, { waitUntil: 'domcontentloaded' })
  const addressInput = page.getByRole('textbox', { name: /address/i })
  await addressInput.click()
  await addressInput.fill(ETHEREAL_USER)
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.click()
  await passwordInput.fill(ETHEREAL_PASS)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(`${ETHEREAL_URL}/`, { timeout: 30_000 })
  await page.goto(`${ETHEREAL_URL}/messages`, { waitUntil: 'domcontentloaded' })
}

/**
 * The Ethereal inbox list view shows sender/subject/date only — the recipient never appears
 * in row text, so filtering by reviewer email always matches zero rows. Filtering by
 * submissionId works because every workflow-v2 notification subject includes it (format:
 * "Action Required: <Form Title> #<submissionId> – <Step Label>").
 */
async function getTokenUrlFromEthereal(
  page: Page,
  submissionId: string,
  token: string,
): Promise<string> {
  await page.goto(`${ETHEREAL_URL}/messages`)
  await page.waitForSelector('table tbody tr', { timeout: 15_000 })

  const rows = page.locator('table tbody tr').filter({ hasText: submissionId })
  await expect(rows.first()).toBeVisible({ timeout: 15_000 })
  const count = await rows.count()

  for (let i = 0; i < Math.min(count, 10); i++) {
    const messageLink = rows.nth(i).getByRole('link', { name: /Action Required:/i }).first()
    await messageLink.click()
    await page.waitForSelector('.card-body, iframe', { timeout: 5_000 })

    const found = await page.evaluate(
      ([token]) => {
        const extractFromDoc = (doc: Document): string | null => {
          const anchors = Array.from(doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
          const match = anchors.find(
            (a) => a.href.includes('/forms/submissions/') && a.href.includes(token),
          )
          if (match) return match.href
          const text = doc.body?.innerText ?? ''
          const re = new RegExp(`https?://[^\\s"'<>\\[\\]]*${token}[^\\s"'<>\\[\\]]*`)
          const textMatch = text.match(re) ?? (doc.body?.innerHTML ?? '').match(re)
          return textMatch ? textMatch[0] : null
        }
        let result = extractFromDoc(document)
        if (!result) {
          for (const iframe of Array.from(document.querySelectorAll('iframe'))) {
            try {
              if (iframe.contentDocument) {
                result = extractFromDoc(iframe.contentDocument)
                if (result) break
              }
            } catch {}
          }
        }
        return result
      },
      [token] as [string],
    )

    if (found) return found
    await page.goto(`${ETHEREAL_URL}/messages`)
    await page.waitForSelector('table tbody tr')
  }

  throw new Error(`Token URL containing token "${token}" not found in any recent emails for submission "${submissionId}"`)
}

async function expectEmailInEthereal(
  page: Page,
  toEmail: string,
  subjectPart: string,
  timeoutMs = 45_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await page.goto(`${ETHEREAL_URL}/messages`)
    await page.waitForSelector('table tbody tr', { timeout: 15_000 })
    const row = page
      .locator('table tbody tr')
      .filter({ hasText: toEmail })
      .filter({ hasText: subjectPart })
    if ((await row.count()) > 0) return
    await page.waitForTimeout(3_000)
  }
  throw new Error(`Email "${subjectPart}" to "${toEmail}" not found in Ethereal after ${timeoutMs}ms`)
}

// ── Review action helpers ──────────────────────────────────────────────────────

async function drawSignature(page: Page): Promise<void> {
  const canvas = page.locator('canvas.sigCanvas:visible').first()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Signature canvas not visible')
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 5 })
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, { steps: 5 })
  await page.mouse.up()
}

interface ActionOpts {
  selects?: Record<string, string>
  signature?: boolean
}

async function performAction(
  page: Page,
  tokenUrl: string,
  buttonLabel: string,
  comments: string,
  opts: ActionOpts = {},
): Promise<void> {
  await page.goto(tokenUrl)
  await expect(workflowHeading(page, 'Your Action Required')).toBeVisible({ timeout: 20_000 })

  const commentsInput = page.getByPlaceholder('Provide your feedback here...').filter({ visible: true }).first()
  await commentsInput.click()
  await commentsInput.fill(comments)

  for (const [name, value] of Object.entries(opts.selects ?? {})) {
    await page.locator(`select#fb-${name}:visible`).first().selectOption(value)
  }

  if (opts.signature) await drawSignature(page)

  await page.getByRole('button', { name: buttonLabel, exact: true }).filter({ visible: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Confirm Your Action' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Submit' }).filter({ visible: true }).first().click()

  await expect(workflowHeading(page, 'View Only')).toBeVisible({ timeout: 20_000 })
}

async function actViaEmail(
  page: Page,
  submissionId: string,
  token: string,
  buttonLabel: string,
  comments: string,
  opts: ActionOpts = {},
): Promise<string> {
  const url = await getTokenUrlFromEthereal(etherealPage, submissionId, token)
  await performAction(page, url, buttonLabel, comments, opts)
  return url
}

// ── Suite ──────────────────────────────────────────────────────────────────────

test.describe('Store Floor Customer Complaints — E2E', () => {
  test.describe.configure({ timeout: 300_000 })

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000)
    etherealContext = await browser.newContext()
    etherealPage = await etherealContext.newPage()
    await loginToEthereal(etherealPage)
  })

  test.afterAll(async () => {
    await etherealContext?.close()
  })

  test('Test 1 — submits via the public form, drives the workflow to completion, verifies reviewer + customer emails', async ({
    page,
    browser,
  }) => {
    const customerEmail = `complaints-e2e-${Date.now()}@test.com`
    await submitComplaintForm(page, {
      customerName: 'E2E Complaints Customer',
      customerEmail,
    })

    // Separate admin session for all verification/polling queries — the submitter
    // (crm.form@user.com) has no read access to form-submissions or workflow-instances.
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await loginAsAdmin(adminPage)
    const submissionId = await resolveLatestSubmissionId(adminPage)

    let inst = await waitForWorkflowInstance(adminPage, submissionId)
    expect(inst.step).toBe(STEP.register)

    // ── Step 1: Register Case — reviewer notified by email ────────────────────
    // Ethereal's inbox list view shows only sender/subject/date, not the recipient —
    // matching on the submission ID (always present in the subject, e.g. "Action
    // Required: <Form Title> #<id> – <Step Label>") is reliable; matching on the
    // reviewer's email address is not, since it never appears in the row text.
    await expectEmailInEthereal(etherealPage, submissionId, 'Register Case')
    const registerReview = findReview(inst.reviews, STEP.register, { pending: true })
    await actViaEmail(page, submissionId, registerReview.reviewer_tokens?.[0]?.token, 'Confirm & Proceed', 'E2E — registered', {
      selects: { is_vip: 'no' },
    })

    // ── Step 2 (vip-review) auto-skipped → classify-prioritize ────────────────
    inst = await getWorkflowInstance(adminPage, inst.id)
    expect(findReview(inst.reviews, STEP.vipReview)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.classify)

    const classifyReview = findReview(inst.reviews, STEP.classify, { pending: true })
    await actViaEmail(page, submissionId, classifyReview.reviewer_tokens?.[0]?.token, 'Classified — Proceed', 'E2E — classified', {
      selects: { case_category: 'fnb-service', severity: 'medium' },
    })

    // ── Step 4 (classify-vip) auto-skipped → acknowledge-customer ─────────────
    inst = await getWorkflowInstance(adminPage, inst.id)
    expect(findReview(inst.reviews, STEP.classifyVip)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.ack)

    const ackReview = findReview(inst.reviews, STEP.ack, { pending: true })
    await actViaEmail(page, submissionId, ackReview.reviewer_tokens?.[0]?.token, 'Customer Acknowledged', 'E2E — acknowledged')

    // ── Step 6 (ack-vip) auto-skipped → department-investigation ──────────────
    inst = await getWorkflowInstance(adminPage, inst.id)
    expect(findReview(inst.reviews, STEP.ackVip)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.investigation)

    const investigationReview = findReview(inst.reviews, STEP.investigation, { pending: true })
    expect(investigationReview?.reviewer_tokens?.[0]?.email).toBe(FNB_MANAGER_EMAIL)
    await actViaEmail(page, submissionId, investigationReview.reviewer_tokens?.[0]?.token, 'Resolved', 'E2E — investigated', {
      selects: { refund_needed: 'no' },
      signature: true,
    })

    // ── Step 8: Confirm Resolution — customer satisfied ────────────────────────
    inst = await getWorkflowInstance(adminPage, inst.id)
    expect(inst.step).toBe(STEP.confirm)
    const confirmReview = findReview(inst.reviews, STEP.confirm, { pending: true })
    await actViaEmail(page, submissionId, confirmReview.reviewer_tokens?.[0]?.token, 'Customer Satisfied — Close', 'E2E — satisfied', {
      selects: { customer_satisfied: 'yes' },
    })

    // ── Step 9 (confirm-vip) auto-skipped → close-case ─────────────────────────
    inst = await getWorkflowInstance(adminPage, inst.id)
    expect(findReview(inst.reviews, STEP.confirmVip)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.close)

    const closeReview = findReview(inst.reviews, STEP.close, { pending: true })
    await actViaEmail(page, submissionId, closeReview.reviewer_tokens?.[0]?.token, 'Close Case', 'E2E — case closed')

    // ── Step 11: Report and Review (hide_email_actions:true → build token URL) ─
    inst = await getWorkflowInstance(adminPage, inst.id)
    expect(inst.step).toBe(STEP.report)
    const reportReview = findReview(inst.reviews, STEP.report, { pending: true })
    expect(reportReview?.reviewer_tokens?.[0]?.email).toBe(CRM_MANAGER_EMAIL)
    await performAction(page, buildTokenUrl(submissionId, reportReview.reviewer_tokens?.[0]?.token), 'Report Filed', 'E2E — report filed')

    const finalInst = await getWorkflowInstance(adminPage, inst.id)
    expect(finalInst.status).toBe('completed')

    // ── This form HAS a customer_email field → blueprint's approval_notifications
    //    (document_field: customer_email) resolves a real recipient. Matching on
    //    submissionId, not customerEmail — see the Register Case check above for why. ─
    await expectEmailInEthereal(etherealPage, submissionId, 'Approved')

    await adminContext.close()
  })
})
