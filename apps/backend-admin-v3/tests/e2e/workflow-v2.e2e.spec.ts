/**
 * Workflow V2 E2E Tests
 *
 * Covers:
 *   Test 1 - Happy path: approve all 5 steps
 *   Test 2 - Approve Step 1, Reject Step 2 → rejection_policy:'previous' loops back to Step 1
 *   Test 3 - Approve Steps 1+2, Reject Step 3 → loops back to Step 2
 *   Test 4 - Full happy path (second complete run, verifies step 4 workflow_field_email re-resolution)
 *
 * For each step:
 *   1. Gets the reviewer token from the workflow instance API
 *   2. Navigates to Ethereal (smtp trap) to locate the notification email
 *   3. Verifies the email arrived and extracts the "View Submission" link
 *   4. Navigates to that token URL and performs the approval/rejection via UI
 *   5. Re-navigates to the same URL and verifies it becomes "View Only"
 *
 * Pre-requisites:
 *   - Dev server running at http://localhost:3015
 *   - Seed data: workflow-v2-test blueprint + test-form-do-wf2 form
 *   - SMTP configured to Ethereal: agustin55@ethereal.email
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

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

const FORM_SLUG = 'test-form-do-wf2'

// ── Shared state ───────────────────────────────────────────────────────────────

let formId: string
let etherealContext: BrowserContext
let etherealPage: Page

// ── API helpers ────────────────────────────────────────────────────────────────

/** GET /api/{path} in the page's authenticated context */
async function apiGet<T = any>(page: Page, path: string): Promise<T> {
  console.log(`[apiGet] GET ${API}${path}`)
  return page.evaluate(([api, p]) => fetch(`${api}${p}`).then((r) => r.json()), [API, path] as [
    string,
    string,
  ])
}

