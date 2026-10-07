/**
 * CRM Workflow V2 E2E Tests
 *
 * Blueprint: "CRM Case Management" (seed/workflow-v2.ts) — VIP-split steps:
 *   1. register-case            cs-team@crm.com     approve "Confirm & Proceed", select is_vip
 *   2. vip-review               vip-manager@crm.com skip if is_vip != yes
 *   3. classify-prioritize      cs-team@crm.com     skip if is_vip == yes, selects case_category + severity
 *   4. classify-prioritize-vip  vip-manager@crm.com skip if is_vip != yes, same selects
 *   5. acknowledge-customer     cs-team@crm.com     ack "Customer Acknowledged", skip if is_vip == yes
 *   6. acknowledge-customer-vip cs-team@crm.com     ack "Customer Acknowledged (VIP)", skip if is_vip != yes
 *   7. department-investigation dynamic (workflow_custom_field_department via case_category),
 *                               approve "Resolved" / reject "Escalate" (terminal), signature REQUIRED,
 *                               select refund_needed
 *   8. confirm-resolution       vip-manager@crm.com skip if is_vip == yes, select customer_satisfied,
 *                               approve "Customer Satisfied — Close",
 *                               reject "Customer Not Satisfied — Reopen" → loop back to step 7
 *   9. confirm-resolution-vip   cs-team@crm.com     skip if is_vip != yes (same loop-back)
 *  10. close-case               cs-team@crm.com     approve "Close Case" (final_approval)
 *  11. report-review            crm-manager@crm.com ack "Report Filed", hide_email_actions: true
 *
 * Blueprint-level notifications: approval_notifications + rejection_notifications both
 * resolve `document_field: customer_email` — the customer gets an email on completion/rejection.
 *
 * Covers:
 *   Test 1 - VIP path: non-VIP twins auto-skipped, VIP steps run, completes, customer gets "Approved" email
 *   Test 2 - Non-VIP path: VIP twins auto-skipped, completes, customer gets "Approved" email
 *   Test 3 - Loop-back: non-VIP, confirm-resolution rejected ("Customer Not Satisfied — Reopen")
 *            → iteration-2 department-investigation is INSERTED right after the rejected review
 *            (regression for the splice fix — push() used to append at the end and the engine
 *            marked the workflow completed, skipping close-case + report-review), then the
 *            workflow resumes at close-case and completes.
 *   Test 5 - Workflow Dashboard reporting accuracy: drives a non-VIP case mid-flow and to
 *            completion, and at each checkpoint verifies the admin Workflow Dashboard
 *            (globals/workflow-dashboard) — table row, detail modal, and CSV export — reflects
 *            the same Form/Version/Status/Current Step/review history as the raw instance API.
 *
 * For each step:
 *   1. Reads the reviewer token from the workflow instance API
 *   2. Locates the "Action Required" email in Ethereal (SMTP trap) and extracts the token URL
 *   3. Performs the action via the public review UI (selects, signature, confirm modal)
 *   4. Verifies the token URL becomes "View Only"
 *
 * Pre-requisites:
 *   - Dev server at http://localhost:3015 (playwright.config.ts starts/reuses it)
 *   - Seed data: crm-case-management blueprint + form + store departments
 *     (store dept managers: fnb@department.com, etc.)
 *   - SMTP configured to Ethereal: agustin55@ethereal.email
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import fs from 'fs'

// ── Constants ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/pv3`
  : 'http://localhost:3015/pv3'
const API = `${BASE_URL}/api`

const ADMIN_EMAIL = 'default@payload.com'
const ADMIN_PASS = 'default@payload.com'

const ETHEREAL_URL = 'https://ethereal.email'
const ETHEREAL_USER = 'agustin55@ethereal.email'
const ETHEREAL_PASS = 'KuqjB4TWqSaxNfuXx4'

const FORM_SLUG = 'crm-case-management'
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

// Reviewer emails
const CS_TEAM_EMAIL = 'cs-team@crm.com'
const VIP_MANAGER_EMAIL = 'vip-manager@crm.com'
const CRM_MANAGER_EMAIL = 'crm-manager@crm.com'
// case_category=fnb-service routes department-investigation to the F&B director CRM department manager
const FNB_MANAGER_EMAIL = 'fnb-director@crm-department.com'

// ── Shared state ───────────────────────────────────────────────────────────────

let formId: string
let etherealContext: BrowserContext
let etherealPage: Page

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiGet<T = any>(page: Page, path: string): Promise<T> {
  console.log(`[apiGet] GET ${API}${path}`)
  return page.evaluate(
    ([api, p]) => fetch(`${api}${p}`).then((r) => r.json()),
    [API, path] as [string, string],
  )
}

async function createCrmSubmission(
  page: Page,
  data: { customerName: string; customerEmail: string },
): Promise<string> {
  console.log(`[createCrmSubmission] name=${data.customerName} email=${data.customerEmail}`)
  const result: any = await page.evaluate(
    ([api, fId, d]) =>
      fetch(`${api}/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: fId,
          submissionData: [
            { field: 'customer_name', value: d.customerName },
            { field: 'customer_email', value: d.customerEmail },
            { field: 'case_description', value: 'E2E test case submission' },
          ],
        }),
      }).then((r) => r.json()),
    [API, formId, data] as [string, string, typeof data],
  )
  if (!result.doc?.id) {
    throw new Error(`createCrmSubmission failed: ${JSON.stringify(result.errors)}`)
  }
  console.log(`[createCrmSubmission] ✓ submissionId=${result.doc.id}`)
  return result.doc.id as string
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
  console.log(`[waitForWorkflowInstance] polling for submissionId=${submissionId}`)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const data: any = await apiGet(
      page,
      `/workflow-instances?where[document_id][equals]=${submissionId}&limit=1&depth=0`,
    )
    const inst = data.docs?.[0]
    if (inst?.id) {
      console.log(`[waitForWorkflowInstance] ✓ instanceId=${inst.id} step=${inst.current_step} status=${inst.status}`)
      return { id: inst.id, step: inst.current_step, status: inst.status, reviews: inst.reviews ?? [] }
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`No workflow instance found for submission ${submissionId} after ${timeoutMs}ms`)
}

async function getWorkflowInstance(page: Page, instanceId: string): Promise<InstanceState> {
  const data: any = await apiGet(page, `/workflow-instances/${instanceId}?depth=0`)
  console.log(`[getWorkflowInstance] step=${data.current_step} status=${data.status} reviews=${data.reviews?.length ?? 0}`)
  return { id: instanceId, step: data.current_step, status: data.status, reviews: data.reviews ?? [] }
}

/** Find a review by EXACT step slug (several slugs are prefixes of their -vip twins). */
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

