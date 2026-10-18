import { expect, test } from '@playwright/test'

test('adds a book and shows it in the list', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1000)
  await page.getByRole('link', { name: 'Add book' }).click()
  await expect(page).toHaveURL('/books/new')

  // Native `required` blocks a truly empty submit; a space reaches the server, which trims it.
  await page.getByLabel('Title', { exact: true }).fill(' ')
  await page.getByLabel('Author', { exact: true }).fill(' ')
  await page.getByRole('button', { name: 'Add book' }).click()
  await expect(page.getByText('Enter a title')).toBeVisible()
  await expect(page.getByText('Enter an author')).toBeVisible()
  await page.waitForTimeout(1500)

  const title = `Dune ${Date.now()}`
  await page.getByLabel('Title', { exact: true }).fill(title)
  await page.getByLabel('Author', { exact: true }).fill('Frank Herbert')
  await page.getByRole('button', { name: 'Add book' }).click()

  await expect(page).toHaveURL('/')
  const row = page.getByRole('row').filter({ hasText: title })
  await expect(row).toBeVisible()
  await expect(row).toContainText('Frank Herbert')
  await expect(row).toContainText('Want to read')
  await page.waitForTimeout(1500)

  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: title })).toBeVisible()
  await page.waitForTimeout(1500)
})
