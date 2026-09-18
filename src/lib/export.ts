import ExcelJS from 'exceljs';
import type { Athlete } from '../types/athlete';
import { formatDate, formatDateTime, timestampedFilename } from './utils';

const STATUS_COLORS = {
  valido: { argb: 'FFD4EDDA' },   // verde claro
  invalido: { argb: 'FFF8D7DA' }, // vermelho claro
  pendente: { argb: 'FFE2E3E5' }, // cinza claro
};

const HEADER_COLOR = { argb: 'FF1A1A2E' }; // azul escuro
const HEADER_FONT_COLOR = { argb: 'FFFFFFFF' };
const GRID_BORDER = { style: 'thin' as const, color: { argb: 'FF9CA3AF' } };
const CELL_BORDER = { top: GRID_BORDER, left: GRID_BORDER, bottom: GRID_BORDER, right: GRID_BORDER };

function up(v: unknown): string {
  return String(v ?? '').toUpperCase();
}

const ORDEM_STATUS: Record<Athlete['status'], number> = { invalido: 0, valido: 1, pendente: 2 };

/** Desclassificados primeiro, depois válidos, depois pendentes; dentro de cada grupo, por número de peito. */
function ordenarParaRelatorio(athletes: Athlete[]): Athlete[] {
  return [...athletes].sort(
    (a, b) =>
      ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] ||
      a.numero_inscricao.localeCompare(b.numero_inscricao, 'pt-BR', { numeric: true })
  );
}

export interface ReportOptions {
  incluirObs: boolean;
  incluirContato: boolean;
}

export const DEFAULT_REPORT_OPTIONS: ReportOptions = { incluirObs: true, incluirContato: false };

/**
 * Gera o relatório Excel estilizado com duas abas: Atletas + Resumo.
 */