/** Build a token URL directly from instance data (use when hide_email_actions:true) */
function buildTokenUrl(submissionId: string, token: string): string {
  return `${BASE_URL}/forms/submissions/${submissionId}?token=${token}`
}

function workflowHeading(page: Page, text: 'Your Action Required' | 'View Only') {
  return page.locator('h3:visible').filter({ hasText: text })
}

// ── Ethereal helpers ───────────────────────────────────────────────────────────

async function loginToEthereal(page: Page) {
  console.log(`[loginToEthereal] logging in as ${ETHEREAL_USER}`)
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
  console.log(`[loginToEthereal] ✓ logged in`)
}

async function getTokenUrlFromEthereal(
  page: Page,
  toEmail: string,
  token: string,
): Promise<string> {
  console.log(`[getTokenUrlFromEthereal] searching for email to=${toEmail} token=${token}`)
  await page.goto(`${ETHEREAL_URL}/messages`)
  await page.waitForSelector('table tbody tr', { timeout: 15_000 })

  const rows = page.locator('table tbody tr').filter({ hasText: toEmail })
  await expect(rows.first()).toBeVisible({ timeout: 15_000 })

  const count = await rows.count()
  console.log(`[getTokenUrlFromEthereal] found ${count} message(s) to ${toEmail}`)

  for (let i = 0; i < Math.min(count, 10); i++) {
    const messageLink = rows
      .nth(i)
      .getByRole('link', { name: /Action Required:/i })
      .first()
    const linkText = await messageLink.textContent()
    console.log(`[getTokenUrlFromEthereal] opening: ${linkText?.trim()}`)
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

    if (found) {
      console.log(`[getTokenUrlFromEthereal] ✓ found: ${found}`)
      return found
    }

    console.log(`[getTokenUrlFromEthereal] token not in this message, trying next`)
    await page.goto(`${ETHEREAL_URL}/messages`)
    await page.waitForSelector('table tbody tr')
  }

  throw new Error(`Token URL containing token "${token}" not found in any recent emails to "${toEmail}"`)
}

