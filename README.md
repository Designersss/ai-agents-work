# Vimla — платформа AI-агентов

Основная архитектура: [#2](https://github.com/Designersss/ai-agents-work/issues/2). Утверждённый дизайн Auth: [#17](https://github.com/Designersss/ai-agents-work/issues/17), реальная Auth: [#7](https://github.com/Designersss/ai-agents-work/issues/7), брендинг: [#19](https://github.com/Designersss/ai-agents-work/issues/19).

## Текущий PR: реальный email/password Auth

Next.js (App Router) UI + NestJS/Better Auth API + PostgreSQL + реальная SMTP-доставка. Поддерживаются регистрация с подтверждением почты, вход/выход, восстановление пароля, пользовательский экран аккаунта, пять языков и light/dark/system. **Социального входа нет.** Подключение CRM, AI и фиктивного dashboard в этот PR не входит.

### Запуск

Нужны Node.js 22+, pnpm 10+, Docker и SMTP с реальными реквизитами.

1. \`cp .env.example .env\` — заполнить все значения. \`BETTER_AUTH_SECRET\` сгенерировать криптографически случайным: \`openssl rand -base64 48\`. **Не использовать пример секрета в реальном окружении.**
2. \`docker compose up -d postgres\`
3. \`pnpm install\`
4. \`pnpm db:migrate\` — применить схему Better Auth в PostgreSQL. Это отдельная явная операция; приложение не создаёт таблицы при каждом старте.
5. \`pnpm dev\` — UI: http://localhost:3000/sign-in, API: http://localhost:4000/api/auth, health: http://localhost:4000/v1/health.

Порт PostgreSQL 5433 на localhost выбран, чтобы не конфликтовать с другими проектами, использующими 5432. Для production БД, URL и SMTP задаются в secret manager, нужна защита HTTPS и регулярные backup/restore.

### Структура и проверка

- \`apps/api\`: NestJS/Express, Better Auth (только email/password), PostgreSQL и SMTP.
- \`apps/web\`: интерфейс Vimla, оригинальный \`VimlaMark\`, next-intl (ru/en/zh-CN/ja/sv-SE), next-themes.
- \`pnpm lint\`, \`pnpm typecheck\`, \`pnpm test\`, \`pnpm build\`, \`pnpm e2e\`. Не считать успешными, пока реально не выполнены.
- В CI письма отправляются в **изолированный Mailpit**, который используется только для автоматизированных тестов, а не в пользовательском runtime.

**Ручная приёмка обязательна:** до ревью дизайн и flow не считаются окончательно одобренными, нельзя сливать Draft PR в main. Действия и состояния пользовательского интерфейса опираются на настоящий API, нет фальшивых сессий или аккаунтов.

### Границы этого этапа

После входа открывается **реальный** минимальный экран текущей учётной записи с фактическими данными сессии и рабочим выходом. Полный профиль, Personal/Company Workspace и Shell реализуются отдельными связанными задачами [#18](https://github.com/Designersss/ai-agents-work/issues/18), [#7](https://github.com/Designersss/ai-agents-work/issues/7) и [#5](https://github.com/Designersss/ai-agents-work/issues/5). Эти неготовые разделы **не нарисованы и не опубликованы как работающие функции**.

### Безопасность

Better Auth хранит хеши паролей и сессии в PostgreSQL; email должен быть подтверждён перед входом. Настроены trusted origins, HTTP-only cookies, HTTPS cookies в production, rate limiting и отзыв сессий при сбросе пароля. Нельзя раскрывать через reset, существует ли email. Не логируем пароли, токены, ссылки подтверждения. Для production нужны HTTPS, защищённые SMTP, секреты, мониторинг доставки, backup/restore, контроль env и полноценный security-review перед релизом.
