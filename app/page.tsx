"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import { toPng } from "html-to-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import {
  buildTotalsMap,
  getMetricLabel,
  getRankingTop,
  INDICATOR_LABELS,
  INDICATOR_TOOLTIPS,
  loadAllRankings,
  loadTotals,
  type RankingRow
} from "@/lib/data/loader";

const THEME_PRIMARY = "#F2C200";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const METRIC_OPTIONS = [
  { value: "Ocorrencias", label: "Ocorrências" },
  { value: "Armas", label: "Armas" },
  { value: "Trafico", label: "Tráfico" },
  { value: "Mandados", label: "Mandados" }
];

const COMPARATOR_VIEWS = [
  { value: "absolute", label: "Absoluto" },
  { value: "percent", label: "Percentual" }
];

const RANKING_TABS = [
  { key: "geral", label: "Geral" },
  { key: "armas", label: "Armas" },
  { key: "mandados", label: "Mandados" },
  { key: "trafico", label: "Tráfico" },
  { key: "veiculos", label: "Veículos" }
] as const;

const yearOptions = [
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "comparar", label: "Comparar" }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function getDelta(a: number, b: number) {
  const diff = b - a;
  const percent = a === 0 ? 0 : (diff / a) * 100;
  return { diff, percent };
}

function downloadBlob(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers
      .map((header) => `${row[header]}`.replace(/\n/g, " "))
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 p-6 text-sm text-slate">
      {message}
    </div>
  );
}

function KPIBadge({ diff, percent }: { diff: number; percent: number }) {
  if (Math.abs(percent) < 0.01) {
    return <Badge tone="neutral">Estável</Badge>;
  }
  if (percent > 0) return <Badge tone="positive">Melhora</Badge>;
  return <Badge tone="negative">Queda</Badge>;
}

function KPIArrow({ percent }: { percent: number }) {
  if (Math.abs(percent) < 0.01) return "→";
  return percent > 0 ? "↑" : "↓";
}