/**
 * Polls the Ethereal inbox until a message to `toEmail` whose row contains `subjectPart`
 * appears (blueprint approval/rejection notifications → document_field: customer_email).
 */
async function expectEmailInEthereal(
  page: Page,
  toEmail: string,
  subjectPart: string,
  timeoutMs = 45_000,
): Promise<void> {
  console.log(`[expectEmailInEthereal] waiting for "${subjectPart}" to ${toEmail}`)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await page.goto(`${ETHEREAL_URL}/messages`)
    await page.waitForSelector('table tbody tr', { timeout: 15_000 })
    const row = page
      .locator('table tbody tr')
      .filter({ hasText: toEmail })
      .filter({ hasText: subjectPart })
    if ((await row.count()) > 0) {
      console.log(`[expectEmailInEthereal] ✓ found "${subjectPart}" to ${toEmail}`)
      return
    }
    await page.waitForTimeout(3_000)
  }
  throw new Error(`Email "${subjectPart}" to "${toEmail}" not found in Ethereal after ${timeoutMs}ms`)
}

// ── Review action helpers ──────────────────────────────────────────────────────

/** Draw a short squiggle on the react-signature-canvas pad (required on dept-investigation). */
async function drawSignature(page: Page): Promise<void> {
  const canvas = page.locator('canvas.sigCanvas:visible').first()
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Signature canvas not visible')
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 5 })
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, { steps: 5 })
  await page.mouse.up()
  console.log(`[drawSignature] ✓ signed`)
}

interface ActionOpts {
  /** Custom select fields: name → option value (rendered as <select id="cf-{name}">) */
  selects?: Record<string, string>
  /** Draw on the signature pad before submitting (enable_signature steps) */
  signature?: boolean
}

/**
 * Opens the token URL and performs a review action.
 * `buttonLabel` is the step's configured label (approve_label / reject_label / acknowledge_label) —
 * every action opens a "Confirm Your Action" modal that must be submitted.
 * The desktop + mobile forms both exist in the DOM, so every locator filters on visibility.
 */
async function performAction(
  page: Page,
  tokenUrl: string,
  buttonLabel: string,
  comments: string,
  opts: ActionOpts = {},
): Promise<void> {
  console.log(`[performAction] "${buttonLabel}" → ${tokenUrl}`)
  await page.goto(tokenUrl)
  await expect(workflowHeading(page, 'Your Action Required')).toBeVisible({ timeout: 20_000 })

  const commentsInput = page
    .getByPlaceholder('Provide your feedback here...')
    .filter({ visible: true })
    .first()
  await commentsInput.click()
  await commentsInput.fill(comments)

  for (const [name, value] of Object.entries(opts.selects ?? {})) {
    console.log(`[performAction] select #fb-${name}="${value}"`)
    await page.locator(`select#fb-${name}:visible`).first().selectOption(value)
  }

  if (opts.signature) {
    await drawSignature(page)
  }

  await page
    .getByRole('button', { name: buttonLabel, exact: true })
    .filter({ visible: true })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Confirm Your Action' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Submit' }).filter({ visible: true }).first().click()

  await expect(workflowHeading(page, 'View Only')).toBeVisible({ timeout: 20_000 })
  console.log(`[performAction] ✓ "${buttonLabel}" submitted`)
}

async function verifyReadOnly(page: Page, tokenUrl: string): Promise<void> {
  console.log(`[verifyReadOnly] → ${tokenUrl}`)
  await page.goto(tokenUrl)
  await expect(workflowHeading(page, 'View Only')).toBeVisible({ timeout: 15_000 })
  console.log(`[verifyReadOnly] ✓ confirmed read-only`)
}

/** Fetch the token URL from Ethereal and perform the action in one go. */
async function actViaEmail(
  page: Page,
  reviewerEmail: string,
  token: string,
  buttonLabel: string,
  comments: string,
  opts: ActionOpts = {},
): Promise<string> {
  const url = await getTokenUrlFromEthereal(etherealPage, reviewerEmail, token)
  await performAction(page, url, buttonLabel, comments, opts)
  return url
}

// ── Workflow Dashboard helpers ──────────────────────────────────────────────────

const DASHBOARD_URL = `${BASE_URL}/admin/globals/workflow-dashboard`

