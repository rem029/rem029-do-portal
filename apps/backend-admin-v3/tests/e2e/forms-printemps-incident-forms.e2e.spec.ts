/**
 * Printemps Incident Form — Form E2E Tests
 *
 * Seed: seed/forms-printemps-incident-forms.ts
 *   - requires_auth: true, required_access: 'form-printemps-incident-forms'.
 *   - enable_workflow: true, uses the SAME "crm-case-management" workflow-v2 blueprint as
 *     seed/workflow-v2.ts (see tests/e2e/crm-workflow-v2.e2e.spec.ts for the full step map).
 *   - Step 1 (Incident Classification): store_department, incident_type, incident_group,
 *     incident_nature, persons_involved, injured_person_staff_group, incident_location,
 *     incident_date, incident_time.
 *   - Step 2 (Incident Details): brief_description, photographic_evidence (optional file,
 *     skipped here), immediate_corrective_action, root_cause, loss_time_days, future_actions,
 *     risk_assessment_review_required.
 *   - Step 3 (Reporting Info): logged_by, mode_of_reporting, date_incident_logged,
 *     action_taken_by, date_closed, supporting_docs (optional file, skipped here).
 *
 * IMPORTANT DIFFERENCE from the other two workflow-form E2E specs: this form has NO
 * customer_email field (see .temp/2026-07-26-incident-report-fields.md — it's an internal
 * staff incident log, not a customer-facing complaint). The crm-case-management blueprint's
 * approval_notifications resolve `document_field: customer_email`, which won't find a value
 * on this form's submission data, so no completion email to a "customer" is sent. This file
 * therefore only asserts the reviewer "Action Required" emails (register-case and
 * department-investigation), not a completion email — do not add a customer_email assertion
 * here without also adding that field to the seed form first.
 *
 * See forms-store-floor-customer-complaints.e2e.spec.ts for notes on the async
 * store_department select and the Next.js dev-toolbar button-match trap.
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/pv3`
  : 'http://localhost:3015/pv3'
const API = `${BASE_URL}/api`

const ETHEREAL_URL = 'https://ethereal.email'
const ETHEREAL_USER = 'agustin55@ethereal.email'
const ETHEREAL_PASS = 'KuqjB4TWqSaxNfuXx4'

const FORM_SLUG = 'printemps-incident-forms'
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
 * Selects a value and verifies it actually stuck. The very first field interaction right
 * after navigation can silently lose to a React hydration re-render on this app (the native
 * <select> reports the value was set, but a re-render resets it back to the placeholder a
 * moment later) — retrying confirms the controlled component's state actually updated.
 */
async function selectAndVerify(page: Page, name: string, value: string): Promise<void> {
  const select = page.locator(`select[name="${name}"]:visible`).first()
  for (let attempt = 0; attempt < 5; attempt++) {
    await select.selectOption(value)
    if ((await select.inputValue()) === value) return
    await page.waitForTimeout(500)
  }
  throw new Error(`select[name="${name}"] did not retain value "${value}" after 5 attempts`)
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

async function submitIncidentForm(page: Page, loggedBy: string): Promise<void> {
  await page.goto(`${BASE_URL}/forms/${FORM_SLUG}`)
  await loginIfPrompted(page)

  // ── Step 1: Incident Classification ────────────────────────────────────────
  await selectStoreDepartment(page)
  await selectAndVerify(page, 'incident_type', 'hse')
  await selectAndVerify(page, 'incident_group', 'near_miss')
  await selectAndVerify(page, 'incident_nature', 'impact')
  await selectAndVerify(page, 'persons_involved', 'employee')
  await selectAndVerify(page, 'injured_person_staff_group', 'do')
  await selectAndVerify(page, 'incident_location', 'store_beauty')
  await page.locator('input[name="incident_date"]:visible').fill('2026-07-26')
  await page.locator('input[name="incident_time"]:visible').fill('12:00')
  await stepButton(page).first().click()

  // ── Step 2: Incident Details (file fields left empty — optional) ──────────
  await page.locator('textarea[name="brief_description"]:visible').fill('E2E test incident description')
  await page
    .locator('textarea[name="immediate_corrective_action"]:visible')
    .fill('E2E test immediate corrective action')
  await stepButton(page).first().click()

  // ── Step 3: Reporting Info ──────────────────────────────────────────────────
  await page.locator('input[name="logged_by"]:visible').fill(loggedBy)
  await page.locator('input[name="date_incident_logged"]:visible').fill('2026-07-26')
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

test.describe('Printemps Incident Form — E2E', () => {
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

  test('Test 1 — submits via the public form, drives the workflow to completion, verifies reviewer emails', async ({
    page,
    browser,
  }) => {
    await submitIncidentForm(page, 'E2E Incident Reporter')

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

    // ── Step 7: Department Investigation — dynamic reviewer + reviewer email ──
    const investigationReview = findReview(inst.reviews, STEP.investigation, { pending: true })
    expect(investigationReview?.reviewer_tokens?.[0]?.email).toBe(FNB_MANAGER_EMAIL)
    // Matching on submissionId, not FNB_MANAGER_EMAIL — see the Register Case check above.
    await expectEmailInEthereal(etherealPage, submissionId, 'Department Investigation')
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

    // No customer_email field on this form → no completion email assertion here.
    // See file header for why this differs from the other two workflow-form specs.

    await adminContext.close()
  })
})
