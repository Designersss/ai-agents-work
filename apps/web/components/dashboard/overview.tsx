"use client";

import {
  Activity as ActivityIcon,
  ArrowUpRight,
  Bot,
  Check,
  CircleHelp,
  CreditCard,
  Inbox,
  MessageCircle,
  Plug,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  formatCount,
  formatRubles,
  getDemoOverview,
  type ActivityKind,
  type OverviewData,
  type Period,
  type WorkspaceId,
} from "@/lib/demo-data";

const activityIcons: Record<ActivityKind, LucideIcon> = {
  message: MessageCircle,
  agent: Bot,
  integration: Plug,
  system: ShieldCheck,
};

function NumberCard({
  icon: Icon,
  title,
  value,
  description,
  prominent = false,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  prominent?: boolean;
}) {
  return (
    <Card className="min-h-[171px]">
      <CardContent className="flex h-full flex-col justify-between gap-6 pt-5 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-muted">{title}</span>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-elevated text-[#a8b1ba]">
            <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
          </span>
        </div>
        <div>
          <p className={prominent
            ? "text-[27px] leading-tight font-semibold tracking-[-0.035em] text-foreground"
            : "text-[26px] leading-tight font-semibold tracking-[-0.035em] text-foreground"
          }>
            {value}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Empty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 px-5 py-8 text-center">
      <span className="mb-1 grid size-11 place-items-center rounded-2xl bg-elevated text-muted">
        <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
      <p className="max-w-[270px] text-[12px] leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function OverviewChart({ data, period }: { data: OverviewData; period: Period }) {
  const max = Math.max(1, ...data.chart);
  return (
    <Card className="flex min-h-[360px] flex-col">
      <CardHeader className="flex items-start justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Обращения к агентам</h2>
          <p className="mt-1 text-[12px] text-muted">Динамика входящих сообщений</p>
        </div>
        <span className="self-start rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-[11px] text-muted">
          За {period} дней
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {data.chart.length === 0 ? (
          <Empty
            icon={Inbox}
            title="Пока нет обращений"
            description="Когда появятся диалоги с агентами, здесь будет отображаться динамика."
          />
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <span className="text-[33px] leading-none font-semibold tracking-[-0.04em]">{formatCount(data.messages)}</span>
                <span className="pb-0.5 text-[12px] text-muted">сообщений</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#375442] bg-[#1d3025] px-2.5 py-1 text-[11px] font-medium text-[#acd8b8]">
                <ActivityIcon size={12} aria-hidden="true" /> Демо-активность
              </span>
            </div>
            <div
              role="img"
              aria-label={`Демонстрационная динамика обращений за ${period} дней: ${formatCount(data.messages)} сообщений`}
              className="mt-7 flex h-[142px] flex-1 items-end gap-2 border-b border-[#31363c] pb-0 sm:gap-3"
            >
              {data.chart.map((value, index) => (
                <div
                  key={index}
                  className="group relative flex h-full min-w-0 flex-1 items-end"
                  title={`Точка ${index + 1}: ${value} условных обращений`}
                >
                  <div
                    className={
                      "w-full rounded-t-[5px] bg-[#405e4b] transition-colors group-hover:bg-[#7db491] " +
                      (index === data.chart.length - 1 ? "!bg-[#9acbaa]" : "")
                    }
                    style={{ height: `${Math.max(6, (value / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-muted">
              <span>{period === 7 ? "Начало недели" : "30 дней назад"}</span>
              <span>{period === 7 ? "Последние 7 дней" : "Сегодня"}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivity({ data }: { data: OverviewData }) {
  return (
    <Card className="flex min-h-[360px] flex-col">
      <CardHeader>
        <h2 className="text-[15px] font-semibold tracking-tight">Последние события</h2>
        <p className="mt-1 text-[12px] text-muted">Что происходило в пространстве</p>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        {data.activities.length === 0 ? (
          <Empty
            icon={ActivityIcon}
            title="Событий пока нет"
            description="Действия агентов и подключения появятся здесь после настройки платформы."
          />
        ) : (
          <ol className="space-y-0" aria-label="Демонстрационные события">
            {data.activities.map((event, index) => {
              const Icon = activityIcons[event.kind];
              return (
                <li key={event.id} className="flex gap-3.5">
                  <span className="flex shrink-0 flex-col items-center">
                    <span className="grid size-9 place-items-center rounded-xl border border-border bg-elevated text-[#b3bac1]">
                      <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
                    </span>
                    {index !== data.activities.length - 1 ? (
                      <span aria-hidden="true" className="my-1 h-6 w-px bg-border" />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1 pb-5">
                    <p className="text-[12px] leading-5 font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-muted">{event.description}</p>
                    <p className="mt-1 text-[10px] text-[#79838d]">{event.date}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function Integrations({ data }: { data: OverviewData }) {
  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Интеграции</h2>
          <p className="mt-1 text-[12px] text-muted">Подключённые каналы и сервисы</p>
        </div>
        <span className="text-[12px] text-muted">{data.connectedIntegrations} активно</span>
      </CardHeader>
      <CardContent className="pt-4">
        {data.integrations.length === 0 ? (
          <Empty
            icon={Plug}
            title="Интеграций пока нет"
            description="Когда подключите сервисы, здесь появится их состояние."
          />
        ) : (
          <ul className="space-y-2">
            {data.integrations.map((integration) => (
              <li key={integration.id} className="flex items-center gap-3 rounded-xl border border-border/80 bg-elevated/60 px-3.5 py-3">
                <span className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-[#c9ced4]">
                  {integration.id === "telegram" ? (
                    <MessageCircle size={18} aria-hidden="true" />
                  ) : (
                    <Plug size={18} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium">{integration.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{integration.description}</p>
                </div>
                <span className="flex items-center gap-1.5 text-[11px] text-[#a5d7b3]">
                  <Check size={13} aria-hidden="true" /> Подключено
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ContextNote() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg border border-border bg-elevated text-muted">
            <CircleHelp size={17} aria-hidden="true" />
          </span>
          <h2 className="text-[15px] font-semibold tracking-tight">Как устроен обзор</h2>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[12px] leading-[1.8] text-muted">
          Здесь будут отображаться реальные показатели работы агентов, состояние
          подписки, кошелёк и подключения. Сейчас показан дизайн на демонстрационных
          данных — реальные сервисы подключим в следующих этапах.
        </p>
        <div className="mt-5 flex items-center gap-2 text-[11px] text-[#a7b1b9]">
          <ArrowUpRight size={14} aria-hidden="true" />
          <span>Архитектура и этапы — в GitHub issue #2</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function Overview({
  workspaceId,
  period,
  onChangePeriod,
}: {
  workspaceId: WorkspaceId;
  period: Period;
  onChangePeriod: (period: Period) => void;
}) {
  const data = getDemoOverview(workspaceId, period);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 pb-14 pt-7 sm:px-7 sm:pt-9 xl:px-10">
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2.5 text-[11px] font-medium tracking-[0.12em] text-[#a7b5ad] uppercase">
            Рабочее пространство
          </p>
          <h1 className="text-[27px] font-semibold tracking-[-0.045em] sm:text-[32px]">Обзор</h1>
          <p className="mt-2 text-[13px] text-muted">
            Главное о работе агентов в пространстве «{data.workspaceName}».
          </p>
        </div>
        <div role="group" aria-label="Период статистики" className="flex w-fit shrink-0 gap-1 rounded-xl border border-border bg-surface p-1">
          {([7, 30] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant={period === option ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={period === option}
              className={period === option ? "text-foreground shadow-sm" : "text-muted"}
              onClick={() => onChangePeriod(option)}
            >
              {option} дней
            </Button>
          ))}
        </div>
      </div>

      <section aria-label="Основные показатели" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <NumberCard
          icon={Wallet}
          title="Кошелёк"
          value={formatRubles(data.availableRubles)}
          description="Демонстрационный баланс"
          prominent
        />
        <NumberCard
          icon={CreditCard}
          title="Подписка"
          value={data.tariffName}
          description={data.tariffDescription}
        />
        <NumberCard
          icon={Bot}
          title="Агенты"
          value={`${data.activeAgents} из ${data.totalAgents}`}
          description="Активных агентов в пространстве"
        />
        <NumberCard
          icon={Plug}
          title="Подключения"
          value={String(data.connectedIntegrations)}
          description="Интеграций в рабочем состоянии"
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]" aria-label="Статистика и события">
        <OverviewChart data={data} period={period} />
        <RecentActivity data={data} />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]" aria-label="Состояние платформы">
        <Integrations data={data} />
        <ContextNote />
      </section>

      <div className="mt-7 flex flex-col justify-between gap-2 border-t border-border/70 pt-5 text-[11px] text-muted sm:flex-row">
        <span>Обзор AIMock · первый этап интерфейса</span>
        <span>Все данные и статусы на этой странице демонстрационные</span>
      </div>
    </div>
  );
}