function useChartExport(ref: React.RefObject<HTMLDivElement>) {
  return async () => {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, { backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = "grafico.png";
    link.href = dataUrl;
    link.click();
  };
}

function buildInsights(data: Array<{ name: string; percent: number }>) {
  const sorted = [...data].sort((a, b) => b.percent - a.percent);
  const top3 = sorted.slice(0, 3);
  const least = sorted.reduce((acc, item) =>
    Math.abs(item.percent) < Math.abs(acc.percent) ? item : acc
  );
  return { top3, least };
}

export default function Home() {
  const [tab, setTab] = useState("visao");
  const [rankingTab, setRankingTab] = useState("geral");
  const [rankingYear, setRankingYear] = useState("comparar");
  const [rankingMetric, setRankingMetric] = useState("Ocorrencias");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState(
    {} as Record<string, { 2024: number; 2025: number }>
  );
  const [rankings, setRankings] = useState<
    Record<string, RankingRow[]>
  >({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [comparatorIndicator, setComparatorIndicator] = useState(
    INDICATOR_LABELS[0]
  );
  const [comparatorBase, setComparatorBase] = useState("2024");
  const [comparatorCompare, setComparatorCompare] = useState("2025");
  const [comparatorView, setComparatorView] = useState("absolute");
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);

  const mainChartRef = useRef<HTMLDivElement>(null);
  const rankingChartRef = useRef<HTMLDivElement>(null);
  const comparatorChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-primary", THEME_PRIMARY);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const totalsResponse = await loadTotals();
        const rankingResponse = await loadAllRankings();
        setTotals(buildTotalsMap(totalsResponse.rows));
        setRankings(rankingResponse as Record<string, RankingRow[]>);
        const newWarnings = [] as string[];
        if (totalsResponse.warnings.totalsFallback) {
          newWarnings.push(
            "Totals.csv não disponível; valores exibidos com base no baseline interno."
          );
        }
        totalsResponse.warnings.notes.forEach((note) => newWarnings.push(note));
        setWarnings(newWarnings);
      } catch (error) {
        setWarnings(["Falha ao carregar dados. Verifique a pasta /public/data."]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpiData = useMemo(() => {
    return INDICATOR_LABELS.map((indicator) => {
      const data = totals[indicator] || { 2024: 0, 2025: 0 };
      const { diff, percent } = getDelta(data[2024], data[2025]);
      return {
        indicator,
        value2024: data[2024],
        value2025: data[2025],
        diff,
        percent
      };
    });
  }, [totals]);

  const barChartData = useMemo(() => {
    return kpiData.map((item) => ({
      name: item.indicator,
      "2024": item.value2024,
      "2025": item.value2025
    }));
  }, [kpiData]);

  const growthChartData = useMemo(() => {
    return kpiData.map((item) => ({
      name: item.indicator,
      crescimento: item.percent
    }));
  }, [kpiData]);

  const insights = useMemo(
    () =>
      buildInsights(
        growthChartData.map((item) => ({
          name: item.name,
          percent: item.crescimento
        }))
      ),
    [growthChartData]
  );

  const rankingRows = rankings[rankingTab] || [];

  const metricKey = rankingTab === "geral" ? (rankingMetric as keyof RankingRow) :
    rankingTab === "armas" ? "Armas" :
    rankingTab === "mandados" ? "Mandados" :
    rankingTab === "trafico" ? "Trafico" :
    "Veiculos";

  const ranking2024 = useMemo(() => getRankingTop(rankingRows, metricKey, 2024), [
    rankingRows,
    metricKey
  ]);
  const ranking2025 = useMemo(() => getRankingTop(rankingRows, metricKey, 2025), [
    rankingRows,
    metricKey
  ]);

  const rankingChartData = useMemo(() => {
    const combined = new Map<
      string,
      { unidade: string; "2024": number; "2025": number }
    >();
    [...ranking2024, ...ranking2025].forEach((row) => {
      const existing = combined.get(row.Unidade) || {
        unidade: row.Unidade,
        2024: 0,
        2025: 0
      };
      if (row.Ano === 2024) existing[2024] = (row[metricKey] as number) || 0;
      if (row.Ano === 2025) existing[2025] = (row[metricKey] as number) || 0;
      combined.set(row.Unidade, existing);
    });
    const data = Array.from(combined.values());
    if (rankingYear === "2024") {
      return data.map((row) => ({ ...row, 2025: 0 }));
    }
    if (rankingYear === "2025") {
      return data.map((row) => ({ ...row, 2024: 0 }));
    }
    return data;
  }, [ranking2024, ranking2025, rankingYear, metricKey]);

  const comparatorData = useMemo(() => {
    const baseYear = Number(comparatorBase) as 2024 | 2025;
    const compareYear = Number(comparatorCompare) as 2024 | 2025;
    const indicator = totals[comparatorIndicator] || { 2024: 0, 2025: 0 };
    const baseValue = indicator[baseYear];
    const compareValue = indicator[compareYear];
    const diff = compareValue - baseValue;
    const percent = baseValue === 0 ? 0 : (diff / baseValue) * 100;
    return {
      baseYear,
      compareYear,
      baseValue,
      compareValue,
      diff,
      percent
    };
  }, [comparatorBase, comparatorCompare, comparatorIndicator, totals]);

  const exportMainChart = useChartExport(mainChartRef);
  const exportRankingChart = useChartExport(rankingChartRef);
  const exportComparatorChart = useChartExport(comparatorChartRef);

  const handleExportProcessedCsv = () => {
    const rows = kpiData.map((item) => ({
      Indicador: item.indicator,
      Ano: 2024,
      Valor: item.value2024
    }));
    const rows2025 = kpiData.map((item) => ({
      Indicador: item.indicator,
      Ano: 2025,
      Valor: item.value2025
    }));
    const csv = toCsv([...rows, ...rows2025]);
    downloadBlob("cpraio-totais-processados.csv", csv);
  };

  const handleExportRankingCsv = () => {
    const rows = (rankingYear === "2024"
      ? ranking2024
      : rankingYear === "2025"
      ? ranking2025
      : [...ranking2024, ...ranking2025]
    ).map((row) => ({
      Ano: row.Ano,
      Unidade: row.Unidade,
      Valor: row[metricKey] || 0
    }));
    const csv = toCsv(rows);
    downloadBlob("cpraio-ranking-filtrado.csv", csv);
  };

  return (
    <main className="min-h-screen px-4 py-10 md:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-6 rounded-[32px] bg-white/80 p-6 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="w-full md:w-auto">
              <img
                src={`${BASE_PATH}/assets/logo-raio.png`}
                alt="Logo RAIO"
                className="h-16 w-auto max-w-full object-contain md:h-24"
              />
            </div>
            <div>
              <h1 className="font-display text-2xl text-ink md:text-3xl">
                Painel Estatístico CPRAIO 2025 – Comparativo 2024–2025
              </h1>
              <p className="text-sm text-slate">
                Indicadores consolidados | Comparação anual | CPRAIO / PMCE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-4">
            <img
              src={`${BASE_PATH}/assets/logo-pmce.png`}
              alt="Logo PMCE"
              className="h-12 w-auto max-w-[64px] object-contain"
            />
            <div>
              <p className="text-xs font-semibold text-slate">
                Vinculado à PMCE
              </p>
              <p className="text-sm font-medium text-ink">
                Polícia Militar do Ceará
              </p>
            </div>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="visao">Visão Geral</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="comparador">Comparador</TabsTrigger>
            <TabsTrigger value="metodologia">Metodologia</TabsTrigger>
          </TabsList>

          <TabsContent value="visao" className="mt-8 space-y-8 animate-float">
            <Card className="p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setTrainingOpen((prev) => !prev)}
                className="w-full text-left"
                aria-expanded={trainingOpen}
              >
                <div className="flex flex-col gap-4 bg-gradient-to-r from-white to-warm/60 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                      Destaque institucional
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-ink">
                      Policiais Qualificados
                    </h2>
                    <p className="mt-2 text-sm text-slate">
                      Clique para ver o detalhamento das turmas e participações.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white px-5 py-4 shadow-soft">
                      <p className="text-3xl font-semibold text-ink">1631</p>
                      <p className="text-xs text-slate">PPMM Qualificados</p>
                    </div>
                    <div className="text-2xl">{trainingOpen ? "−" : "+"}</div>
                  </div>
                </div>
              </button>
              {trainingOpen ? (
                <div className="grid gap-4 border-t border-ink/10 bg-white/80 px-6 py-6 md:grid-cols-3">
                  {[
                    {
                      title: "Participações totais",
                      value: "1.855",
                      detail: "Somatório de todas as formações registradas."
                    },
                    {
                      title: "Turmas de nivelamento",
                      value: "20",
                      detail: "1.334 participações acumuladas."
                    },
                    {
                      title: "CEPM + CMB",
                      value: "16",
                      detail: "15 turmas CEPM (274 formados) + 1 CMB (23 formados)."
                    }
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-ink/10 bg-white px-4 py-4 shadow-soft"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                        {item.title}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {item.value}
                      </p>
                      <p className="mt-2 text-xs text-slate">{item.detail}</p>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4 shadow-soft md:col-span-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                      Taxa de conclusão
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        53%
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        57%
                      </span>
                      <p className="text-xs text-slate">
                        Cursos principais mantiveram conclusão entre 53% e 57%.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>
            <Card className="p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => setOperationsOpen((prev) => !prev)}
                className="w-full text-left"
                aria-expanded={operationsOpen}
              >
                <div className="flex flex-col gap-4 bg-gradient-to-r from-white to-warm/60 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate">
                      Destaque operacional
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-ink">
                      Operações
                    </h2>
                    <p className="mt-2 text-sm text-slate">
                      Total registrado até 23/12/2025. Clique para detalhar por
                      batalhão.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-white px-5 py-4 shadow-soft">
                      <p className="text-3xl font-semibold text-ink">679</p>
                      <p className="text-xs text-slate">
                        Operações consolidadas
                      </p>
                    </div>
                    <div className="text-2xl">{operationsOpen ? "−" : "+"}</div>
                  </div>
                </div>
              </button>
              {operationsOpen ? (
                <div className="grid gap-4 border-t border-ink/10 bg-white/80 px-6 py-6 md:grid-cols-3">
                  {[
                    { label: "CPRAIO", value: "73" },
                    { label: "1º BPRAIO", value: "208" },
                    { label: "2º BPRAIO", value: "112" },
                    { label: "3º BPRAIO", value: "72" },
                    { label: "4º BPRAIO", value: "88" },
                    { label: "5º BPRAIO", value: "126" }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-ink/10 bg-white px-4 py-4 shadow-soft"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
            {loading ? (
              <EmptyState message="Carregando indicadores consolidados..." />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {kpiData.map((item) => (
                  <Card key={item.indicator} className="relative">
                    <div className="absolute right-6 top-6 text-2xl">
                      {KPIArrow({ percent: item.percent })}
                    </div>
                    <Tooltip content={INDICATOR_TOOLTIPS[item.indicator]}>
                      <h2 className="font-display text-lg text-ink">
                        {item.indicator}
                      </h2>
                    </Tooltip>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                      {formatNumber(item.value2025)}
                    </p>
                    <p className="text-sm text-slate">
                      2024: {formatNumber(item.value2024)}
                    </p>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate">
                          Δ {formatNumber(item.diff)}
                        </p>
                        <p className="text-sm text-slate">
                          Δ% {formatPercent(item.percent)}
                        </p>
                      </div>
                      <KPIBadge diff={item.diff} percent={item.percent} />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader
                  title="Comparativo por indicador"
                  description="Barras agrupadas mostrando a evolução anual."
                />
                <div ref={mainChartRef} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="2024" fill="#4A5568" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="2025" fill={THEME_PRIMARY} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <Button variant="outline" onClick={exportMainChart}>
                    Exportar PNG
                  </Button>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Índice de crescimento"
                  description="Variação percentual do indicador no período."
                />
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(value: number) => formatPercent(value)} />
                      <Line
                        type="monotone"
                        dataKey="crescimento"
                        stroke={THEME_PRIMARY}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Insights automáticos"
                description="Leitura rápida para públicos não técnicos."
              />
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-slate">Top 3 crescimentos</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {insights.top3.map((item) => (
                      <li key={item.name} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {item.name}: {formatPercent(item.percent)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate">Menor variação</p>
                  <p className="mt-2 text-sm">
                    {insights.least.name} ficou praticamente estável com
                    {" "}
                    {formatPercent(insights.least.percent)}.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate">Resumo didático</p>
                  <p className="mt-2 text-sm">
                    Em 2025, a maioria dos indicadores apresentou crescimento,
                    indicando intensificação das ações operacionais no período.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rankings" className="mt-8 space-y-8 animate-float">
            <div className="flex flex-wrap items-center gap-3">
              {RANKING_TABS.map((item) => (
                <Button
                  key={item.key}
                  variant={rankingTab === item.key ? "primary" : "ghost"}
                  onClick={() => setRankingTab(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-6">
              <Select
                label="Ano"
                value={rankingYear}
                onChange={setRankingYear}
                options={yearOptions}
              />
              {rankingTab === "geral" ? (
                <Select
                  label="Métrica"
                  value={rankingMetric}
                  onChange={setRankingMetric}
                  options={METRIC_OPTIONS}
                />
              ) : null}
              <Button variant="outline" onClick={handleExportRankingCsv}>
                Exportar CSV filtrado
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader
                  title="Top 3 unidades"
                  description="Ranking lado a lado por ano."
                />
                {ranking2024.length === 0 && ranking2025.length === 0 ? (
                  <EmptyState message="Sem dados disponíveis para este ranking." />
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate">2024</p>
                      <Table
                        headers={["Pos", "Unidade", getMetricLabel(metricKey)]}
                        rows={ranking2024.map((row) => [
                          row.Pos || "-",
                          row.Unidade,
                          formatNumber((row[metricKey] as number) || 0)
                        ])}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate">2025</p>
                      <Table
                        headers={["Pos", "Unidade", getMetricLabel(metricKey)]}
                        rows={ranking2025.map((row) => [
                          row.Pos || "-",
                          row.Unidade,
                          formatNumber((row[metricKey] as number) || 0)
                        ])}
                      />
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Comparativo por unidade"
                  description="Barras horizontais por unidade e ano."
                />
                <div ref={rankingChartRef} className="h-80">
                  {rankingChartData.length === 0 ? (
                    <EmptyState message="Sem dados para o gráfico selecionado." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rankingChartData}
                        layout="vertical"
                        margin={{ left: 32, right: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                          type="category"
                          dataKey="unidade"
                          tick={{ fontSize: 9 }}
                          width={130}
                        />
                        <RechartsTooltip />
                        <Legend />
                        {rankingYear !== "2025" ? (
                          <Bar
                            dataKey="2024"
                            name="2024"
                            fill="#4A5568"
                            radius={[6, 6, 6, 6]}
                          />
                        ) : null}
                        {rankingYear !== "2024" ? (
                          <Bar
                            dataKey="2025"
                            name="2025"
                            fill={THEME_PRIMARY}
                            radius={[6, 6, 6, 6]}
                          />
                        ) : null}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <Button variant="outline" onClick={exportRankingChart}>
                    Exportar PNG
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparador" className="mt-8 space-y-8 animate-float">
            <Card>
              <CardHeader
                title="Comparador interativo"
                description="Escolha indicadores e anos para entender a variação."
              />
              <div className="grid gap-6 md:grid-cols-3">
                <Select
                  label="Indicador"
                  value={comparatorIndicator}
                  onChange={setComparatorIndicator}
                  options={INDICATOR_LABELS.map((item) => ({
                    value: item,
                    label: item
                  }))}
                />
                <Select
                  label="Ano base"
                  value={comparatorBase}
                  onChange={setComparatorBase}
                  options={[
                    { value: "2024", label: "2024" },
                    { value: "2025", label: "2025" }
                  ]}
                />
                <Select
                  label="Ano comparado"
                  value={comparatorCompare}
                  onChange={setComparatorCompare}
                  options={[
                    { value: "2024", label: "2024" },
                    { value: "2025", label: "2025" }
                  ]}
                />
                <Select
                  label="Exibição"
                  value={comparatorView}
                  onChange={setComparatorView}
                  options={COMPARATOR_VIEWS}
                />
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader
                  title="Resumo"
                  description="Comparativo rápido entre anos selecionados."
                />
                <div className="space-y-3">
                  <p className="text-3xl font-semibold">
                    {formatNumber(comparatorData.compareValue)}
                  </p>
                  <p className="text-sm text-slate">
                    Base {comparatorData.baseYear}: {formatNumber(comparatorData.baseValue)}
                  </p>
                  <Separator className="my-4" />
                  <p className="text-sm text-slate">
                    Δ {formatNumber(comparatorData.diff)} ({formatPercent(comparatorData.percent)})
                  </p>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Visualização"
                  description="Barras comparativas com tooltip."
                />
                <div ref={comparatorChartRef} className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        comparatorView === "percent"
                          ? [
                              {
                                name: "Variação (%)",
                                valor: comparatorData.percent
                              }
                            ]
                          : [
                              {
                                name: `${comparatorData.baseYear}`,
                                valor: comparatorData.baseValue
                              },
                              {
                                name: `${comparatorData.compareYear}`,
                                valor: comparatorData.compareValue
                              }
                            ]
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value: number) =>
                          comparatorView === "percent"
                            ? formatPercent(value)
                            : formatNumber(value)
                        }
                      />
                      <Bar dataKey="valor" fill={THEME_PRIMARY} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <Button variant="outline" onClick={exportComparatorChart}>
                    Exportar PNG
                  </Button>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Narrativa automática"
                description="Explicação em linguagem simples."
              />
              <p className="text-sm">
                Em {comparatorData.compareYear}, houve{" "}
                {comparatorData.diff >= 0 ? "mais" : "menos"}{" "}
                {comparatorView === "percent"
                  ? formatPercent(Math.abs(comparatorData.percent))
                  : formatNumber(Math.abs(comparatorData.diff))}{" "}
                de {comparatorIndicator} em relação a {comparatorData.baseYear},
                representando {formatPercent(comparatorData.percent)}.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="metodologia" className="mt-8 space-y-8 animate-float">
            <Card>
              <CardHeader
                title="Metodologia e transparência"
                description="Contexto institucional e fonte dos dados."
              />
              <div className="space-y-4 text-sm text-slate">
                <p>
                  Fonte: Relatórios Operacionais Consolidados — Sistema Integrado de
                  Gerenciamento Estatístico.
                </p>
                <p>
                  Períodos analisados: 2024-01-01 a 2024-12-22 e 2025-01-01 a
                  2025-12-22.
                </p>
                <p>
                  Dados consolidados de todas as unidades no período especificado.
                  Não há dados pessoais, apenas agregados.
                </p>
                {warnings.length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <p className="font-semibold">Avisos de integridade:</p>
                    <ul className="mt-2 list-disc pl-5">
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleExportProcessedCsv}>
                  Baixar CSV processado
                </Button>
                <Button variant="outline" onClick={exportMainChart}>
                  Exportar gráficos (PNG)
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        <footer className="rounded-3xl border border-white/60 bg-white/70 px-6 py-4 text-center text-xs text-slate shadow-soft">
          Relatório Produzido pelo Núcleo de Estatística e Análise Operacional
          – NEAO / CPRaio
        </footer>
      </section>
    </main>
  );
}
