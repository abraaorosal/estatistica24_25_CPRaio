# Painel Estatístico CPRAIO 2025 – Comparativo 2024–2025

Dashboard web interativo para comparar indicadores 2024 vs 2025 com rankings, insights e exportações.

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Publicar no GitHub Pages (Next.js export)

Este projeto usa `output: "export"` no `next.config.js`.

1) Gere a versão estática:
```bash
npm run build
```
2) Faça deploy da pasta `out/` para o GitHub Pages.

Se o seu repositório estiver em um subpath (ex.: `https://usuario.github.io/rep`), ajuste `basePath` e `assetPrefix` em `next.config.js` antes do build.

## Onde colocar CSVs e logos

- CSVs em `public/data/`:
  - `totals.csv`
  - `ranking_geral.csv`
  - `ranking_arms.csv`
  - `ranking_mandados.csv`
  - `ranking_trafico.csv`
  - `ranking_veiculos.csv`
- Logos em `public/assets/`:
  - `logo-raio.png`
  - `logo-pmce.png`

## Validação dos dados

```bash
npm run validate-data
```

O script verifica colunas esperadas e alerta inconsistências.
