"use client";

import { useState, type ComponentType } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BookOpen,
  Bot,
  Building2,
  Check,
  ChevronDown,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plug,
  UserRound,
  Users,
  Wallet,
  Workflow,
  X,
  type LucideProps,
} from "lucide-react";
import { Overview } from "@/components/dashboard/overview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEMO_WORKSPACES, type Period, type WorkspaceId } from "@/lib/demo-data";

type NavItem = {
  name: string;
  icon: ComponentType<LucideProps>;
  href?: string;
  ready: boolean;
};

const navigation: readonly NavItem[] = [
  { name: "Обзор", icon: LayoutDashboard, href: "/", ready: true },
  { name: "Сообщения", icon: MessageSquare, ready: false },
  { name: "Агенты", icon: Bot, ready: false },
  { name: "Знания", icon: BookOpen, ready: false },
  { name: "Интеграции", icon: Plug, ready: false },
  { name: "Контакты", icon: Users, ready: false },
  { name: "Автоматизации", icon: Workflow, ready: false },
  { name: "Финансы", icon: Wallet, ready: false },
];

function Brand() {
  return (
    <div className="flex h-[76px] items-center gap-3 px-5">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-[#45614d] bg-[#20372a] text-[#b2dbc0]">
        <Bot size={19} aria-hidden="true" strokeWidth={1.9} />
        <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-[#101215] bg-[#a4d3b5]" />
      </span>
      <span className="text-[19px] font-semibold tracking-[-0.065em]">
        AIMock<span className="text-[#a3ceaf]">.</span>
      </span>
      <span className="ml-auto rounded-md border border-[#31363d] px-1.5 py-1 text-[9px] font-semibold tracking-[0.08em] text-[#929ca4] uppercase">
        beta
      </span>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Brand />
      <div className="mx-5 h-px bg-border/75" aria-hidden="true" />
      <div className="flex-1 overflow-y-auto px-3 pt-6">
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.14em] text-[#78838b] uppercase">
          Платформа
        </p>
        <nav aria-label="Основные разделы" className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const classes = cn(
              "group flex min-h-10 items-center gap-3 rounded-xl px-3 text-[13px] transition-colors",
              item.ready
                ? "border border-[#304737] bg-[#203127] font-medium text-[#d6efdb]"
                : "text-[#858d96]",
            );

            if (item.ready && item.href) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current="page"
                  onClick={onNavigate}
                  className={classes}
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-[#a7d6b6]" />
                </a>
              );
            }

            return (
              <span
                key={item.name}
                aria-disabled="true"
                aria-label={`${item.name} — скоро`}
                className={cn(classes, "select-none opacity-75")}
                title="Раздел появится на следующих этапах разработки"
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span className="min-w-0 flex-1">{item.name}</span>
                <span className="rounded-md border border-[#2b3035] px-1.5 py-0.5 text-[9px] text-[#747d85]">
                  скоро
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      <div className="mx-5 mb-4 rounded-xl border border-[#29312c] bg-[#18221b] p-3.5">
        <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[#c9dfce]">
          <FlaskConical size={15} aria-hidden="true" /> Интерфейс в разработке
        </div>
        <p className="mt-2 text-[11px] leading-[1.6] text-[#94a398]">
          Показаны только демонстрационные данные. Реальные сервисы пока не подключены.
        </p>
      </div>

      <div className="border-t border-border/80 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1">
          <span className="grid size-9 place-items-center rounded-full border border-[#3a4147] bg-elevated text-[#ccd2d5]">
            <UserRound size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-foreground">Демо-профиль</p>
            <p className="mt-0.5 text-[10px] text-muted">Без авторизации</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceSwitcher({
  currentId,
  onSelect,
}: {
  currentId: WorkspaceId;
  onSelect: (id: WorkspaceId) => void;
}) {
  const selected = DEMO_WORKSPACES.find((space) => space.id === currentId) ?? DEMO_WORKSPACES[0];
  const Icon = currentId === "company" ? Building2 : UserRound;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Активное пространство: ${selected.name}. Выбрать другое`}
          className="flex max-w-[205px] items-center gap-2.5 rounded-xl border border-border bg-elevated px-2.5 py-2 text-left transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-accent/60 sm:max-w-[265px] sm:px-3"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#2c3430] text-[#b8d2c0]">
            <Icon size={14} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold leading-[1.4] text-foreground sm:text-[12px]">
              {selected.name}
            </span>
            <span className="hidden text-[10px] text-muted sm:block">{selected.type} · демо</span>
          </span>
          <ChevronDown size={14} className="shrink-0 text-muted" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={9}
          className="z-[100] w-[270px] rounded-xl border border-border bg-elevated p-1.5 shadow-[0_20px_60px_#0009] focus:outline-none"
        >
          <DropdownMenu.Label className="px-3 pb-2 pt-2 text-[11px] font-medium text-muted">
            Демо-пространства
          </DropdownMenu.Label>
          {DEMO_WORKSPACES.map((workspace) => {
            const ItemIcon = workspace.id === "company" ? Building2 : UserRound;
            return (
              <DropdownMenu.Item
                key={workspace.id}
                onSelect={() => onSelect(workspace.id)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none data-[highlighted]:bg-hover"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-[#30383a] text-[#d0ded5]">
                  <ItemIcon size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium">{workspace.name}</span>
                  <span className="text-[10px] text-muted">{workspace.type}</span>
                </span>
                {currentId === workspace.id && <Check size={15} className="text-accent" aria-label="Выбрано" />}
              </DropdownMenu.Item>
            );
          })}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="px-3 py-2 text-[10px] leading-[1.5] text-muted">
            Переключение влияет только на тестовые данные интерфейса.
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function AppShell() {
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId>("company");
  const [period, setPeriod] = useState<Period>(7);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-[255px] shrink-0 border-r border-border bg-[#101216] md:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border bg-[#101216]/95 px-4 backdrop-blur-xl sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <Dialog.Trigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-ml-1 md:hidden"
                  aria-label="Открыть главное меню"
                >
                  <Menu size={21} aria-hidden="true" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/75 backdrop-blur-[3px] md:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(86vw,300px)] border-r border-border bg-[#101216] shadow-2xl focus:outline-none md:hidden">
                  <Dialog.Title className="sr-only">Навигация по AIMock</Dialog.Title>
                  <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
                  <Dialog.Close
                    aria-label="Закрыть меню"
                    className="absolute right-4 top-6 grid size-8 place-items-center rounded-lg text-muted hover:bg-hover hover:text-foreground"
                  >
                    <X size={18} aria-hidden="true" />
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <div className="flex min-w-0 items-center gap-2 text-[12px] sm:gap-2.5 sm:text-[13px]">
              <span className="hidden text-muted sm:inline">Рабочее пространство</span>
              <span className="hidden text-[#545b62] sm:inline">/</span>
              <span className="truncate font-semibold text-[#dce2df]">Обзор</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
            <span className="hidden items-center gap-1.5 rounded-lg border border-[#304438] bg-[#1b2920] px-2.5 py-1.5 text-[10px] font-medium text-[#a7cdb3] lg:inline-flex">
              <FlaskConical size={13} aria-hidden="true" /> Демо-режим
            </span>
            <WorkspaceSwitcher currentId={workspaceId} onSelect={setWorkspaceId} />
          </div>
        </header>

        <main id="main-content" className="min-w-0 flex-1">
          <Overview workspaceId={workspaceId} period={period} onChangePeriod={setPeriod} />
        </main>
      </div>
    </div>
  );
}
