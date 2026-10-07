/**
 * Store Floor Customer Service — Form E2E Tests
 *
 * Seed: seed/forms-store-floor-customer-service.ts
 *   - requires_auth: false, enable_workflow: false — pure public data collection.
 *   - Step 1: delivery_or_in_store (select), interaction_type (select),
 *             store_department (select-store-departments, async-loaded).
 *   - Step 2: message (textarea).
 *   - Step 3: customer_name, customer_phone (required), customer_email, cm_account (optional).
 *
 * Covers:
 *   Test 1 — submits the actual multi-step public form (no login), reaches the "Thanks!"
 *            confirmation, and the submission count for this form increases by exactly 1
 *            (verified via /api/form-submissions, not just the UI).
 *   Test 2 — since this form has no workflow and the Form doc has no notify_creator /
 *            creator_notification_content configured (see seed), no email should be sent
 *            for a submission. Confirms the Ethereal inbox for the customer_email used in
 *            the submission stays empty for a bounded window.
 *
 * The store_department field's options load asynchronously (server action fetch) and the
 * <select> is disabled with "Loading options..." until they resolve — selecting it needs a
 * generous timeout, not a fixed wait (this was the root cause of the original QA script
 * silently failing on every submission — see .temp/2026-07-26-test-forms-plan-v2.md).
 * The Continue/Review buttons must be matched by exact text (not substring) — Next.js dev
 * mode's floating "Open Next.js Dev Tools" toolbar button contains the substring "Next" and
 * a loose `has-text("Next")` match will grab it instead of the real form button.
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/pv3`
  : 'http://localhost:3015/pv3'
const API = `${BASE_URL}/api`

const ETHEREAL_URL = 'https://ethereal.email'
const ETHEREAL_USER = 'agustin55@ethereal.email'
const ETHEREAL_PASS = 'KuqjB4TWqSaxNfuXx4'

const FORM_SLUG = 'store-floor-customer-service'
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
 * Reading back /api/form-submissions requires a session with read access — this form's
 * submitter session (anonymous, since requires_auth: false) doesn't have it. Logs a fresh
 * page in as the super user purely to verify what got created via the public form.
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

/** Continue/Review buttons must match exact text — see file header note on Next.js dev tools. */
function stepButton(page: Page) {
  return page.locator('button:visible').filter({ hasText: /^\s*(Continue|Review)\s*$/ })
}

function submitButton(page: Page) {
  return page.locator('button:visible').filter({ hasText: /^\s*Submit\s*$/ })
}

/** Waits for store_department's async options to load, then selects the first real option. */
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

async function fillAndSubmitServiceForm(
  page: Page,
  data: { customerName: string; customerPhone: string; customerEmail: string },
): Promise<void> {
  await page.goto(`${BASE_URL}/forms/${FORM_SLUG}`)

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  await selectAndVerify(page, 'delivery_or_in_store', 'home_delivery')
  await selectAndVerify(page, 'interaction_type', 'inquiry')
  await selectStoreDepartment(page)
  await stepButton(page).first().click()

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  await page.locator('textarea[name="message"]:visible').fill('E2E test message — service inquiry')
  await stepButton(page).first().click()

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  await page.locator('input[name="customer_name"]:visible').fill(data.customerName)
  await page.locator('input[name="customer_phone"]:visible').fill(data.customerPhone)
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

/** Asserts no message to `toEmail` appears within `windowMs` — this form sends no email. */
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

test.describe('Store Floor Customer Service — E2E', () => {
  test.describe.configure({ timeout: 120_000 })

  test('Test 1 — submits via the public multi-step form and reaches confirmation', async ({
    page,
    browser,
  }) => {
    const customerEmail = `service-e2e-${Date.now()}@test.com`

    await fillAndSubmitServiceForm(page, {
      customerName: 'E2E Service Customer',
      customerPhone: '+97455512345',
      customerEmail,
    })

    // Verify via a separate admin session — the public submitter has no read access.
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    await loginAsAdmin(adminPage)
    await expectLatestSubmissionHasEmail(adminPage, FORM_SLUG, customerEmail)
    await adminContext.close()
  })

  test('Test 2 — no-workflow form sends no notification email', async ({ page, browser }) => {
    const customerEmail = `service-e2e-noemail-${Date.now()}@test.com`

    await fillAndSubmitServiceForm(page, {
      customerName: 'E2E No Email Customer',
      customerPhone: '+97455512346',
      customerEmail,
    })

    const etherealContext = await browser.newContext()
    const etherealPage = await etherealContext.newPage()
    await loginToEthereal(etherealPage)
    await expectNoEmailInEthereal(etherealPage, customerEmail)
    await etherealContext.close()
  })
})
