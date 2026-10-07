import { chromium, type Page } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://172.18.25.87:3015'
const SCRATCHPAD_DIR =
  '/tmp/claude-1004/-home-lawrence-survey-doha-quest/ecbe5651-b447-4bf7-a69e-7c8efe1be8f4/scratchpad'
const LOG_FILE_PATH = path.join(SCRATCHPAD_DIR, 'jobs-runner.log')
const SCREENSHOT_1_PATH = path.join(SCRATCHPAD_DIR, '01-bulk-send-panel-result.png')
const SCREENSHOT_2_PATH = path.join(SCRATCHPAD_DIR, '02-survey-invitations-final-list.png')

const EMAILS = Array.from({ length: 20 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0')
  return `survey-test-${num}@example.com`
})

interface RowData {
  email: string
  status: string
  code: string
  errorMessage?: string
}

interface ConsoleMessageLog {
  type: string
  text: string
  location?: string
}

async function run() {
  if (!fs.existsSync(SCRATCHPAD_DIR)) {
    fs.mkdirSync(SCRATCHPAD_DIR, { recursive: true })
  }

  const consoleLogs: ConsoleMessageLog[] = []
  const pageErrors: string[] = []

  console.log('=== Starting E2E Bulk Send Invitations Test ===')
  console.log(`Target base URL: ${BASE_URL}/pv3/admin`)

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()

  // Attach console and error listeners before navigating
  page.on('console', (msg) => {
    const type = msg.type()
    const text = msg.text()
    if (type === 'error' || type === 'warning' || text.toLowerCase().includes('error')) {
      consoleLogs.push({
        type,
        text,
        location: msg.location().url ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
      })
    }
  })

  page.on('pageerror', (err) => {
    pageErrors.push(err.stack || err.message)
    console.error('[Browser PageError]', err)
  })

  try {
    // -------------------------------------------------------------
    // Step 0: Login
    // -------------------------------------------------------------
    console.log('\n--- Step 0: Login ---')
    await page.goto(`${BASE_URL}/pv3/admin/login`, { waitUntil: 'networkidle' })
    console.log('Navigated to login page. Filling credentials...')

    await page.fill('input[type="email"], input[name="email"]', 'default@payload.com')
    await page.fill('input[type="password"], input[name="password"]', 'default@payload.com')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/pv3/admin**', { timeout: 15000 })
    console.log('Logged in successfully. Current URL:', page.url())

    // -------------------------------------------------------------
    // Step 1: Navigate to Send Invitations panel
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Navigate to Survey Send Invitation Global ---')
    await page.goto(`${BASE_URL}/pv3/admin/globals/survey-send-invitation`, {
      waitUntil: 'networkidle',
    })
    console.log('Navigated to:', page.url())

    await page.waitForSelector('.bulk-send', { timeout: 10000 })

    // -------------------------------------------------------------
    // Step 2: Select form "Employee Experience Survey"
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Select Survey Form ---')
    await page.waitForFunction(() => {
      const select = document.querySelector('.bulk-send__form-field')
      return select && !select.textContent?.includes('Loading survey forms')
    }, { timeout: 10000 })

    const selectContainer = page.locator('.bulk-send__form-field .rs__control')
    await selectContainer.click()

    const optionLocator = page.locator('.rs__option', { hasText: 'Employee Experience Survey' })
    await optionLocator.waitFor({ state: 'visible', timeout: 5000 })
    await optionLocator.click()
    console.log('Selected "Employee Experience Survey"')

    // -------------------------------------------------------------
    // Step 3: Paste 20 recipient emails
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Paste 20 Recipient Emails ---')
    const textarea = page.locator('textarea[name="bulkSendEmails"], textarea#field-bulkSendEmails, .bulk-send textarea')
    await textarea.fill(EMAILS.join('\n'))
    console.log(`Pasted ${EMAILS.length} emails into textarea`)

    // -------------------------------------------------------------
    // Step 4: Click "Send invitations"
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Click Send Invitations ---')
    const sendButton = page.locator('.bulk-send__actions button', { hasText: 'Send invitations' })
    await sendButton.click()
    console.log('Clicked "Send invitations" button')

    // -------------------------------------------------------------
    // Step 5: Wait for and capture Banner text
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Capture Banner Result ---')
    const banner = page.locator('.bulk-send__banner, .banner')
    await banner.waitFor({ state: 'visible', timeout: 15000 })
    const bannerText = (await banner.textContent())?.trim() || ''
    const bannerClass = await banner.getAttribute('class')
    console.log(`Captured Banner Class: ${bannerClass}`)
    console.log(`Captured EXACT Banner Text: "${bannerText}"`)

    // -------------------------------------------------------------
    // Step 6: Take Screenshot 1 of the panel
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Save Panel Screenshot ---')
    await page.screenshot({ path: SCREENSHOT_1_PATH, fullPage: true })
    console.log(`Screenshot 1 saved to: ${SCREENSHOT_1_PATH}`)

    // -------------------------------------------------------------
    // Step 7: Navigate to Survey Invitations List (Immediate / Pending check)
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Check Survey Invitations List (Immediate) ---')
    await page.goto(
      `${BASE_URL}/pv3/admin/collections/survey-invitations?limit=50&sort=-createdAt`,
      { waitUntil: 'networkidle' },
    )
    await page.waitForSelector('table', { timeout: 10000 })

    const initialRows = await extractTableRows(page)
    console.log(`Found ${initialRows.length} rows matching survey-test-* immediately after submission:`)
    console.table(initialRows)

    // -------------------------------------------------------------
    // Step 8: Wait 70 seconds for background job runner cron tick
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Waiting 70 seconds for background worker cron tick... ---')
    for (let s = 70; s > 0; s -= 10) {
      console.log(`Waiting... ${s}s remaining`)
      await new Promise((r) => setTimeout(r, 10000))
    }
    console.log('Done waiting. Reloading Survey Invitations list...')

    await page.goto(
      `${BASE_URL}/pv3/admin/collections/survey-invitations?limit=50&sort=-createdAt`,
      { waitUntil: 'networkidle' },
    )
    await page.waitForSelector('table', { timeout: 10000 })

    const finalRows = await extractTableRows(page)
    console.log(`Found ${finalRows.length} rows after job execution:`)
    console.table(finalRows)

    // -------------------------------------------------------------
    // Step 9: Take Screenshot 2 of final list state
    // -------------------------------------------------------------
    console.log('\n--- Step 9: Save Final List Screenshot ---')
    await page.screenshot({ path: SCREENSHOT_2_PATH, fullPage: true })
    console.log(`Screenshot 2 saved to: ${SCREENSHOT_2_PATH}`)

    // Save summary JSON for reporting
    const summary = {
      bannerText,
      bannerClass,
      screenshot1: SCREENSHOT_1_PATH,
      screenshot2: SCREENSHOT_2_PATH,
      initialRows,
      finalRows,
      consoleLogs,
      pageErrors,
    }
    fs.writeFileSync(
      path.join(SCRATCHPAD_DIR, 'e2e-test-result.json'),
      JSON.stringify(summary, null, 2),
    )

    console.log('\n=== E2E Test Execution Finished ===')
  } catch (error) {
    console.error('Test execution failed:', error)
    await page.screenshot({
      path: path.join(SCRATCHPAD_DIR, 'error-screenshot.png'),
      fullPage: true,
    })
    throw error
  } finally {
    await browser.close()
  }
}

