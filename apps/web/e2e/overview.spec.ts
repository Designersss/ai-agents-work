import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const screenshotDir = "playwright-artifacts";

test.beforeAll(() => {
  mkdirSync(screenshotDir, { recursive: true });
});

test("тёмный desktop Overview: 7/30 дней, личный и корпоративный контекст", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Обзор", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Основные разделы" })).toBeVisible();
  await expect(page.getByText("Все данные и статусы на этой странице демонстрационные")).toBeVisible();
  await expect(page.getByRole("button", { name: "7 дней" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Atlas Studio").first()).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/overview-desktop.png`, fullPage: true });

  await page.getByRole("button", { name: "30 дней" }).click();
  await expect(page.getByRole("button", { name: "30 дней" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("img", { name: /динамика обращений за 30 дней/i })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/overview-30days-desktop.png`, fullPage: true });

  await page.getByRole("button", { name: /Активное пространство: Atlas Studio/ }).click();
  await page.getByRole("menuitem", { name: /Личное пространство/ }).click();
  await expect(page.getByText("Пока нет обращений")).toBeVisible();
  await expect(page.getByText("Событий пока нет")).toBeVisible();
  await expect(page.getByText("Интеграций пока нет")).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/overview-personal-empty.png`, fullPage: true });
});

test("мобильный Overview: навигация открывается и закрывается с клавиатуры", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Обзор", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Открыть главное меню" })).toBeVisible();
  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
  await page.screenshot({ path: `${screenshotDir}/overview-mobile.png`, fullPage: true });

  await page.getByRole("button", { name: "Открыть главное меню" }).click();
  await expect(page.getByRole("dialog", { name: "Навигация по AIMock" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Основные разделы" })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/overview-mobile-menu.png`, fullPage: true });

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Навигация по AIMock" })).toHaveCount(0);
});

test("неготовые разделы не открывают фиктивные страницы", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Обзор" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Агенты" })).toHaveCount(0);
  await expect(page.getByLabel("Агенты — скоро")).toHaveAttribute("aria-disabled", "true");
});
