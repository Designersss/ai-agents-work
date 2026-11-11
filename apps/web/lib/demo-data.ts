/**
 * Локальные fixtures первого UI-этапа. НИКАКОЙ связи с реальными кошельками,
 * агентами, диалогами, подписками и API. Не использовать в production API.
 */
export const DEMO_WORKSPACES = [
  { id: "company", name: "Atlas Studio", shortName: "AS", type: "Компания" },
  { id: "personal", name: "Личное пространство", shortName: "Л", type: "Личное" },
] as const;

export type WorkspaceId = (typeof DEMO_WORKSPACES)[number]["id"];
export type Period = 7 | 30;
export type ActivityKind = "message" | "agent" | "integration" | "system";

export type Activity = Readonly<{
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  date: string;
}>;

export type Integration = Readonly<{
  id: string;
  name: string;
  description: string;
  status: "connected" | "attention";
}>;

export type OverviewData = Readonly<{
  workspaceName: string;
  availableRubles: number;
  tariffName: string;
  tariffDescription: string;
  activeAgents: number;
  totalAgents: number;
  connectedIntegrations: number;
  messages: number;
  automationRate: number;
  chart: readonly number[];
  integrations: readonly Integration[];
  activities: readonly Activity[];
}>;

const companyIntegrations: readonly Integration[] = [
  { id: "telegram", name: "Telegram", description: "Канал для обращений", status: "connected" },
  { id: "amocrm", name: "amoCRM", description: "Передача заявок", status: "connected" },
];

const recentActivity: readonly Activity[] = [
  {
    id: "event-01",
    kind: "message",
    title: "Диалог обработан агентом",
    description: "Консультант · Telegram",
    date: "11 ноя · 18:42",
  },
  {
    id: "event-02",
    kind: "agent",
    title: "Настройки агента обновлены",
    description: "Заявки · инструкция",
    date: "11 ноя · 16:15",
  },
  {
    id: "event-03",
    kind: "integration",
    title: "Интеграция подключена",
    description: "amoCRM · Atlas Studio",
    date: "10 ноя · 14:20",
  },
  {
    id: "event-04",
    kind: "system",
    title: "Автоматизация приостановлена",
    description: "Проверка рабочего времени",
    date: "9 ноя · 11:08",
  },
];

const companyCharts: Record<Period, readonly number[]> = {
  7: [42, 58, 49, 70, 64, 83, 74],
  30: [28, 37, 32, 46, 40, 49, 44, 54, 59, 52, 67, 62, 73, 68, 81],
};

export function getDemoOverview(workspaceId: WorkspaceId, period: Period): OverviewData {
  if (workspaceId === "personal") {
    return {
      workspaceName: "Личное пространство",
      availableRubles: 0,
      tariffName: "Нет подписки",
      tariffDescription: "Подписка ещё не оформлена",
      activeAgents: 0,
      totalAgents: 0,
      connectedIntegrations: 0,
      messages: 0,
      automationRate: 0,
      chart: [],
      integrations: [],
      activities: [],
    };
  }

  return {
    workspaceName: "Atlas Studio",
    availableRubles: 3480.6,
    tariffName: "Команда",
    tariffDescription: "До 10 агентов · пробные данные",
    activeAgents: 3,
    totalAgents: 4,
    connectedIntegrations: companyIntegrations.length,
    messages: period === 7 ? 1284 : 4832,
    automationRate: period === 7 ? 89 : 86,
    chart: companyCharts[period],
    integrations: companyIntegrations,
    activities: period === 7 ? recentActivity.slice(0, 3) : recentActivity,
  };
}

export function formatRubles(rubles: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rubles);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}
