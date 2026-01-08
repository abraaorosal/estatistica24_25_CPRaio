import type { Metadata } from "next";
import "./globals.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const withBasePath = (path: string) => `${BASE_PATH}${path}`;

export const metadata: Metadata = {
  title: "Painel Estatístico CPRAIO 2025 – Comparativo 2024–2025",
  description:
    "Indicadores consolidados | Comparação anual | CPRAIO / PMCE",
  icons: {
    icon: [
      { url: withBasePath("/favicon.ico"), sizes: "any" },
      {
        url: withBasePath("/favicon-32x32.png"),
        type: "image/png",
        sizes: "32x32"
      },
      {
        url: withBasePath("/favicon-16x16.png"),
        type: "image/png",
        sizes: "16x16"
      }
    ],
    apple: [
      { url: withBasePath("/apple-touch-icon.png"), sizes: "180x180" }
    ]
  }
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