export async function generateReport(athletes: Athlete[], options: ReportOptions = DEFAULT_REPORT_OPTIONS): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Tepequém Up 2026';
  workbook.created = new Date();

  await buildAthletesSheet(workbook, athletes, options);
  await buildSummarySheet(workbook, athletes);

  // Gera o blob e dispara download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const filename = timestampedFilename('tepequem-up-2026_checagem', 'xlsx');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function buildAthletesSheet(workbook: ExcelJS.Workbook, athletes: Athlete[], options: ReportOptions) {
  const sheet = workbook.addWorksheet('Atletas', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const columns: { header: string; key: string; width: number }[] = [
    { header: 'Nº de Peito', key: 'numero_inscricao', width: 13 },
    { header: 'Status', key: 'status', width: 17 },
    { header: 'Nome', key: 'nome', width: 35 },
    { header: 'CPF / Doc', key: 'cpf', width: 16 },
    { header: 'Data Nasc.', key: 'data_nascimento', width: 13 },
    { header: 'Idade', key: 'idade_calculada', width: 8 },
    { header: 'Sexo', key: 'sexo', width: 8 },
    { header: 'Categoria', key: 'categoria', width: 25 },
    { header: 'Cidade/UF', key: 'cidade_uf', width: 18 },
    { header: 'Equipe', key: 'equipe', width: 22 },
  ];
  if (options.incluirContato) {
    columns.push({ header: 'Telefone', key: 'telefone', width: 16 });
    columns.push({ header: 'E-mail', key: 'email', width: 24 });
  }
  if (options.incluirObs) columns.push({ header: 'Observação', key: 'observacao', width: 30 });
  columns.push({ header: 'Operador', key: 'operador', width: 18 });
  columns.push({ header: 'Data/Hora Checagem', key: 'timestamp', width: 20 });

  sheet.columns = columns;

  // Estiliza cabeçalho
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: HEADER_COLOR };
    cell.font = { bold: true, color: HEADER_FONT_COLOR, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = CELL_BORDER;
  });
  headerRow.height = 22;

  // Adiciona linhas de dados (desclassificados primeiro, pra facilitar a avaliação)
  for (const athlete of ordenarParaRelatorio(athletes)) {
    const lastCheck = athlete.historico[athlete.historico.length - 1];
    const statusLabel =
      athlete.status === 'valido' ? 'VÁLIDO' : athlete.status === 'invalido' ? 'DESCLASSIFICADO' : 'PENDENTE';

    const row = sheet.addRow({
      numero_inscricao: athlete.numero_inscricao,
      nome: up(athlete.nome),
      status: statusLabel,
      cpf: athlete.cpf ?? '',
      data_nascimento: formatDate(athlete.data_nascimento),
      idade_calculada: athlete.idade_calculada ?? '',
      sexo: up(athlete.sexo),
      categoria: up(athlete.categoria),
      telefone: athlete.telefone ?? '',
      email: athlete.email ?? '',
      cidade_uf: up([athlete.cidade, athlete.uf].filter(Boolean).join('/')),
      equipe: up(athlete.equipe),
      observacao: up(lastCheck?.observacao),
      operador: up(lastCheck?.operador),
      timestamp: lastCheck ? formatDateTime(lastCheck.timestamp) : '',
    });

    // Cor de fundo por status + bordas para separar as células
    const rowColor = STATUS_COLORS[athlete.status];
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: rowColor };
      cell.alignment = { vertical: 'middle' };
      cell.border = CELL_BORDER;
    });

    // Negrito no nome
    row.getCell('nome').font = { bold: true };
  }

  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + columns.length)}1` };
}

async function buildSummarySheet(workbook: ExcelJS.Workbook, athletes: Athlete[]) {
  const sheet = workbook.addWorksheet('Resumo');

  const total = athletes.length;
  const validos = athletes.filter((a) => a.status === 'valido').length;
  const invalidos = athletes.filter((a) => a.status === 'invalido').length;
  const pendentes = athletes.filter((a) => a.status === 'pendente').length;

  const addTitle = (text: string, row: number) => {
    const r = sheet.getRow(row);
    const cell = r.getCell(1);
    cell.value = text;
    cell.font = { bold: true, size: 13, color: { argb: 'FF1A1A2E' } };
    r.height = 20;
  };

  const addDataRow = (label: string, value: string | number, rowNum: number, color?: string) => {
    const r = sheet.getRow(rowNum);
    r.getCell(1).value = up(label);
    r.getCell(2).value = typeof value === 'string' ? up(value) : value;
    r.eachCell((cell) => {
      cell.border = CELL_BORDER;
      if (color) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    });
    r.getCell(1).font = { bold: false };
    r.getCell(2).alignment = { horizontal: 'center' };
  };

  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 15;

  addTitle('📊 RESUMO DA CHECAGEM — TEPEQUÉM UP 2026', 1);
  addTitle(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 2);

  sheet.getRow(4).getCell(1).value = 'TOTAIS GERAIS';
  sheet.getRow(4).getCell(1).font = { bold: true, size: 11 };

  addDataRow('Total de Inscritos', total, 5);
  addDataRow('✅ Válidos', validos, 6, 'FFD4EDDA');
  addDataRow('❌ Desclassificados', invalidos, 7, 'FFF8D7DA');
  addDataRow('⏳ Pendentes', pendentes, 8, 'FFE2E3E5');

  // Por categoria
  const categorias = [...new Set(athletes.map((a) => a.categoria).filter(Boolean))] as string[];
  if (categorias.length > 0) {
    sheet.getRow(10).getCell(1).value = 'POR CATEGORIA';
    sheet.getRow(10).getCell(1).font = { bold: true, size: 11 };
    let r = 11;
    for (const cat of categorias) {
      const count = athletes.filter((a) => a.categoria === cat).length;
      const validosCat = athletes.filter((a) => a.categoria === cat && a.status === 'valido').length;
      addDataRow(cat, `${validosCat}/${count} válidos`, r++);
    }
  }
}

/**
 * Abre uma janela de impressão com o relatório em tabela (para salvar como PDF).
 */
export function openPrintReport(athletes: Athlete[], options: ReportOptions = DEFAULT_REPORT_OPTIONS): boolean {
  const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const validos = athletes.filter((a) => a.status === 'valido').length;
  const invalidos = athletes.filter((a) => a.status === 'invalido').length;
  const pendentes = athletes.length - validos - invalidos;

  const cols: { t: string; v: (a: Athlete) => string; center?: boolean }[] = [
    { t: 'Nº de Peito', v: (a) => a.numero_inscricao, center: true },
    { t: 'Situação', v: (a) => (a.status === 'valido' ? 'Válido' : a.status === 'invalido' ? 'Desclassificado' : 'Pendente'), center: true },
    { t: 'Nome', v: (a) => a.nome },
    { t: 'Categoria', v: (a) => a.categoria || '' },
    { t: 'CPF', v: (a) => a.cpf || '', center: true },
    { t: 'Equipe', v: (a) => a.equipe || '' },
    { t: 'UF', v: (a) => a.uf || '', center: true },
  ];
  if (options.incluirContato) cols.push({ t: 'Telefone', v: (a) => a.telefone || '', center: true });
  if (options.incluirObs) cols.push({ t: 'Observação', v: (a) => a.historico[a.historico.length - 1]?.observacao || '' });
  cols.push({ t: 'Operador', v: (a) => a.historico[a.historico.length - 1]?.operador || '', center: true });

  const th = cols.map((c) => `<th>${esc(c.t)}</th>`).join('');
  const tr = ordenarParaRelatorio(athletes).map((a, i) => {
    const cls = a.status === 'invalido' ? 'inv' : i % 2 ? 'alt' : 'row';
    return `<tr class="${cls}">${cols.map((c) => `<td class="${c.center ? 'center' : ''}${c.t === 'Situação' ? ' sit ' + a.status : ''}${c.t === 'Nome' ? ' nome' : ''}">${esc(c.v(a))}</td>`).join('')}</tr>`;
  }).join('');

  const html = '<html><head><meta charset="utf-8"><title>Relatório de checagem</title><style>'
    + '@page{size:A4 landscape;margin:10mm}'
    + 'body{font-family:"Segoe UI",Calibri,Arial,sans-serif;color:#1F2937;margin:0;padding:16px;background:#fff}'
    + 'h1{font-size:13px;font-weight:bold;color:#111827;margin:0 0 4px}'
    + 'p.sub{font-size:9px;color:#6B7280;margin:0 0 14px}'
    + 'table.grid{border-collapse:collapse;width:100%;font-size:9px;table-layout:fixed;border:2px solid #1a45c0;text-transform:uppercase}'
    + 'table.grid th{background:#1D4ED8;color:#fff;font-size:9.5px;font-weight:bold;padding:8px 7px;border:1px solid #9CA3AF}'
    + 'table.grid td{border:1px solid #9CA3AF;padding:6px 7px;word-wrap:break-word;line-height:1.35}'
    + 'table.grid tr.alt td{background:#F9FAFB}table.grid tr.inv td{background:#FEF7F7}'
    + 'table.grid td.center{text-align:center}table.grid td.nome{font-weight:bold;color:#111827}'
    + 'table.grid td.sit{text-align:center;font-weight:bold;font-size:8.5px}'
    + 'table.grid td.sit.valido{background:#DEF7EC;color:#03543F}'
    + 'table.grid td.sit.invalido{background:#FDE8E8;color:#9B1C1C}'
    + 'table.grid td.sit.pendente{background:#FEF08A;color:#713F12}'
    + 'p.rod{margin-top:12px;font-size:8px;color:#9CA3AF}'
    + 'table.assin{margin-top:28px;width:100%;font-size:8.5px;color:#374151;border-collapse:collapse}'
    + 'table.assin td{padding-top:24px;border-top:1px solid #9CA3AF;text-align:center;width:30%}'
    + 'table.assin td.gap{border:0;width:5%}'
    + '</style></head><body>'
    + `<h1>Tepequém Up 2026 — RELATÓRIO OFICIAL DE CHECAGEM</h1>`
    + `<p class="sub">Emissão: ${new Date().toLocaleString('pt-BR')} · Total: ${athletes.length} · Válidos: ${validos} · Desclassificados: ${invalidos} · Pendentes: ${pendentes}</p>`
    + `<table class="grid"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`
    + '<p class="rod">Documento gerado eletronicamente pelo sistema de checagem de atletas.</p>'
    + '<table class="assin"><tr><td>Coordenação da checagem</td><td class="gap"></td><td>Responsável técnico</td><td class="gap"></td><td>Organização do evento</td></tr></table>'
    + '</body></html>';

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');

  if (!w) {
    // pop-up bloqueado ou sem suporte a nova janela (comum em PWA instalado
    // no celular) — baixa o relatório como arquivo pra abrir e imprimir manualmente.
    const a = document.createElement('a');
    a.href = url;
    a.download = timestampedFilename('tepequem-up-2026_relatorio', 'html');
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return false;
  }

  w.addEventListener('load', () => {
    w.print();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
  return true;
}
