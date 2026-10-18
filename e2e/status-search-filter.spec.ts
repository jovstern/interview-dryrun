import { expect, test, type Page, type Response } from '@playwright/test'
import type { BookStatus } from '@/app/lib/definitions'

async function addBook(page: Page, title: string, author: string, status?: BookStatus) {
  await page.goto('/books/new')
  await page.getByLabel('Title', { exact: true }).fill(title)
  await page.getByLabel('Author', { exact: true }).fill(author)
  if (status) {
    await page.getByLabel('Status', { exact: true }).selectOption(status)
  }
  await page.getByRole('button', { name: 'Add book' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('row').filter({ hasText: title })).toBeVisible()
}

// The status select shows the new value optimistically, so wait for the Server Action's
// response before reloading; otherwise the reload could race the save.
function isServerAction(response: Response) {
  const request = response.request()
  return request.method() === 'POST' && 'next-action' in request.headers()
}

test("changes a book's status and keeps it after reload", async ({ page }) => {
  const title = `Piranesi ${Date.now()}`
  await addBook(page, title, 'Susanna Clarke')

  const select = page.getByRole('combobox', { name: `Status of ${title}` })
  await expect(select).toHaveValue('want_to_read')
  await page.waitForTimeout(1000)

  const saved = page.waitForResponse(isServerAction)
  await select.selectOption({ label: 'Read' })
  await expect(select).toHaveValue('read')
  await saved
  await page.waitForTimeout(1500)

  await page.reload()
  await expect(page.getByRole('combobox', { name: `Status of ${title}` })).toHaveValue('read')
  await page.waitForTimeout(1500)
})

test('search and filter survive a reload and work from a shared link', async ({ page }) => {
  const id = Date.now()
  const alpha = `Alpha ${id}`
  const beta = `Beta ${id}`
  await addBook(page, alpha, 'Ann Author', 'reading')
  await addBook(page, beta, 'Ben Author', 'read')
  await page.waitForTimeout(1000)

  async function expectOnlyAlpha(p: Page) {
    await expect(p.getByRole('row').filter({ hasText: alpha })).toBeVisible()
    await expect(p.getByRole('row').filter({ hasText: beta })).toHaveCount(0)
  }

  const search = page.getByLabel('Search books by title')
  await search.fill(alpha)
  await expect(page).toHaveURL(/query=/)
  await expectOnlyAlpha(page)
  await page.waitForTimeout(1500)

  const filter = page.getByRole('navigation', { name: 'Filter by status' })
  await filter.getByRole('link', { name: 'Reading', exact: true }).click()
  await expect(page).toHaveURL(/query=/)
  await expect(page).toHaveURL(/status=reading/)
  await expect(filter.getByRole('link', { name: 'Reading', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expectOnlyAlpha(page)
  await page.waitForTimeout(1500)

  await page.reload()
  await expect(page.getByLabel('Search books by title')).toHaveValue(alpha)
  await expect(page).toHaveURL(/query=/)
  await expect(page).toHaveURL(/status=reading/)
  await expectOnlyAlpha(page)
  await page.waitForTimeout(1500)

  const url = page.url()
  const p2 = await page.context().newPage()
  await p2.goto(url)
  await expect(p2.getByLabel('Search books by title')).toHaveValue(alpha)
  await expect(
    p2
      .getByRole('navigation', { name: 'Filter by status' })
      .getByRole('link', { name: 'Reading', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expectOnlyAlpha(p2)
  await p2.waitForTimeout(1500)

  // Both titles contain the id, so only the status can exclude Alpha.
  await p2.goto(`/?query=${id}&status=read`)
  await expect(p2.getByRole('row').filter({ hasText: beta })).toBeVisible()
  await expect(p2.getByRole('row').filter({ hasText: alpha })).toHaveCount(0)
  await p2.waitForTimeout(1500)
})

test('ignores an unknown status in the URL', async ({ page }) => {
  await page.goto('/?status=bogus')
  await expect(page.getByLabel('Search books by title')).toBeVisible()
  await expect(
    page
      .getByRole('table', { name: 'Your books' })
      .or(page.getByText('Your reading list is empty')),
  ).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Filter by status' })
      .getByRole('link', { name: 'All', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
})
