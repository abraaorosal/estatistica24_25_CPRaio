import fs from "fs";
import path from "path";
import Papa from "papaparse";

const root = process.cwd();
const dataDir = path.join(root, "public", "data");

const files = [
  {
    name: "totals.csv",
    columns: ["Indicador", "Ano"],
    optional: ["Valor", "Quantidade"]
  },
  {
    name: "ranking_geral.csv",
    columns: ["Ano", "Unidade", "Ocorrencias", "Armas", "Trafico", "Mandados"]
  },
  {
    name: "ranking_arms.csv",
    columns: ["Ano", "Unidade", "Armas", "Ocorrencias", "Percentual"]
  },
  {
    name: "ranking_mandados.csv",
    columns: ["Ano", "Unidade", "Mandados", "Ocorrencias", "Percentual"]
  },
  {
    name: "ranking_trafico.csv",
    columns: ["Ano", "Unidade", "Trafico", "Ocorrencias", "Percentual"]
  },
  {
    name: "ranking_veiculos.csv",
    columns: ["Ano", "Unidade", "Veiculos", "Ocorrencias", "Percentual"]
  }
];

const issues = [];

files.forEach((file) => {
  const filePath = path.join(dataDir, file.name);
  if (!fs.existsSync(filePath)) {
    issues.push(`Arquivo ausente: ${file.name}`);
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  const row = parsed.data[0] || {};
  const keys = Object.keys(row);
  file.columns.forEach((column) => {
    if (!keys.includes(column)) {
      issues.push(`Coluna ausente em ${file.name}: ${column}`);
    }
  });
  if (file.optional) {
    const hasOptional = file.optional.some((column) => keys.includes(column));
    if (!hasOptional) {
      issues.push(`Coluna de valor ausente em ${file.name}: ${file.optional.join("/")}`);
    }
  }
});

if (issues.length === 0) {
  console.log("Dados validados com sucesso. Nenhuma inconsistência encontrada.");
  process.exit(0);
}

console.log("Foram encontradas inconsistências nos CSVs:");
issues.forEach((issue) => console.log(`- ${issue}`));
process.exit(1);