/** Navigate to the Workflow Dashboard and search for a submission by ID (debounced 300ms). */
async function openDashboardAndSearch(page: Page, query: string): Promise<void> {
  console.log(`[openDashboardAndSearch] query=${query}`)
  await page.goto(DASHBOARD_URL)
  const search = page.getByPlaceholder('Search by submitter, ID…')
  await search.waitFor({ state: 'visible', timeout: 15_000 })
  await search.click()
  await search.fill(query)
  await page.waitForTimeout(600) // debounce + refetch
}

function dashboardRow(page: Page, submissionId: string) {
  return page.locator('table tbody tr').filter({ hasText: submissionId })
}

/** Search the dashboard for `submissionId` and assert the row's visible text contains every expected substring. */
async function assertDashboardRow(
  page: Page,
  submissionId: string,
  expectedSubstrings: string[],
): Promise<void> {
  await openDashboardAndSearch(page, submissionId)
  const row = dashboardRow(page, submissionId)
  await expect(row).toBeVisible({ timeout: 15_000 })
  const text = (await row.innerText()).toLowerCase()
  for (const expected of expectedSubstrings) {
    expect(text, `dashboard row for ${submissionId} should contain "${expected}"`).toContain(
      expected.toLowerCase(),
    )
  }
  console.log(`[assertDashboardRow] ✓ row for ${submissionId} matched: ${expectedSubstrings.join(', ')}`)
}

/**
 * Opens the dashboard detail modal for `submissionId` (dashboard must already be searched/filtered
 * so the row is visible) and asserts the modal's status text + review history entries.
 */
async function assertDashboardDetail(
  page: Page,
  submissionId: string,
  expected: { status: string; reviewTexts: string[] },
): Promise<void> {
  const row = dashboardRow(page, submissionId)
  await row.click()
  const modal = page.getByRole('dialog', { name: 'workflow-detail-modal' })
  await expect(modal).toBeVisible({ timeout: 10_000 })
  await expect(modal).toContainText(expected.status)
  for (const reviewText of expected.reviewTexts) {
    await expect(modal, `detail modal should show review "${reviewText}"`).toContainText(reviewText)
  }
  await modal.getByRole('button', { name: 'CLOSE' }).click()
  await expect(modal).not.toBeVisible()
  console.log(`[assertDashboardDetail] ✓ detail modal for ${submissionId} matched`)
}

/**
 * Opens the Export to CSV modal, selects the CRM Case Management form, downloads the CSV,
 * and returns its raw text content for assertion.
 */
async function exportCrmCsv(page: Page): Promise<string> {
  console.log(`[exportCrmCsv] opening export modal`)
  await page.getByRole('button', { name: '📥 Export to CSV' }).click()
  const modal = page.getByRole('dialog', { name: 'export-csv-modal' })
  await expect(modal).toBeVisible({ timeout: 10_000 })
  await modal.locator('select').first().selectOption({ label: 'CRM Case Management' })

  const downloadPromise = page.waitForEvent('download')
  await modal.getByRole('button', { name: 'Download CSV' }).click()
  const download = await downloadPromise
  const path = await download.path()
  if (!path) throw new Error('CSV download did not produce a file path')
  const csv = fs.readFileSync(path, 'utf-8')
  console.log(`[exportCrmCsv] ✓ downloaded ${csv.length} bytes`)
  return csv
}

// ── Shared step runners (identical prefix of every non-VIP scenario) ───────────

