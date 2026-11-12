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
  await page.getByLabel('Эл. почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(first);
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  const verify = await fetchMailLink(request, email, '/verify-email');
  await page.goto(verify.link);
  await expect(page).toHaveURL(/\/sign-in\?verified=1/);
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');

  await page.getByLabel('Эл. почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(first);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText('Email подтверждён')).toBeVisible();

  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByRole('link', { name: 'Забыли пароль?' }).click();
  await expect(page.locator('form.auth-form')).toHaveAttribute('data-ready', 'true');
  await page.getByLabel('Эл. почта').fill(email);
  await expect(page.getByLabel('Эл. почта')).toHaveValue(email);
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
  await page.getByLabel('Эл. почта').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(second);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/account/);
});

test('language and theme settings persist across reload', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
  await expect(page.locator('[data-slot="input"]')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Забыли пароль?' })).toBeVisible();
  const geometry = await page.locator('[data-slot="card"]').first().evaluate(el => ({
    width: el.getBoundingClientRect().width,
    border: getComputedStyle(el).borderTopWidth,
    shadow: getComputedStyle(el).boxShadow,
    background: getComputedStyle(el).backgroundColor
  }));
  expect(geometry.width).toBeLessThanOrEqual(410);
  expect(geometry.border).toBe('0px');
  expect(geometry.shadow).toBe('none');

  await page.getByRole('combobox', { name: 'Тема' }).click();
  await page.getByRole('option', { name: 'Светлая' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await test.info().attach('Vimla minimalist sign-in — light', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });

  await page.getByRole('combobox', { name: 'Язык' }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Theme' }).click();
  await page.getByRole('option', { name: 'Dark' }).click();
  await test.info().attach('Vimla minimalist sign-in — dark', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.goto('/sign-up');
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
});


test('frameless form stays centered, readable and free of horizontal scroll on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ['/sign-in', '/sign-up', '/forgot-password', '/verify-email']) {
    await page.goto(path);
    await expect(page.locator('[data-slot="card"]').first()).toBeVisible();
    const geometry = await page.locator('[data-slot="card"]').first().evaluate(el => ({
      left: el.getBoundingClientRect().left,
      right: el.getBoundingClientRect().right,
      background: getComputedStyle(el).backgroundColor,
      border: getComputedStyle(el).borderTopWidth,
      shadow: getComputedStyle(el).boxShadow
    }));
    expect(geometry.left).toBeGreaterThanOrEqual(15);
    expect(geometry.right).toBeLessThanOrEqual(345);
    expect(geometry.border).toBe('0px');
    expect(geometry.shadow).toBe('none');
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(360);
    await test.info().attach('Vimla mobile ' + path.slice(1), {
      body: await page.screenshot(),
      contentType: 'image/png'
    });
  }
});

test('all five locales retain accessible fields and frameless composition', async ({ page }) => {
  await page.goto('/sign-in');
  const localeNames = ['English', '简体中文', '日本語', 'Svenska', 'Русский'];
  const headingNames = ['Sign in', '登录', 'ログイン', 'Logga in', 'Вход'];
  for (let i = 0; i < localeNames.length; i++) {
    const langLabel = ['Язык', 'Language', '语言', '言語', 'Språk'][i];
    await page.getByRole('combobox', { name: langLabel }).click();
    await page.getByRole('option', { name: localeNames[i], exact: true }).click();
    await expect(page.getByRole('heading', { name: headingNames[i], exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="input"]')).toHaveCount(2);
  }
});


test('auth fields show localized inline errors instead of browser validation popups', async ({ page }) => {
  await page.goto('/sign-up');
  const form = page.locator('form.auth-form');
  await expect(form).toHaveAttribute('data-ready', 'true');
  expect(await form.evaluate(el => (el as HTMLFormElement).noValidate)).toBe(true);

  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page.locator('.auth-field-error')).toHaveCount(3);
  await expect(page.locator('[data-slot="input"][aria-invalid="true"]')).toHaveCount(3);
  await expect(page.getByLabel('Ваше имя')).toBeFocused();
  await expect(page.getByText('Заполните поле.')).toHaveCount(3);

  await page.getByLabel('Ваше имя').fill('Valid Name');
  await expect(page.locator('.auth-field-error')).toHaveCount(2);
  await page.getByLabel('Эл. почта').fill('not-an-email');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page.getByText('Введите корректный email.')).toBeVisible();
  await expect(page.getByLabel('Эл. почта')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Эл. почта').fill('new@example.test');
  await expect(page.getByLabel('Эл. почта')).toHaveAttribute('aria-invalid', 'false');

  await test.info().attach('Vimla inline registration validation', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
});

test('language selector highlights by background without a clipped blue outline', async ({ page }) => {
  await page.goto('/sign-in');
  const trigger = page.getByRole('combobox', { name: 'Язык' });
  await trigger.click();
  const english = page.getByRole('option', { name: 'English' });
  await english.hover();
  const style = await english.evaluate(el => ({
    background: getComputedStyle(el).backgroundColor,
    outline: getComputedStyle(el).outlineStyle
  }));
  expect(style.outline).toBe('none');
  expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
  await page.mouse.click(180, 200);
  await expect(page.getByRole('option', { name: 'English' })).not.toBeVisible();
  const triggerOutline = await trigger.evaluate(el => getComputedStyle(el).outlineColor);
  // Closing by clicking elsewhere must not leave the bright primary focus treatment behind.
  expect(triggerOutline).not.toBe('rgb(38, 118, 241)');
});

test('public home works, the centered brand leads home, and account requires login', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByRole('link', { name: 'Vimla' }).click();
  await expect(page).toHaveURL('http://localhost:3000/');
  await expect(page.getByRole('heading', { name: 'AI-агенты для рабочих задач' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Навигация' }).getByRole('link', { name: 'Знания' }).click();
  await expect(page).toHaveURL(/#knowledge$/);
  await page.getByRole('navigation', { name: 'Навигация' }).getByRole('link', { name: 'Вход' }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('mobile landing has usable navigation and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Навигация' }).getByRole('link', { name: 'Регистрация' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});


test('real API readiness depends on a database and a usable SMTP server', async ({ request }) => {
  const response = await request.get('http://localhost:4000/v1/ready');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ready' });
});
