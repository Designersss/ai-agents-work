import { expect, test, type APIRequestContext } from '@playwright/test';

const mailpit = process.env.MAILPIT_URL ?? 'http://localhost:8025';

async function fetchMailLink(request: APIRequestContext, recipient: string, fragment: string, skipId = ''): Promise<{ id: string; link: string }> {
  const search = mailpit + '/api/v1/search?query=' + encodeURIComponent('to:' + recipient);
  let foundId = '';
  await expect.poll(async () => {
    const response = await request.get(search);
    if (!response.ok()) return '';
    const json = await response.json() as { messages: Array<{ ID: string; To: Array<{ Address: string }> }> };
    const entry = json.messages.find(m => m.ID !== skipId &&
      m.To.some(to => to.Address.toLowerCase() === recipient.toLowerCase()));
    foundId = entry?.ID ?? '';
    return foundId;
  }, { timeout: 30000, intervals: [350, 500, 1000] }).not.toBe('');
  const response = await request.get(mailpit + '/api/v1/message/' + foundId);
  expect(response.ok()).toBe(true);
  const mail = await response.json() as { Text: string };
  const urls = mail.Text.match(/https?:\/\/[^\s<>]+/g) ?? [];
  const link = urls.find(value => new URL(value).pathname.includes(fragment));
  expect(link).toBeTruthy();
  return { id: foundId, link: link! };
}

test('register -> verify actual email -> log in -> log out -> reset password', async ({ page, request }) => {
  const email = 'vimla-' + crypto.randomUUID() + '@example.test';
  const first = 'Long-Password-12345';
  const second = 'Changed-Password-56789';

  await page.goto('/sign-up');
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Ваше имя').fill('Vimla Reviewer');
  await page.getByLabel('Электронная почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(first);
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  const verify = await fetchMailLink(request, email, '/verify-email');
  await page.goto(verify.link);
  await expect(page).toHaveURL(/\/sign-in\?verified=1/);
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');

  await page.getByLabel('Электронная почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(first);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText('Email подтверждён')).toBeVisible();

  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByRole('link', { name: 'Забыли пароль?' }).click();
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Электронная почта').fill(email);
  await expect(page.getByLabel('Электронная почта')).toHaveValue(email);
  await page.getByRole('button', { name: 'Отправить ссылку' }).click();
  await expect(page.getByText(/Если аккаунт существует/)).toBeVisible();

  const reset = await fetchMailLink(request, email, '/reset-password', verify.id);
  await page.goto(reset.link);
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');
  await page.locator('input#password').fill(second);
  await page.getByRole('button', { name: 'Сохранить пароль' }).click();
  await expect(page.getByText(/Пароль изменён/)).toBeVisible();

  await page.getByRole('link', { name: 'Вернуться ко входу' }).click();
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Электронная почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(second);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/account/);
});

test('language and theme settings persist across reload', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Вход в аккаунт' })).toBeVisible();
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
  await expect(page.locator('[data-slot="input"]')).toHaveCount(2);
  await expect(page.getByRole('checkbox', { name: 'Запомнить меня' })).toBeVisible();
  const cardWidth = await page.locator('[data-slot="card"]').first().evaluate(el => el.getBoundingClientRect().width);
  expect(cardWidth).toBeLessThanOrEqual(380);
  await test.info().attach('Vimla login - light', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });

  await page.getByRole('combobox', { name: 'Язык' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Theme' }).click();
  await page.getByRole('option', { name: 'Dark' }).click();
  await test.info().attach('Vimla login - dark', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.goto('/sign-up');
  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
});
