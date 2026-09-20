# CPRAIO Analytics — 2024–2025 Comparative Dashboard

Interactive analytical dashboard for comparing aggregated indicators across 2024 and 2025, with rankings, visual summaries, exports and automated data validation.

The project demonstrates a complete path from structured CSV data to a production-ready analytical interface.

## Core capabilities

- year-over-year indicator comparison;
- ranking views;
- interactive charts and visual summaries;
- CSV parsing and structured data loading;
- image/export support for dashboard outputs;
- static deployment support;
- dedicated validation command for source datasets.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Framework | Next.js 14 |
| Language | TypeScript |
| UI | React 18 |
| Visualization | Recharts |
| Data ingestion | Papa Parse |
| Styling | Tailwind CSS |
| Export | html-to-image |
| Quality | ESLint, TypeScript, custom data validation |

## Data flow

```text
CSV datasets
     │
     ▼
Parsing / normalization
     │
     ▼
Validation rules
     │
     ▼
React / Next.js analytical views
     │
     ├── KPIs
     ├── rankings
     ├── charts
     └── exports
```

The main datasets are stored under:

```text
public/data/
├── totals.csv
├── ranking_geral.csv
├── ranking_arms.csv
├── ranking_mandados.csv
├── ranking_trafico.csv
└── ranking_veiculos.csv
```

## Running locally

Requirements:

- Node.js 18+
- npm

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Validate the data

Before building or publishing updated datasets:

```bash
npm run validate-data
```

The validation script checks expected columns and reports structural inconsistencies before they reach the dashboard.

## Production build

```bash
npm run build
```

The project is configured for static export and can be hosted through GitHub Pages or another static hosting provider.

## Engineering principles

This project emphasizes:

- **data validation before visualization**;
- separation between data sources and presentation;
- reproducible comparisons;
- readable analytical outputs for decision support;
- explicit handling of data-quality problems.

## Data responsibility

Only aggregated, authorized and publication-safe datasets should be committed to a public repository. Operational or personally identifiable information should remain outside the public codebase.

## Repository

GitHub: https://github.com/abraaorosal/estatistica24_25_CPRaio

---

**Portfolio focus:** analytics engineering · Next.js · TypeScript · data quality · decision-support dashboards
