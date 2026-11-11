# AIMock

**AIMock** — коммерческая SaaS-платформа AI-агентов. Репозиторий развивается по этапам с явной проверкой каждого модуля.

> [**Главный архитектурный issue #2**](https://github.com/Designersss/ai-agents-work/issues/2) — источник истины по стеку, правилам разработки, зависимостям и этапам.

## Текущий этап: тёмный UI v1

Сейчас здесь находится **первый этап интерфейса**, а не готовый backend: левое меню, шапка, выбор демонстрационного пространства и страница «Обзор». Все цифры, тарифы и события **демонстрационные**; приложение **не** инициирует платежи, изменения в CRM или запросы к AI.

Текущий UI: задачи [#4](https://github.com/Designersss/ai-agents-work/issues/4), [#5](https://github.com/Designersss/ai-agents-work/issues/5), [#6](https://github.com/Designersss/ai-agents-work/issues/6). Базовые принципы: [#3](https://github.com/Designersss/ai-agents-work/issues/3).

### Установка

Требуются Node.js 22+ и pnpm 10+.

```bash
pnpm install
pnpm dev
```

Открой [http://localhost:3000](http://localhost:3000).

### Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Структура

- `apps/web` — Next.js App Router, Tailwind 4, бесплатные shadcn-совместимые UI-примитивы (Radix/CVA), Lucide.
- `apps/web/components/dashboard` — каркас платформы и страница обзора.
- `apps/web/lib/demo-data.ts` — демонстрационные данные, явно отделённые от будущего API.
- `docs/adr/` — архитектурные решения.
- `.github/workflows/` — проверки PR.

### Что с ранее проверенным ProxyAPI?

Изолированный эксперимент с Better Auth/PostgreSQL/ProxyAPI сохранён в [draft PR #1](https://github.com/Designersss/ai-agents-work/pull/1). Он **не переносится в production автоматически**: реальный AI runtime, финансы и Workspace будут подключаться после архитектурного ревью, в соответствующих дочерних issue.

**Все PR создаются как Draft; merge только после ручного подтверждения владельца.**