async function extractTableRows(page: Page): Promise<RowData[]> {
  return await page.evaluate(() => {
    const table = document.querySelector('table')
    if (!table) return []

    // Get column headers
    const ths = Array.from(table.querySelectorAll('thead th'))
    const headers = ths.map((th) => th.textContent?.trim().toLowerCase() || '')

    const emailColIdx = headers.findIndex((h) => h.includes('email'))
    const statusColIdx = headers.findIndex((h) => h.includes('status'))
    const codeColIdx = headers.findIndex((h) => h.includes('code'))
    const errorColIdx = headers.findIndex((h) => h.includes('error'))

    const rows = Array.from(table.querySelectorAll('tbody tr'))
    const results: { email: string; status: string; code: string; errorMessage?: string }[] = []

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'))
      if (cells.length === 0) continue

      const emailText = emailColIdx >= 0 ? cells[emailColIdx]?.textContent?.trim() || '' : ''
      const statusText = statusColIdx >= 0 ? cells[statusColIdx]?.textContent?.trim() || '' : ''
      const codeText = codeColIdx >= 0 ? cells[codeColIdx]?.textContent?.trim() || '' : ''
      const errorText = errorColIdx >= 0 ? cells[errorColIdx]?.textContent?.trim() || '' : undefined

      // Match test emails or all rows if email starts with survey-test
      if (emailText.includes('survey-test-')) {
        results.push({
          email: emailText,
          status: statusText,
          code: codeText,
          errorMessage: errorText || undefined,
        })
      }
    }

    return results
  })
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
