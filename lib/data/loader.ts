import Papa from "papaparse";

export type TotalsRow = {
  Indicador: string;
  Ano: number;
  Valor: number;
};

export type RankingRow = {
  Ano: number;
  Unidade: string;
  Ocorrencias?: number;
  Armas?: number;
  Trafico?: number;
  Mandados?: number;
  Veiculos?: number;
  Percentual?: number;
};

export const INDICATOR_LABELS = [
  "Total de Ocorrências",
  "Armas Apreendidas",
  "Mandados Cumpridos",
  "Drogas Apreendidas",
  "Veículos Apreendidos",
  "Prisões Realizadas"
];

export const INDICATOR_TOOLTIPS: Record<string, string> = {
  "Total de Ocorrências":
    "Quantidade total de registros operacionais consolidados.",
  "Armas Apreendidas": "Armas retiradas de circulação no período.",
  "Mandados Cumpridos":
    "Mandados judiciais executados pelas equipes.",
  "Drogas Apreendidas": "Ocorrências com apreensão de entorpecentes.",
  "Veículos Apreendidos": "Veículos recolhidos em ações operacionais.",
  "Prisões Realizadas": "Conduções ou prisões efetivadas no período."
};

const indicatorAliases: Record<string, string> = {
  "prisões realizadas (conduções a delegacia)": "Prisões Realizadas",
  "prisões realizadas": "Prisões Realizadas",
  "total de ocorrencias": "Total de Ocorrências",
  "total de ocorrências": "Total de Ocorrências",
  "armas apreendidas": "Armas Apreendidas",
  "mandados cumpridos": "Mandados Cumpridos",
  "drogas apreendidas": "Drogas Apreendidas",
  "veículos apreendidos": "Veículos Apreendidos",
  "veiculos apreendidos": "Veículos Apreendidos"
};

export const FALLBACK_TOTALS: Record<string, { 2024: number; 2025: number }> = {
  "Total de Ocorrências": { 2024: 8025, 2025: 9122 },
  "Armas Apreendidas": { 2024: 2454, 2025: 2914 },
  "Mandados Cumpridos": { 2024: 851, 2025: 1042 },
  "Drogas Apreendidas": { 2024: 1480, 2025: 1859 },
  "Veículos Apreendidos": { 2024: 2645, 2025: 2699 },
  "Prisões Realizadas": { 2024: 6824, 2025: 7578 }
};

export type DataWarnings = {
  totalsFallback: boolean;
  missingColumns: string[];
  notes: string[];
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export async function fetchCsv(path: string) {
  const response = await fetch(`${BASE_PATH}${path}`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }
  return response.text();
}

function parseNumber(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return NaN;
  if (typeof value === "number") return value;
  const cleaned = value
    .toString()
    .replace("%", "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? NaN : parsed;
}

function normalizeIndicator(name: string) {
  const key = name.trim().toLowerCase();
  return indicatorAliases[key] || name.trim();
}

export async function loadTotals() {
  const warnings: DataWarnings = {
    totalsFallback: false,
    missingColumns: [],
    notes: []
  };
  let rows: TotalsRow[] = [];
  try {
    const csv = await fetchCsv("/data/totals.csv");
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    const data = parsed.data as Record<string, string>[];
    const indicatorKey = data[0] && ("Indicador" in data[0] ? "Indicador" : "Indicador");
    const yearKey = data[0] && ("Ano" in data[0] ? "Ano" : "Ano");
    const valueKey = data[0] && ("Valor" in data[0] ? "Valor" : "Quantidade" in data[0] ? "Quantidade" : "Valor");

    if (!data[0] || !indicatorKey || !yearKey || !valueKey) {
      warnings.missingColumns.push("totals.csv");
    } else {
      rows = data.map((row) => ({
        Indicador: normalizeIndicator(row[indicatorKey] || ""),
        Ano: parseNumber(row[yearKey]) || 0,
        Valor: parseNumber(row[valueKey]) || 0
      }));
    }
  } catch (error) {
    warnings.notes.push("Falha ao carregar totals.csv, usando fallback.");
  }

  if (rows.length === 0) {
    warnings.totalsFallback = true;
    rows = INDICATOR_LABELS.flatMap((indicator) => [
      {
        Indicador: indicator,
        Ano: 2024,
        Valor: FALLBACK_TOTALS[indicator][2024]
      },
      {
        Indicador: indicator,
        Ano: 2025,
        Valor: FALLBACK_TOTALS[indicator][2025]
      }
    ]);
  }

  return { rows, warnings };
}

async function loadRanking(path: string) {
  try {
    const csv = await fetchCsv(path);
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
    const data = parsed.data as Record<string, string>[];
    return data.map((row) => ({
      Ano: parseNumber(row.Ano) || 0,
      Unidade: row.Unidade || "",
      Ocorrencias: parseNumber(row.Ocorrencias),
      Armas: parseNumber(row.Armas),
      Trafico: parseNumber(row.Trafico),
      Mandados: parseNumber(row.Mandados),
      Veiculos: parseNumber(row.Veiculos),
      Percentual: parseNumber(row.Percentual)
    }));
  } catch (error) {
    return [] as RankingRow[];
  }
}

export async function loadAllRankings() {
  const [geral, armas, mandados, trafico, veiculos] = await Promise.all([
    loadRanking("/data/ranking_geral.csv"),
    loadRanking("/data/ranking_arms.csv"),
    loadRanking("/data/ranking_mandados.csv"),
    loadRanking("/data/ranking_trafico.csv"),
    loadRanking("/data/ranking_veiculos.csv")
  ]);
  return { geral, armas, mandados, trafico, veiculos };
}

export function buildTotalsMap(rows: TotalsRow[]) {
  return rows.reduce((acc, row) => {
    if (!acc[row.Indicador]) {
      acc[row.Indicador] = { 2024: 0, 2025: 0 };
    }
    if (row.Ano === 2024 || row.Ano === 2025) {
      acc[row.Indicador][row.Ano] = row.Valor;
    }
    return acc;
  }, {} as Record<string, { 2024: number; 2025: number }>);
}

export function getRankingTop(
  rows: RankingRow[],
  metric: keyof RankingRow,
  year: number,
  limit = 3
) {
  return rows
    .filter((row) => row.Ano === year)
    .filter((row) => Number.isFinite(row[metric] as number))
    .sort((a, b) => (b[metric] as number) - (a[metric] as number))
    .slice(0, limit)
    .map((row, index) => ({ ...row, Pos: index + 1 }));
}

export function getMetricLabel(metric: string) {
  const map: Record<string, string> = {
    Ocorrencias: "Ocorrências",
    Armas: "Armas",
    Trafico: "Tráfico",
    Mandados: "Mandados",
    Veiculos: "Veículos"
  };
  return map[metric] || metric;
}