/** Steps 1–7 for a NON-VIP case: register(is_vip=no) → classify → ack → investigation approved. */
async function runNonVipThroughInvestigation(
  page: Page,
  instanceId: string,
  tag: string,
): Promise<InstanceState> {
  let inst = await getWorkflowInstance(page, instanceId)
  expect(inst.step).toBe(STEP.register)

  // ── Step 1: Register Case — is_vip=no ──────────────────────────────────────
  const registerReview = findReview(inst.reviews, STEP.register, { pending: true })
  await actViaEmail(page, CS_TEAM_EMAIL, registerReview.reviewer_tokens?.[0]?.token, 'Confirm & Proceed', `${tag} — registered`, {
    selects: { is_vip: 'no' },
  })

  // ── Step 2 auto-skipped (vip-review), current = classify-prioritize ───────
  inst = await getWorkflowInstance(page, instanceId)
  expect(findReview(inst.reviews, STEP.vipReview)?.response).toBe('skipped')
  expect(inst.step).toBe(STEP.classify)
  console.log(`[${tag}] ✓ vip-review auto-skipped`)

  // ── Step 3: Classify and Prioritize — routes investigation to F&B ─────────
  const classifyReview = findReview(inst.reviews, STEP.classify, { pending: true })
  await actViaEmail(page, CS_TEAM_EMAIL, classifyReview.reviewer_tokens?.[0]?.token, 'Classified — Proceed', `${tag} — classified`, {
    selects: { case_category: 'fnb-service', severity: 'medium' },
  })

  // ── Step 4 (classify-vip) auto-skipped, current = acknowledge-customer ────
  inst = await getWorkflowInstance(page, instanceId)
  expect(findReview(inst.reviews, STEP.classifyVip)?.response).toBe('skipped')
  expect(inst.step).toBe(STEP.ack)

  // ── Step 5: Acknowledge Customer (acknowledge-only) ────────────────────────
  const ackReview = findReview(inst.reviews, STEP.ack, { pending: true })
  await actViaEmail(page, CS_TEAM_EMAIL, ackReview.reviewer_tokens?.[0]?.token, 'Customer Acknowledged', `${tag} — acknowledged`)

  // ── Step 6 (ack-vip) auto-skipped, current = department-investigation ─────
  inst = await getWorkflowInstance(page, instanceId)
  expect(findReview(inst.reviews, STEP.ackVip)?.response).toBe('skipped')
  expect(inst.step).toBe(STEP.investigation)

  // ── Step 7: Department Investigation — dynamic reviewer + signature ───────
  const investigationReview = findReview(inst.reviews, STEP.investigation, { pending: true })
  expect(investigationReview?.reviewer_tokens?.[0]?.email).toBe(FNB_MANAGER_EMAIL)
  console.log(`[${tag}] ✓ investigation reviewer resolved to ${FNB_MANAGER_EMAIL}`)
  await actViaEmail(page, FNB_MANAGER_EMAIL, investigationReview.reviewer_tokens?.[0]?.token, 'Resolved', `${tag} — investigated`, {
    selects: { refund_needed: 'no' },
    signature: true,
  })

  // ── Current = confirm-resolution (non-VIP variant; reviewer vip-manager) ──
  inst = await getWorkflowInstance(page, instanceId)
  expect(inst.step).toBe(STEP.confirm)
  return inst
}

/** Close Case + Report and Review, then assert completed. */
async function runClosingSteps(
  page: Page,
  instanceId: string,
  submissionId: string,
  tag: string,
): Promise<void> {
  let inst = await getWorkflowInstance(page, instanceId)
  expect(inst.step).toBe(STEP.close)

  const closeReview = findReview(inst.reviews, STEP.close, { pending: true })
  await actViaEmail(page, CS_TEAM_EMAIL, closeReview.reviewer_tokens?.[0]?.token, 'Close Case', `${tag} — case closed`)

  // report-review has hide_email_actions:true → build token URL from API data
  inst = await getWorkflowInstance(page, instanceId)
  expect(inst.step).toBe(STEP.report)
  const reportReview = findReview(inst.reviews, STEP.report, { pending: true })
  expect(reportReview?.reviewer_tokens?.[0]?.email).toBe(CRM_MANAGER_EMAIL)
  await performAction(page, buildTokenUrl(submissionId, reportReview.reviewer_tokens?.[0]?.token), 'Report Filed', `${tag} — report filed`)

  const finalInst = await getWorkflowInstance(page, instanceId)
  expect(finalInst.status).toBe('completed')
  expect(finalInst.step).toBe('completed')
  console.log(`[${tag}] ✓ workflow completed`)
}

// ── Suite setup ────────────────────────────────────────────────────────────────

