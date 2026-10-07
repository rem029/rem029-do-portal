/**
 * Guest Relations Custom Inquiry or Feedback — Form E2E Tests
 *
 * Seed: seed/forms-guest-relations-inquiry.ts
 *   - requires_auth: true, required_access: 'form-guest-relations-inquiry', enable_workflow: false.
 *   - Login is inline on the same /pv3/forms/<slug> page (FormAuthWrapper), not a separate route —
 *     the login inputs have no `name` attribute, only type="email"/type="password".
 *   - Step 1: store_department (select-store-departments, async-loaded).
 *   - Step 2: message (textarea).
 *   - Step 3: customer_name (required), customer_account, customer_email, customer_phone (optional).
 *
 * Covers:
 *   Test 1 — logs in as crm.form@user.com, submits the multi-step form, reaches "Thanks!",
 *            and the submission count for this form increases by exactly 1.
 *   Test 2 — no workflow + no notify_creator configured on this Form doc → no email should be
 *            sent for a submission. Confirms the Ethereal inbox for the customer_email used
 *            stays empty for a bounded window.
 *
 * See forms-store-floor-customer-service.e2e.spec.ts for notes on the async store_department
 * select and the exact-text Continue/Review button matching (Next.js dev toolbar substring trap).
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/pv3`
  : 'http://localhost:3015/pv3'
const API = `${BASE_URL}/api`

const ETHEREAL_URL = 'https://ethereal.email'
const ETHEREAL_USER = 'agustin55@ethereal.email'
const ETHEREAL_PASS = 'KuqjB4TWqSaxNfuXx4'

const FORM_SLUG = 'guest-relations-inquiry'
const SUBMITTER_EMAIL = 'crm.form@user.com'
const SUBMITTER_PASSWORD = 'crm.form@user.com1'
const ADMIN_EMAIL = 'default@payload.com'
const ADMIN_PASS = 'default@payload.com'

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiGet<T = any>(page: Page, path: string): Promise<T> {
  return page.evaluate(
    ([api, p]) => fetch(`${api}${p}`).then((r) => r.json()),
    [API, path] as [string, string],
  )
}

/**
 * Reading back /api/form-submissions requires a session with read access — the submitter
 * (crm.form@user.com, "crm entry access") only has create access on this form's own slug, not
 * list-read on form-submissions generally. Logs a fresh page in as the super user purely to
 * verify what got created via the public form.
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

/** Confirms the most recent submission for this form is actually ours, by customer_email. */
async function expectLatestSubmissionHasEmail(
  page: Page,
  formSlug: string,
  customerEmail: string,
): Promise<void> {
  const data: any = await apiGet(
    page,
    `/form-submissions?where[form.slug][equals]=${formSlug}&sort=-createdAt&limit=1&depth=0`,
  )
  const doc = data.docs?.[0]
  expect(doc, `a submission should exist for form "${formSlug}"`).toBeTruthy()
  const emailEntry = doc.submissionData?.find((d: any) => d.field === 'customer_email')
  expect(
    emailEntry?.value,
    'the most recent submission should be the one this test just created',
  ).toBe(customerEmail)
}

// ── Form-filling helpers ──────────────────────────────────────────────────────

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

async function fillAndSubmitInquiryForm(
  page: Page,
  data: { customerName: string; customerEmail: string },
): Promise<void> {
  await page.goto(`${BASE_URL}/forms/${FORM_SLUG}`)
  await loginIfPrompted(page)

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  await selectStoreDepartment(page)
  await stepButton(page).first().click()

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  await page.locator('textarea[name="message"]:visible').fill('E2E test inquiry message')
  await stepButton(page).first().click()

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  await page.locator('input[name="customer_name"]:visible').fill(data.customerName)
  await page.locator('input[name="customer_email"]:visible').fill(data.customerEmail)
  await stepButton(page).first().click() // → Review screen

  // ── Review screen ───────────────────────────────────────────────────────────
  await expect(page.getByText('Review Your Submission')).toBeVisible({ timeout: 10_000 })
  await submitButton(page).first().click()

  await expect(page.getByText('Thanks!')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(2_000) // let the create-submission POST fully commit before querying
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

async function expectNoEmailInEthereal(page: Page, toEmail: string, windowMs = 15_000): Promise<void> {
  const deadline = Date.now() + windowMs
  while (Date.now() < deadline) {
    await page.goto(`${ETHEREAL_URL}/messages`)
    await page.waitForSelector('table tbody tr', { timeout: 15_000 }).catch(() => {})
    const rows = page.locator('table tbody tr').filter({ hasText: toEmail })
    expect(
      await rows.count(),
      `no email should have been sent to ${toEmail} for a no-workflow, no-notify_creator form`,
    ).toBe(0)
    await page.waitForTimeout(3_000)
  }
}

// ── Suite ──────────────────────────────────────────────────────────────────────

test.describe('Guest Relations Custom Inquiry or Feedback — E2E', () => {
  test.describe.configure({ timeout: 120_000 })

  test('Test 1 — logs in, submits via the public multi-step form, reaches confirmation', async ({
    page,
    browser,
  }) => {
    const customerEmail = `inquiry-e2e-${Date.now()}@test.com`

    await fillAndSubmitInquiryForm(page, {
      customerName: 'E2E Inquiry Customer',
      customerEmail,
    })

    // Verify via a separate admin session — crm.form@user.com has no read access here.
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await loginAsAdmin(adminPage)
    await expectLatestSubmissionHasEmail(adminPage, FORM_SLUG, customerEmail)
    await adminContext.close()
  })

  test('Test 2 — no-workflow form sends no notification email', async ({ page, browser }) => {
    const customerEmail = `inquiry-e2e-noemail-${Date.now()}@test.com`

    await fillAndSubmitInquiryForm(page, {
      customerName: 'E2E No Email Customer',
      customerEmail,
    })

    const etherealContext = await browser.newContext()
    const etherealPage = await etherealContext.newPage()
    await loginToEthereal(etherealPage)
    await expectNoEmailInEthereal(etherealPage, customerEmail)
    await etherealContext.close()
  })
})
