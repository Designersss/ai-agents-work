import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIMock — Обзор",
  description: "Платформа AI-агентов. Первый этап интерфейса — тёмная тема.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