test.describe('CRM Workflow V2 — E2E', () => {
  test.describe.configure({ timeout: 480_000 })

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000)

    // Shared Ethereal context — logged in once, reused across all tests
    etherealContext = await browser.newContext()
    etherealPage = await etherealContext.newPage()
    await loginToEthereal(etherealPage)
  })

  test.afterAll(async () => {
    await etherealContext?.close()
  })

  test.beforeEach(async ({ page }) => {
    // Authenticate with Payload admin (workflow-instances API needs a session)
    await page.goto(`${BASE_URL}/admin/login`)
    const emailInput = page.getByRole('textbox', { name: /email/i })
    await emailInput.waitFor({ state: 'visible', timeout: 20_000 })
    await emailInput.click()
    await emailInput.fill(ADMIN_EMAIL)
    await page.locator('input[type="password"]').click()
    await page.locator('input[type="password"]').fill(ADMIN_PASS)
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    await page.waitForURL(`${BASE_URL}/admin**`, { timeout: 20_000 })
    await page.waitForTimeout(1000) // allow cookie to settle

    // Resolve form ID (cached)
    if (!formId) {
      const data: any = await apiGet(page, `/forms?where[slug][equals]=${FORM_SLUG}&limit=1&depth=0`)
      formId = data.docs?.[0]?.id
      if (!formId) {
        console.error('Failed to get formId. API Response:', data);
        throw new Error(`Form "${FORM_SLUG}" not found — run seed first`)
      }
      console.log(`[beforeEach] formId=${formId}`)
    }
  })

  // ── Test 1: VIP path — VIP twins run, non-VIP twins auto-skipped ───────────

  test('Test 1 — VIP path (vip-review + VIP twins run, completes, customer notified)', async ({ page }) => {
    const customerEmail = `crm-e2e-vip-${Date.now()}@test.com`
    const submissionId = await createCrmSubmission(page, {
      customerName: 'CRM E2E VIP User',
      customerEmail,
    })

    let inst = await waitForWorkflowInstance(page, submissionId)
    expect(inst.step).toBe(STEP.register)

    // ── Step 1: Register Case — is_vip=yes ────────────────────────────────────
    const registerReview = findReview(inst.reviews, STEP.register, { pending: true })
    await actViaEmail(page, CS_TEAM_EMAIL, registerReview.reviewer_tokens?.[0]?.token, 'Confirm & Proceed', 'CRM Test 1 — registered VIP', {
      selects: { is_vip: 'yes' },
    })

    // ── Step 2: VIP Manager Review RUNS ───────────────────────────────────────
    inst = await getWorkflowInstance(page, inst.id)
    expect(inst.step).toBe(STEP.vipReview)
    const vipReview = findReview(inst.reviews, STEP.vipReview, { pending: true })
    expect(vipReview?.reviewer_tokens?.[0]?.email).toBe(VIP_MANAGER_EMAIL)
    const vipUrl = await actViaEmail(page, VIP_MANAGER_EMAIL, vipReview.reviewer_tokens?.[0]?.token, 'Approve', 'CRM Test 1 — VIP review approved')
    await verifyReadOnly(page, vipUrl)

    // ── Step 3 (classify non-VIP) auto-skipped → Step 4 (classify VIP) runs ──
    inst = await getWorkflowInstance(page, inst.id)
    expect(findReview(inst.reviews, STEP.classify)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.classifyVip)
    console.log(`[Test 1] ✓ non-VIP classify auto-skipped`)

    const classifyVipReview = findReview(inst.reviews, STEP.classifyVip, { pending: true })
    expect(classifyVipReview?.reviewer_tokens?.[0]?.email).toBe(CS_TEAM_EMAIL)
    await actViaEmail(page, CS_TEAM_EMAIL, classifyVipReview.reviewer_tokens?.[0]?.token, 'Classified — Proceed', 'CRM Test 1 — classified', {
      selects: { case_category: 'fnb-service', severity: 'high' },
    })

    // ── Step 5 (ack non-VIP) auto-skipped → Step 6 (ack VIP) runs ─────────────
    inst = await getWorkflowInstance(page, inst.id)
    expect(findReview(inst.reviews, STEP.ack)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.ackVip)

    const ackVipReview = findReview(inst.reviews, STEP.ackVip, { pending: true })
    await actViaEmail(page, CS_TEAM_EMAIL, ackVipReview.reviewer_tokens?.[0]?.token, 'Customer Acknowledged (VIP)', 'CRM Test 1 — acknowledged')

    // ── Step 7: Department Investigation — dynamic reviewer via case_category ─
    inst = await getWorkflowInstance(page, inst.id)
    expect(inst.step).toBe(STEP.investigation)
    const investigationReview = findReview(inst.reviews, STEP.investigation, { pending: true })
    expect(investigationReview?.reviewer_tokens?.[0]?.email).toBe(FNB_MANAGER_EMAIL)
    console.log(`[Test 1] ✓ investigation reviewer resolved to ${FNB_MANAGER_EMAIL}`)
    await actViaEmail(page, FNB_MANAGER_EMAIL, investigationReview.reviewer_tokens?.[0]?.token, 'Resolved', 'CRM Test 1 — investigated', {
      selects: { refund_needed: 'yes' },
      signature: true,
    })

    // ── Step 8 (confirm non-VIP) auto-skipped → Step 9 (confirm VIP) runs ─────
    inst = await getWorkflowInstance(page, inst.id)
    expect(findReview(inst.reviews, STEP.confirm)?.response).toBe('skipped')
    expect(inst.step).toBe(STEP.confirmVip)

    const confirmVipReview = findReview(inst.reviews, STEP.confirmVip, { pending: true })
    await actViaEmail(page, CS_TEAM_EMAIL, confirmVipReview.reviewer_tokens?.[0]?.token, 'Customer Satisfied — Close', 'CRM Test 1 — satisfied', {
      selects: { customer_satisfied: 'yes' },
    })

    // ── Steps 10–11 + completed ────────────────────────────────────────────────
    await runClosingSteps(page, inst.id, submissionId, 'Test 1')

    // ── Blueprint approval_notifications → customer_email gets "Approved" email ─
    await expectEmailInEthereal(etherealPage, customerEmail, 'Approved')
  })

  // ── Test 2: Non-VIP path — VIP twins auto-skipped ──────────────────────────

  test('Test 2 — non-VIP path (VIP twins skipped, completes, customer notified)', async ({ page }) => {
    const customerEmail = `crm-e2e-nonvip-${Date.now()}@test.com`
    const submissionId = await createCrmSubmission(page, {
      customerName: 'CRM E2E Non-VIP User',
      customerEmail,
    })

    const created = await waitForWorkflowInstance(page, submissionId)
    let inst = await runNonVipThroughInvestigation(page, created.id, 'Test 2')

    // ── Step 8: Confirm Resolution — customer satisfied ───────────────────────
    const confirmReview = findReview(inst.reviews, STEP.confirm, { pending: true })
    expect(confirmReview?.reviewer_tokens?.[0]?.email).toBe(CS_TEAM_EMAIL)
    const confirmUrl = await actViaEmail(page, CS_TEAM_EMAIL, confirmReview.reviewer_tokens?.[0]?.token, 'Customer Satisfied — Close', 'CRM Test 2 — satisfied', {
      selects: { customer_satisfied: 'yes' },
    })
    await verifyReadOnly(page, confirmUrl)

    // ── Step 9 (confirm VIP) auto-skipped ─────────────────────────────────────
    inst = await getWorkflowInstance(page, created.id)
    expect(findReview(inst.reviews, STEP.confirmVip)?.response).toBe('skipped')

    // ── Steps 10–11 + completed ────────────────────────────────────────────────
    await runClosingSteps(page, created.id, submissionId, 'Test 2')

    await expectEmailInEthereal(etherealPage, customerEmail, 'Approved')
  })

  // ── Test 3: Loop-back — customer NOT satisfied reopens investigation ────────

  test('Test 3 — confirm-resolution rejected loops back to department-investigation, then completes', async ({ page }) => {
    const customerEmail = `crm-e2e-loop-${Date.now()}@test.com`
    const submissionId = await createCrmSubmission(page, {
      customerName: 'CRM E2E Loop User',
      customerEmail,
    })

    const created = await waitForWorkflowInstance(page, submissionId)
    let inst = await runNonVipThroughInvestigation(page, created.id, 'Test 3')

    // ── Step 8: Confirm Resolution — REJECT ("Customer Not Satisfied — Reopen") ─
    const confirmReview = findReview(inst.reviews, STEP.confirm, { pending: true })
    await actViaEmail(page, CS_TEAM_EMAIL, confirmReview.reviewer_tokens?.[0]?.token, 'Customer Not Satisfied — Reopen', 'CRM Test 3 — not satisfied', {
      selects: { customer_satisfied: 'no' },
    })

    // ── Loop-back assertions ───────────────────────────────────────────────────
    inst = await getWorkflowInstance(page, created.id)
    expect(inst.status).toBe('in_review')
    expect(inst.step).toBe(STEP.investigation)
    console.log(`[Test 3] ✓ looped back to department-investigation`)

    const investigationIter2 = findReview(inst.reviews, STEP.investigation, { iteration: 2 })
    expect(investigationIter2).toBeTruthy()
    expect(investigationIter2?.response).toBe('pending')
    expect(investigationIter2?.reviewer_tokens?.[0]?.email).toBe(FNB_MANAGER_EMAIL)
    expect(investigationIter2?.reviewer_tokens?.[0]?.token).not.toBe(
      findReview(inst.reviews, STEP.investigation, { iteration: 1 })?.reviewer_tokens?.[0]?.token,
    )

    // Regression for the splice fix: the iteration-2 review must sit immediately
    // AFTER the rejected confirm-resolution review, not at the end of the array.
    // (push() at the end made the engine complete the workflow after its approval,
    // skipping close-case and report-review.)
    const rejectedIdx = inst.reviews.findIndex(
      (r: any) => r.status_slug === STEP.confirm && r.response === 'rejected',
    )
    const iter2Idx = inst.reviews.findIndex(
      (r: any) => r.status_slug === STEP.investigation && (r.iteration || 1) === 2,
    )
    expect(rejectedIdx).toBeGreaterThan(-1)
    expect(iter2Idx).toBe(rejectedIdx + 1)
    console.log(`[Test 3] ✓ iteration-2 review inserted at index ${iter2Idx} (right after rejected step at ${rejectedIdx})`)

    // ── Step 7 (iteration 2): investigate again ────────────────────────────────
    await actViaEmail(page, FNB_MANAGER_EMAIL, investigationIter2.reviewer_tokens?.[0]?.token, 'Resolved', 'CRM Test 3 — re-investigated', {
      selects: { refund_needed: 'yes' },
      signature: true,
    })

    // ── After iteration-2 approval the workflow must RESUME (not complete) ─────
    inst = await getWorkflowInstance(page, created.id)
    expect(inst.status).toBe('in_review')
    expect(inst.step).toBe(STEP.close)
    expect(findReview(inst.reviews, STEP.confirmVip)?.response).toBe('skipped')
    console.log(`[Test 3] ✓ resumed at close-case after loop-back (not falsely completed)`)

    // ── Steps 10–11 + completed ────────────────────────────────────────────────
    await runClosingSteps(page, created.id, submissionId, 'Test 3')

    await expectEmailInEthereal(etherealPage, customerEmail, 'Approved')
  })

  // ── Test 5: Workflow Dashboard reporting accuracy ───────────────────────────

  test('Test 5 — Workflow Dashboard reflects CRM submission status, steps, and history accurately', async ({
    page,
  }) => {
    const customerEmail = `crm-e2e-dashboard-${Date.now()}@test.com`
    const submissionId = await createCrmSubmission(page, {
      customerName: 'CRM E2E Dashboard User',
      customerEmail,
    })

    const created = await waitForWorkflowInstance(page, submissionId)
    await runNonVipThroughInvestigation(page, created.id, 'Test 5')

    // ── Dashboard checkpoint 1: mid-flow (investigation approved, at confirm-resolution) ─
    await assertDashboardRow(page, submissionId, ['CRM Case Management', 'V2', 'in review'])
    await assertDashboardDetail(page, submissionId, {
      status: 'in_review',
      reviewTexts: ['Register Case', 'approved', 'Department Investigation', 'approved'],
    })
    console.log(`[Test 5] ✓ dashboard accurate mid-flow`)

    // ── Finish the flow ────────────────────────────────────────────────────────
    let inst = await getWorkflowInstance(page, created.id)
    const confirmReview = findReview(inst.reviews, STEP.confirm, { pending: true })
    await actViaEmail(page, CS_TEAM_EMAIL, confirmReview.reviewer_tokens?.[0]?.token, 'Customer Satisfied — Close', 'CRM Test 5 — satisfied', {
      selects: { customer_satisfied: 'yes' },
    })
    await runClosingSteps(page, created.id, submissionId, 'Test 5')

    // ── Dashboard checkpoint 2: completed ──────────────────────────────────────
    await assertDashboardRow(page, submissionId, ['CRM Case Management', 'V2', 'completed'])
    await assertDashboardDetail(page, submissionId, {
      status: 'completed',
      reviewTexts: ['Register Case', 'Department Investigation', 'Close Case', 'Report and Review'],
    })
    console.log(`[Test 5] ✓ dashboard accurate after completion`)

    // ── CSV export parity: exported row must match the dashboard/API state ─────
    const csv = await exportCrmCsv(page)
    expect(csv, 'CSV export should include this submission').toContain(submissionId)
    const csvRow = csv.split('\n').find((line) => line.includes(submissionId))
    expect(csvRow, 'CSV row for this submission should exist').toBeTruthy()
    expect(csvRow!.toLowerCase()).toContain('completed')
    console.log(`[Test 5] ✓ CSV export matches dashboard state`)

    await expectEmailInEthereal(etherealPage, customerEmail, 'Approved')
  })
})