/** Create a form submission via the Payload REST API */
async function createSubmission(
  page: Page,
  data: { name: string; email: string; managerEmail: string; gendar?: string },
): Promise<string> {
  console.log(
    `[createSubmission] name=${data.name} email=${data.email} manager=${data.managerEmail}`,
  )
  const result: any = await page.evaluate(
    ([api, fId, d]) =>
      fetch(`${api}/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: fId,
          submissionData: [
            { field: 'name', value: d.name },
            { field: 'email', value: d.email },
            { field: 'manager_email', value: d.managerEmail },
            { field: 'gendar', value: d.gendar ?? 'male' },
          ],
        }),
      }).then((r) => r.json()),
    [API, formId, data] as [string, string, typeof data],
  )
  if (!result.doc?.id) {
    throw new Error(`createSubmission failed: ${JSON.stringify(result.errors)}`)
  }
  console.log(`[createSubmission] ✓ submissionId=${result.doc.id}`)
  return result.doc.id as string
}

/** Poll until the workflow instance exists for this submission (created by afterChange hook) */
async function waitForWorkflowInstance(
  page: Page,
  submissionId: string,
  timeoutMs = 15_000,
): Promise<{ id: string; step: string; status: string; reviews: any[] }> {
  console.log(`[waitForWorkflowInstance] polling for submissionId=${submissionId}`)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const data: any = await apiGet(
      page,
      `/workflow-instances?where[document_id][equals]=${submissionId}&limit=1&depth=0`,
    )
    const inst = data.docs?.[0]
    if (inst?.id) {
      console.log(
        `[waitForWorkflowInstance] ✓ instanceId=${inst.id} step=${inst.current_step} status=${inst.status} reviews=${inst.reviews?.length ?? 0}`,
      )
      return {
        id: inst.id,
        step: inst.current_step,
        status: inst.status,
        reviews: inst.reviews ?? [],
      }
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`No workflow instance found for submission ${submissionId} after ${timeoutMs}ms`)
}

/** Fetch the latest state of a workflow instance */
async function getWorkflowInstance(
  page: Page,
  instanceId: string,
): Promise<{ step: string; status: string; reviews: any[] }> {
  console.log(`[getWorkflowInstance] instanceId=${instanceId}`)
  const data: any = await apiGet(page, `/workflow-instances/${instanceId}?depth=0`)
  console.log(
    `[getWorkflowInstance] ✓ step=${data.current_step} status=${data.status} reviews=${data.reviews?.length ?? 0}`,
  )
  return { step: data.current_step, status: data.status, reviews: data.reviews ?? [] }
}

/**
 * Returns the visible workflow h3 heading for the given text.
 * The page renders WorkflowFrontend twice (mobile + desktop containers) — only one is
 * visible at a given viewport via CSS (max-lg:hidden / max-lg:block). Using :visible
 * picks the correct one regardless of viewport width.
 */
function workflowHeading(page: Page, text: 'Your Action Required' | 'View Only') {
  const viewport = page.viewportSize()
  const isDesktop = !viewport || viewport.width >= 1024
  console.log(
    `[workflowHeading] "${text}" — viewport=${viewport?.width}x${viewport?.height} → ${isDesktop ? 'desktop' : 'mobile'} container`,
  )
  return page.locator('h3:visible').filter({ hasText: text })
}

// ── Ethereal helpers ──────────────────────────────────────────────────────────

/** Log into Ethereal email once for the entire test suite */
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
  // Ethereal redirects to / after login, not /messages
  await page.waitForURL(`${ETHEREAL_URL}/`, { timeout: 30_000 })
  await page.goto(`${ETHEREAL_URL}/messages`, { waitUntil: 'domcontentloaded' })
  console.log(`[loginToEthereal] ✓ logged in`)
}

/**
 * Navigate to Ethereal, find the message sent to `toEmail` that contains `token`,
 * click on it, and return the canonical review URL (rebased to localhost:3015).
 *
 * Searching by token makes this reliable even when many emails share the same recipient.
 */
async function getTokenUrlFromEthereal(
  page: Page,
  toEmail: string,
  token: string,
): Promise<string> {
  console.log(`[getTokenUrlFromEthereal] searching for email to=${toEmail} token=${token}`)
  // Reload messages list to pick up new emails
  await page.goto(`${ETHEREAL_URL}/messages`)
  await page.waitForSelector('table tbody tr', { timeout: 15_000 })

  // Scan recent messages addressed to this reviewer
  const rows = page.locator('table tbody tr').filter({ hasText: toEmail })
  await expect(rows.first()).toBeVisible({ timeout: 15_000 })

  const count = await rows.count()
  console.log(`[getTokenUrlFromEthereal] found ${count} message(s) to ${toEmail}`)

  for (let i = 0; i < Math.min(count, 10); i++) {
    console.log(`[getTokenUrlFromEthereal] checking message ${i + 1}/${Math.min(count, 10)}`)
    // Click the "Action Required: ..." link inside row[i] — newest first, advance on each retry
    const messageLink = rows
      .nth(i)
      .getByRole('link', { name: /Action Required:/i })
      .first()
    const linkText = await messageLink.textContent()
    console.log(`[getTokenUrlFromEthereal] opening: ${linkText?.trim()}`)
    await messageLink.click()
    await page.waitForSelector('.card-body, iframe', { timeout: 5_000 })

    // Extract token URL from the message body (plain DOM or inside an iframe).
    // Return the href as-is — the email already contains the correct localhost URL.
    const found = await page.evaluate(
      ([token]) => {
        const extractFromDoc = (doc: Document): string | null => {
          // Primary: find an anchor whose href contains the token
          const anchors = Array.from(doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
          const match = anchors.find(
            (a) => a.href.includes('/forms/submissions/') && a.href.includes(token),
          )
          if (match) return match.href

          // Fallback: scan raw text — stop at whitespace or brackets
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
    // This message didn't contain the token — go back and try the next one
    await page.goto(`${ETHEREAL_URL}/messages`)
    await page.waitForSelector('table tbody tr')
  }

  throw new Error(
    `Token URL containing token "${token}" not found in any recent emails to "${toEmail}"`,
  )
}

// ── Signature helper ───────────────────────────────────────────────────────────

/** Draw a signature on the visible canvas with two click strokes */
async function drawAndSaveSignature(page: Page, comments: string): Promise<void> {
  console.log(`[drawAndSaveSignature] clicking canvas to draw signature`)
  const canvas = page.locator('form:visible').filter({ hasText: comments }).locator('canvas')
  await canvas.click({ position: { x: 133, y: 72 } })
  await canvas.click({ position: { x: 214, y: 44 } })
  console.log(`[drawAndSaveSignature] ✓ done`)
}

// ── Review action helpers ──────────────────────────────────────────────────────

interface PerformActionOpts {
  /** Custom field values keyed by `field.name`, filled in the "Additional Information" section */
  customFields?: Record<string, string>
}

/**
 * Navigate to `tokenUrl`, fill comments + custom fields, draw signature, and click Approve.
 * Afterwards verifies the page has switched to "View Only".
 */
async function performApproval(
  page: Page,
  tokenUrl: string,
  comments: string,
  opts: PerformActionOpts = {},
): Promise<void> {
  console.log(`[performApproval] → ${tokenUrl}`)
  await page.goto(tokenUrl)
  await expect(workflowHeading(page, 'Your Action Required')).toBeVisible({ timeout: 20_000 })
  console.log(`[performApproval] page loaded — filling comments`)

  const commentsInput = page.getByRole('textbox', { name: 'Provide your feedback here...' })
  await commentsInput.click()
  await commentsInput.fill(comments)

  if (opts.customFields) {
    for (const [name, value] of Object.entries(opts.customFields)) {
      console.log(`[performApproval] filling custom field #fb-${name}="${value}"`)
      const cfInput = page.locator(`#fb-${name}:visible`)
      await cfInput.click()
      await cfInput.fill(value)
    }
  }

  await drawAndSaveSignature(page, comments)

  console.log(`[performApproval] clicking Approve`)
  await page.getByRole('button', { name: 'Approve' }).click()

  console.log(`[performApproval] confirming modal`)
  await expect(page.getByRole('heading', { name: 'Confirm Your Action' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(workflowHeading(page, 'View Only')).toBeVisible({ timeout: 20_000 })
  console.log(`[performApproval] ✓ approved — page is View Only`)
}

/**
 * Navigate to `tokenUrl`, fill comments, draw signature, and click Reject.
 * Afterwards verifies the page has switched to "View Only".
 */
async function performRejection(
  page: Page,
  tokenUrl: string,
  comments: string,
  opts: PerformActionOpts = {},
): Promise<void> {
  console.log(`[performRejection] → ${tokenUrl}`)
  await page.goto(tokenUrl)
  await expect(workflowHeading(page, 'Your Action Required')).toBeVisible({ timeout: 20_000 })
  console.log(`[performRejection] page loaded — filling comments`)

  const commentsInput = page.getByRole('textbox', { name: 'Provide your feedback here...' })
  await commentsInput.click()
  await commentsInput.fill(comments)

  if (opts.customFields) {
    for (const [name, value] of Object.entries(opts.customFields)) {
      console.log(`[performRejection] filling custom field #fb-${name}="${value}"`)
      const cfInput = page.locator(`#fb-${name}:visible`)
      await cfInput.click()
      await cfInput.fill(value)
    }
  }

  await drawAndSaveSignature(page, comments)

  console.log(`[performRejection] clicking Reject`)
  await page.getByRole('button', { name: 'Reject' }).click()

  console.log(`[performRejection] confirming modal`)
  await expect(page.getByRole('heading', { name: 'Confirm Your Action' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(workflowHeading(page, 'View Only')).toBeVisible({ timeout: 20_000 })
  console.log(`[performRejection] ✓ rejected — page is View Only`)
}

/** Re-visit a token URL and assert the page is in read-only mode */
async function verifyReadOnly(page: Page, tokenUrl: string): Promise<void> {
  console.log(`[verifyReadOnly] → ${tokenUrl}`)
  await page.goto(tokenUrl)
  await expect(workflowHeading(page, 'View Only')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Approve' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Reject' })).not.toBeVisible()
  console.log(`[verifyReadOnly] ✓ confirmed read-only`)
}

// ── Suite setup ────────────────────────────────────────────────────────────────

test.describe('Workflow V2 — E2E', () => {
  // Apply 5-min timeout to ALL hooks (beforeAll/afterAll) and tests in this block
  test.describe.configure({ timeout: 300_000 })

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000) // beforeAll needs its own timeout in Playwright 1.54
    // Shared Ethereal context — logged in once, reused across all tests
    etherealContext = await browser.newContext()
    etherealPage = await etherealContext.newPage()
    await loginToEthereal(etherealPage)
  })

  test.afterAll(async () => {
    await etherealContext?.close()
  })

  test.beforeEach(async ({ page }) => {
    // Authenticate with Payload admin so REST API calls work in-page.
    // Wait up to 20s for the React SPA to hydrate and render the login form.
    await page.goto(`${BASE_URL}/admin/login`)
    const emailInput = page.getByRole('textbox', { name: /email/i })
    await emailInput.waitFor({ state: 'visible', timeout: 20_000 })
    await emailInput.click()
    await emailInput.fill(ADMIN_EMAIL)
    await page.locator('input[type="password"]').click()
    await page.locator('input[type="password"]').fill(ADMIN_PASS)
    await page.getByRole('button', { name: 'Login', exact: true }).click()
    // After login Payload may redirect to /admin or /admin/<collection>
    await page.waitForURL(`${BASE_URL}/admin**`, { timeout: 20_000 })
    await page.waitForTimeout(1000) // allow auth cookie to settle before the API call below

    // Resolve form ID (cached after first run)
    if (!formId) {
      const data: any = await apiGet(
        page,
        `/forms?where[slug][equals]=${FORM_SLUG}&limit=1&depth=0`,
      )
      formId = data.docs?.[0]?.id
      if (!formId) throw new Error(`Form "${FORM_SLUG}" not found — run seed first`)
    }
  })

  // ── Test 1: Happy Path — Approve All 5 Steps ──────────────────────────────

  test('Test 1 — approve all 5 steps (happy path)', async ({ page }) => {
    // ── Setup ──────────────────────────────────────────────────────────────────
    const submissionId = await createSubmission(page, {
      name: 'E2E User 1',
      email: 'e2e-user1@test.com',
      managerEmail: 'e2e-manager1@test.com',
      gendar: 'male',
    })

    const instance = await waitForWorkflowInstance(page, submissionId)
    expect(instance.id).toBeTruthy()
    expect(instance.step).toContain('first-step')

    // Verify form_field_email reviewer was resolved at init time
    const step3Init = instance.reviews.find((r: any) => r.reviewer_tokens?.[0]?.approver_type === 'form_field_email')
    console.log(`step3Init ${step3Init}`)
    expect(step3Init?.reviewer_tokens?.[0]?.email).toBe('e2e-manager1@test.com')

    // Verify workflow_field_email reviewer is empty (deferred)
    const step4Init = instance.reviews.find((r: any) => r.reviewer_tokens?.[0]?.approver_type === 'workflow_field_email')
    console.log(`step4Init ${step4Init}`)
    expect(step4Init?.reviewer_tokens?.[0]?.email).toBe('')

    // ── Step 1: First Step ─────────────────────────────────────────────────────
    const step1Review = instance.reviews.find((r: any) => r.status_slug?.includes('first-step'))
    const step1TokenUrl = await getTokenUrlFromEthereal(
      etherealPage,
      'first-step.approver@email.com',
      step1Review.reviewer_tokens?.[0]?.token,
    )
    console.log(`step1TokenUrl ${step1TokenUrl}`)
    expect(step1TokenUrl).toContain(submissionId)
    expect(step1TokenUrl).toContain(step1Review.reviewer_tokens?.[0]?.token)

    await performApproval(page, step1TokenUrl, 'E2E Test 1 — Step 1 approved')
    await verifyReadOnly(page, step1TokenUrl)

    // Verify additional approver token for Step 1 is also read-only
    const additionalToken = step1Review.reviewer_tokens?.[1]?.token
    if (additionalToken) {
      await verifyReadOnly(
        page,
        `${BASE_URL}/forms/submissions/${submissionId}?token=${additionalToken}`,
      )
    }

    // ── Step 2: Second Step ────────────────────────────────────────────────────
    const step2Review = instance.reviews.find((r: any) => r.status_slug?.includes('second-step'))
    const step2TokenUrl = await getTokenUrlFromEthereal(
      etherealPage,
      'second-step.approver@email.com',
      step2Review.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, step2TokenUrl, 'E2E Test 1 — Step 2 approved')
    await verifyReadOnly(page, step2TokenUrl)

    // ── Step 3: Form Field Email Step ─────────────────────────────────────────
    // After Step 2 advance, the form_field_email step may get a new token.
    const instAfterStep2 = await getWorkflowInstance(page, instance.id)
    const step3Review = instAfterStep2.reviews.find(
      (r: any) => r.reviewer_tokens?.[0]?.approver_type === 'form_field_email' && r.response === 'pending',
    )
    expect(step3Review?.reviewer_tokens?.[0]?.email).toBe('e2e-manager1@test.com')

    const step3TokenUrl = await getTokenUrlFromEthereal(
      etherealPage,
      'e2e-manager1@test.com',
      step3Review.reviewer_tokens?.[0]?.token,
    )
    // Fill next_approver_email custom field so Step 4 can be resolved
    await performApproval(page, step3TokenUrl, 'E2E Test 1 — Step 3 approved', {
      customFields: { next_approver_email: 'e2e-workflow1@test.com' },
    })
    await verifyReadOnly(page, step3TokenUrl)

    // ── Verify Step 4 reviewer was re-resolved from custom field response ──────
    const instAfterStep3 = await getWorkflowInstance(page, instance.id)
    const step4After = instAfterStep3.reviews.find(
      (r: any) => r.reviewer_tokens?.[0]?.approver_type === 'workflow_field_email',
    )
    expect(step4After?.reviewer_tokens?.[0]?.email).toBe('e2e-workflow1@test.com')
    expect(step4After?.reviewer_tokens?.[0]?.token).not.toBe(step4Init?.reviewer_tokens?.[0]?.token) // Token was rotated

    // ── Step 4: Workflow Field Email Step ──────────────────────────────────────
    const step4TokenUrl = await getTokenUrlFromEthereal(
      etherealPage,
      'e2e-workflow1@test.com',
      step4After.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, step4TokenUrl, 'E2E Test 1 — Step 4 approved')
    await verifyReadOnly(page, step4TokenUrl)

    // ── Step 5: Third Step ─────────────────────────────────────────────────────
    const instAfterStep4 = await getWorkflowInstance(page, instance.id)
    const step5Review = instAfterStep4.reviews.find(
      (r: any) => r.status_slug?.includes('third-step') && r.response === 'pending',
    )
    const step5TokenUrl = await getTokenUrlFromEthereal(
      etherealPage,
      'third-step.approver@email.com',
      step5Review.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, step5TokenUrl, 'E2E Test 1 — Step 5 approved')
    await verifyReadOnly(page, step5TokenUrl)

    // ── Final status ───────────────────────────────────────────────────────────
    const finalInst = await getWorkflowInstance(page, instance.id)
    expect(finalInst.status).toBe('completed')
    expect(finalInst.step).toBe('completed')
  })

  // ── Test 2: Approve Step 1, Reject Step 2 → Loop-back ─────────────────────

  test('Test 2 — reject step 2, rejection_policy:previous loops back to step 1', async ({
    page,
  }) => {
    const submissionId = await createSubmission(page, {
      name: 'E2E User 2',
      email: 'e2e-user2@test.com',
      managerEmail: 'e2e-manager2@test.com',
      gendar: 'female',
    })
    const instance = await waitForWorkflowInstance(page, submissionId)

    // ── Step 1: Approve ────────────────────────────────────────────────────────
    const step1Review = instance.reviews.find((r: any) => r.status_slug?.includes('first-step'))
    const step1Url = await getTokenUrlFromEthereal(
      etherealPage,
      'first-step.approver@email.com',
      step1Review.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, step1Url, 'E2E Test 2 — Step 1 approved')
    await verifyReadOnly(page, step1Url)

    // ── Step 2: Reject ─────────────────────────────────────────────────────────
    const instAfterStep1 = await getWorkflowInstance(page, instance.id)
    const step2Review = instAfterStep1.reviews.find(
      (r: any) => r.status_slug?.includes('second-step') && r.response === 'pending',
    )
    const step2Url = await getTokenUrlFromEthereal(
      etherealPage,
      'second-step.approver@email.com',
      step2Review.reviewer_tokens?.[0]?.token,
    )
    await performRejection(page, step2Url, 'E2E Test 2 — Step 2 rejected')
    await verifyReadOnly(page, step2Url)

    // ── Verify loop-back ────────────────────────────────────────────────────────
    const instAfterReject = await getWorkflowInstance(page, instance.id)
    expect(instAfterReject.status).toBe('in_review')
    expect(instAfterReject.step).toContain('first-step')

    const loopReview = instAfterReject.reviews.find(
      (r: any) => r.status_slug?.includes('first-step') && r.iteration === 2,
    )
    expect(loopReview).toBeTruthy()
    expect(loopReview?.response).toBe('pending')
    expect(loopReview?.reviewer_tokens?.[0]?.token).toBeTruthy()
    // New iteration appended — total reviews = original 5 + 1 loop entry
    expect(instAfterReject.reviews).toHaveLength(6)

    // ── Verify new Step 1 email arrived in Ethereal with the fresh token ────────
    const loopStep1Url = await getTokenUrlFromEthereal(
      etherealPage,
      'first-step.approver@email.com',
      loopReview.reviewer_tokens?.[0]?.token,
    )
    expect(loopStep1Url).toContain(loopReview.reviewer_tokens?.[0]?.token)
    expect(loopStep1Url).not.toBe(step1Url) // Different token from iteration 1

    // Navigate to loop-back Step 1 URL — should be actionable, not read-only
    await page.goto(loopStep1Url)
    await expect(workflowHeading(page, 'Your Action Required')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible()
  })

  // ── Test 3: Approve Steps 1+2, Reject Step 3 → Loop-back ──────────────────

  test('Test 3 — reject step 3 (form_field_email), rejection_policy:previous loops back to step 2', async ({
    page,
  }) => {
    const submissionId = await createSubmission(page, {
      name: 'E2E User 3',
      email: 'e2e-user3@test.com',
      managerEmail: 'e2e-manager3@test.com',
      gendar: 'male',
    })
    const instance = await waitForWorkflowInstance(page, submissionId)

    // ── Step 1: Approve ────────────────────────────────────────────────────────
    const step1Review = instance.reviews.find((r: any) => r.status_slug?.includes('first-step'))
    const step1Url = await getTokenUrlFromEthereal(
      etherealPage,
      'first-step.approver@email.com',
      step1Review.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, step1Url, 'E2E Test 3 — Step 1 approved')

    // ── Step 2: Approve ────────────────────────────────────────────────────────
    const instAfterStep1 = await getWorkflowInstance(page, instance.id)
    const step2Review = instAfterStep1.reviews.find(
      (r: any) => r.status_slug?.includes('second-step') && r.response === 'pending',
    )
    const step2Url = await getTokenUrlFromEthereal(
      etherealPage,
      'second-step.approver@email.com',
      step2Review.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, step2Url, 'E2E Test 3 — Step 2 approved')
    await verifyReadOnly(page, step2Url)

    // ── Step 3: Reject (form_field_email — reviewer = manager3) ───────────────
    const instAfterStep2 = await getWorkflowInstance(page, instance.id)
    const step3Review = instAfterStep2.reviews.find(
      (r: any) => r.reviewer_tokens?.[0]?.approver_type === 'form_field_email' && r.response === 'pending',
    )
    expect(step3Review?.reviewer_tokens?.[0]?.email).toBe('e2e-manager3@test.com')

    const step3Url = await getTokenUrlFromEthereal(
      etherealPage,
      'e2e-manager3@test.com',
      step3Review.reviewer_tokens?.[0]?.token,
    )
    await performRejection(page, step3Url, 'E2E Test 3 — Step 3 rejected', {
      customFields: { next_approver_email: 'e2e-next-approver3@test.com' },
    })
    await verifyReadOnly(page, step3Url)

    // ── Verify loop-back to Step 2 ─────────────────────────────────────────────
    const instAfterReject = await getWorkflowInstance(page, instance.id)
    expect(instAfterReject.status).toBe('in_review')
    expect(instAfterReject.step).toContain('second-step')

    const loopReview = instAfterReject.reviews.find(
      (r: any) => r.status_slug?.includes('second-step') && r.iteration === 2,
    )
    expect(loopReview).toBeTruthy()
    expect(loopReview?.response).toBe('pending')
    expect(instAfterReject.reviews).toHaveLength(6)

    // ── Verify new Step 2 email arrived in Ethereal ─────────────────────────────
    const loopStep2Url = await getTokenUrlFromEthereal(
      etherealPage,
      'second-step.approver@email.com',
      loopReview.reviewer_tokens?.[0]?.token,
    )
    expect(loopStep2Url).toContain(loopReview.reviewer_tokens?.[0]?.token)
    expect(loopStep2Url).not.toBe(step2Url)

    // Navigate to loop-back URL — should be actionable
    await page.goto(loopStep2Url)
    await expect(workflowHeading(page, 'Your Action Required')).toBeVisible({ timeout: 10_000 })
  })

  // ── Test 4: Full Happy Path (second clean run) ─────────────────────────────

  test('Test 4 — full happy path (second clean run, all 5 steps)', async ({ page }) => {
    const submissionId = await createSubmission(page, {
      name: 'E2E User 4',
      email: 'e2e-user4@test.com',
      managerEmail: 'e2e-manager4@test.com',
      gendar: 'female',
    })
    const instance = await waitForWorkflowInstance(page, submissionId)
    expect(instance.status).toBe('in_review')

    // Step 1
    const s1 = instance.reviews.find((r: any) => r.status_slug?.includes('first-step'))
    const s1Url = await getTokenUrlFromEthereal(
      etherealPage,
      'first-step.approver@email.com',
      s1.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, s1Url, 'E2E Test 4 — Step 1')
    await verifyReadOnly(page, s1Url)

    // Step 2
    const instS2 = await getWorkflowInstance(page, instance.id)
    const s2 = instS2.reviews.find(
      (r: any) => r.status_slug?.includes('second-step') && r.response === 'pending',
    )
    const s2Url = await getTokenUrlFromEthereal(
      etherealPage,
      'second-step.approver@email.com',
      s2.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, s2Url, 'E2E Test 4 — Step 2')
    await verifyReadOnly(page, s2Url)

    // Step 3 — form_field_email, set next_approver_email for step 4 resolution
    const instS3 = await getWorkflowInstance(page, instance.id)
    const s3 = instS3.reviews.find(
      (r: any) => r.reviewer_tokens?.[0]?.approver_type === 'form_field_email' && r.response === 'pending',
    )
    expect(s3?.reviewer_tokens?.[0]?.email).toBe('e2e-manager4@test.com')
    const s3Url = await getTokenUrlFromEthereal(etherealPage, 'e2e-manager4@test.com', s3.reviewer_tokens?.[0]?.token)
    await performApproval(page, s3Url, 'E2E Test 4 — Step 3', {
      customFields: { next_approver_email: 'e2e-workflow4@test.com' },
    })
    await verifyReadOnly(page, s3Url)

    // Verify Step 4 re-resolved
    const instS4 = await getWorkflowInstance(page, instance.id)
    const s4 = instS4.reviews.find((r: any) => r.reviewer_tokens?.[0]?.approver_type === 'workflow_field_email')
    expect(s4?.reviewer_tokens?.[0]?.email).toBe('e2e-workflow4@test.com')
    expect(s4?.reviewer_tokens?.[0]?.token).toBeTruthy()

    // Step 4 — workflow_field_email
    const s4Url = await getTokenUrlFromEthereal(etherealPage, 'e2e-workflow4@test.com', s4.reviewer_tokens?.[0]?.token)
    await performApproval(page, s4Url, 'E2E Test 4 — Step 4')
    await verifyReadOnly(page, s4Url)

    // Step 5
    const instS5 = await getWorkflowInstance(page, instance.id)
    const s5 = instS5.reviews.find(
      (r: any) => r.status_slug?.includes('third-step') && r.response === 'pending',
    )
    const s5Url = await getTokenUrlFromEthereal(
      etherealPage,
      'third-step.approver@email.com',
      s5.reviewer_tokens?.[0]?.token,
    )
    await performApproval(page, s5Url, 'E2E Test 4 — Step 5')
    await verifyReadOnly(page, s5Url)

    // Workflow completed
    const final = await getWorkflowInstance(page, instance.id)
    expect(final.status).toBe('completed')
    expect(final.step).toBe('completed')
  })
})
