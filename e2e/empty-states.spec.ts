import { expect, test, type Page } from '@playwright/test'

async function addBook(page: Page, title: string, author: string) {
  await page.goto('/books/new')
  await page.getByLabel('Title', { exact: true }).fill(title)
  await page.getByLabel('Author', { exact: true }).fill(author)
  await page.getByRole('button', { name: 'Add book' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('row').filter({ hasText: title })).toBeVisible()
}

test('clears a search with no matches', async ({ page }) => {
  const title = `Klara and the Sun ${Date.now()}`
  await addBook(page, title, 'Kazuo Ishiguro')

  await page.goto('/')
  const row = page.getByRole('row').filter({ hasText: title })
  await expect(row).toBeVisible()
  await page.waitForTimeout(1000)

  const search = page.getByLabel('Search books by title')
  await search.fill(`zzz-${Date.now()}`)
  await expect(page.getByText('No books match your search')).toBeVisible()
  await page.waitForTimeout(1500)

  await page.getByRole('link', { name: 'Clear search and filter' }).click()
  await expect(page).toHaveURL('/')
  await expect(row).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Filter by status' })
      .getByRole('link', { name: 'All', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(search).toHaveValue('')
  await page.waitForTimeout(1500)
})
