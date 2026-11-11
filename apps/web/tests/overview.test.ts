import { describe, expect, it } from "vitest";
import { DEMO_WORKSPACES, formatCount, formatRubles, getDemoOverview } from "../lib/demo-data";

describe("Типизированные демонстрационные данные Overview", () => {
  it("содержат личный и корпоративный Workspace без повторяющихся id", () => {
    const ids = DEMO_WORKSPACES.map((space) => space.id);
    expect(ids).toContain("personal");
    expect(ids).toContain("company");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("период 7/30 дней изменяет статистику и график", () => {
    const week = getDemoOverview("company", 7);
    const month = getDemoOverview("company", 30);
    expect(week.messages).toBeLessThan(month.messages);
    expect(week.chart).toHaveLength(7);
    expect(month.chart).toHaveLength(15);
    expect(week.automationRate).not.toBe(month.automationRate);
  });

  it("показывает пустые данные и нулевой баланс личного пространства", () => {
    for (const period of [7, 30] as const) {
      const result = getDemoOverview("personal", period);
      expect(result.availableRubles).toBe(0);
      expect(result.messages).toBe(0);
      expect(result.activities).toHaveLength(0);
      expect(result.integrations).toHaveLength(0);
      expect(result.chart).toHaveLength(0);
    }
  });

  it("показывает разные финансовые контексты без смешивания пространств", () => {
    const company = getDemoOverview("company", 7);
    const personal = getDemoOverview("personal", 7);
    expect(company.availableRubles).toBeGreaterThan(0);
    expect(personal.availableRubles).toBe(0);
    expect(company.integrations.length).toBeGreaterThan(0);
    expect(personal.integrations).toHaveLength(0);
  });

  it("форматирует деньги в рублях и количества локально", () => {
    expect(formatRubles(0)).toContain("0");
    expect(formatRubles(3480.6)).toContain("₽");
    expect(formatCount(1284)).toMatch(/1\s?284|1\u00a0284|1\u202f284/);
  });
});
