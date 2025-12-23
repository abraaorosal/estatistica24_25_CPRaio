import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Estatístico CPRAIO 2025 – Comparativo 2024–2025",
  description:
    "Indicadores consolidados | Comparação anual | CPRAIO / PMCE"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
