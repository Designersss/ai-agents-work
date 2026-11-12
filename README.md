# Vimla — платформа AI-агентов

Основная архитектура: [#2](https://github.com/Designersss/ai-agents-work/issues/2). Утверждённый дизайн Auth: [#17](https://github.com/Designersss/ai-agents-work/issues/17), реальная Auth: [#7](https://github.com/Designersss/ai-agents-work/issues/7), брендинг: [#19](https://github.com/Designersss/ai-agents-work/issues/19).

## Текущий PR: реальный email/password Auth

Next.js (App Router) UI + NestJS/Better Auth API + PostgreSQL + реальная SMTP-доставка. Поддерживаются регистрация с подтверждением почты, вход/выход, восстановление пароля, пользовательский экран аккаунта, пять языков и light/dark/system. **Социального входа нет.** Подключение CRM, AI и фиктивного dashboard в этот PR не входит.

### Запуск

Нужны Node.js 22+, pnpm 10+, Docker и SMTP с реальными реквизитами.

1. `cp .env.example .env` — заполнить все значения. `BETTER_AUTH_SECRET` сгенерировать криптографически случайным: `openssl rand -base64 48`. **Не использовать пример секрета в реальном окружении.**
2. `docker compose up -d postgres`
3. `pnpm install`
4. `pnpm db:migrate` — применить схему Better Auth в PostgreSQL. Это отдельная явная операция; приложение не создаёт таблицы при каждом старте.
5. `pnpm dev` — UI: http://localhost:3000/sign-in, API: http://localhost:4000/api/auth, health: http://localhost:4000/v1/health.

Порт PostgreSQL 5433 на localhost выбран, чтобы не конфликтовать с другими проектами, использующими 5432. Для production БД, URL и SMTP задаются в secret manager, нужна защита HTTPS и регулярные backup/restore.

### Структура и проверка

- `apps/api`: NestJS/Express, Better Auth (только email/password), PostgreSQL и SMTP.
- `apps/web`: интерфейс Vimla, оригинальный `VimlaMark`, next-intl (ru/en/zh-CN/ja/sv-SE), next-themes.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`. Не считать успешными, пока реально не выполнены.
- В CI письма отправляются в **изолированный Mailpit**, который используется только для автоматизированных тестов, а не в пользовательском runtime.

**Ручная приёмка обязательна:** до ревью дизайн и flow не считаются окончательно одобренными, нельзя сливать Draft PR в main. Действия и состояния пользовательского интерфейса опираются на настоящий API, нет фальшивых сессий или аккаунтов.

### Границы этого этапа

После входа открывается **реальный** минимальный экран текущей учётной записи с фактическими данными сессии и рабочим выходом. Полный профиль, Personal/Company Workspace и Shell реализуются отдельными связанными задачами [#18](https://github.com/Designersss/ai-agents-work/issues/18), [#7](https://github.com/Designersss/ai-agents-work/issues/7) и [#5](https://github.com/Designersss/ai-agents-work/issues/5). Эти неготовые разделы **не нарисованы и не опубликованы как работающие функции**.

### Безопасность

Better Auth хранит хеши паролей и сессии в PostgreSQL; email должен быть подтверждён перед входом. Настроены trusted origins, HTTP-only cookies, HTTPS cookies в production, rate limiting и отзыв сессий при сбросе пароля. Нельзя раскрывать через reset, существует ли email. Не логируем пароли, токены, ссылки подтверждения. Для production нужны HTTPS, защищённые SMTP, секреты, мониторинг доставки, backup/restore, контроль env и полноценный security-review перед релизом.


### Local email testing (SMTP without using a real external mailbox)

For a local development environment you can use a **real SMTP server that captures
emails locally**, isolated from the public-facing product. This is not a mock user,
account, email verification or production delivery system. The authentication logic,
PostgreSQL, verification links and password reset endpoints are real.

1. Create local-only settings (do not overwrite a configured production SMTP):
   `cp .env.local.example .env`
2. Replace the `BETTER_AUTH_SECRET` placeholder with the output of `openssl rand -base64 48`.
3. Start PostgreSQL and the development SMTP inbox:
   `docker compose --profile local-mail up -d postgres mailpit`
4. Run `pnpm install && pnpm db:migrate && pnpm dev`.
5. In a second terminal run `pnpm doctor` to verify DB, API, email reachability, and local URLs.
6. Register through `http://localhost:3000/sign-up`.
7. Open `http://localhost:8025` to read your real verification email from the local SMTP inbox and follow the link.

**Mailpit never delivers a message to a real email address.** To validate actual
public mailbox delivery and to deploy the production product, use the real authenticated
SMTP provider/domain configured via `.env`/secret manager, and verify SPF/DKIM/DMARC.

### Troubleshooting a generic signup failure

The UI and email API are separate processes. A rendered sign-up page does **not**
prove the API is running. Verify in order:

- `curl -i http://localhost:4000/v1/health` — API process (200).
- `curl -i http://localhost:4000/v1/ready` — actual PostgreSQL + SMTP readiness (200).
- `docker compose ps` — Postgres and (for local-mail) Mailpit running.
- `pnpm doctor` — checks required configuration without printing secrets or email addresses.
- Inspect the terminal running `pnpm dev` for the **server's HTTP status/error category**, and
  browser DevTools → Network → `/api/auth/sign-up/email` for status (not request body).
- Ensure the browser uses **`http://localhost:3000`**, not an alternate hostname or port,
  unless you explicitly update `WEB_ORIGIN`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_API_URL`.
- For SMTP errors, `ECONNECTION` / `ESOCKET` / `ETIMEDOUT` generally indicate server/
  network problems; `EAUTH` indicates SMTP credentials. Do not share SMTP secrets or links.
- If the server previously saved the user but couldn't send the email, try **resending
  verification** from `/verify-email`; do not repeatedly create the same account.

CI uses isolated database + Mailpit. Its passing checks do not prove that a developer's
own SMTP, database, credentials, and local ports are correctly configured.
