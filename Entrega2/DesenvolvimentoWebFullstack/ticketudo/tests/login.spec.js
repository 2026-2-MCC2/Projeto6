import { expect, test } from '@playwright/test'

test('abre o fluxo de recuperação de senha', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /entrar/i }).first().click()
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()

  await expect(page.getByRole('heading', { name: 'Recupere sua senha' })).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enviar código' })).toBeVisible()
})

test('formulario de login tem nomes acessiveis e foco visivel', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /entrar/i }).first().click()

  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByRole('textbox', { name: /senha/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mostrar senha' })).toBeVisible()

  await page.getByLabel('E-mail').focus()
  await expect(page.getByLabel('E-mail')).toBeFocused()
  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(page.getByRole('textbox', { name: /senha/i })).toHaveAttribute('type', 'text')
})
