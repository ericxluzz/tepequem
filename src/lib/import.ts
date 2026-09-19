import type { Athlete, ColumnMapping } from '../types/athlete';
import { buildSearchString, calcAge } from './utils';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/** Faz o parse de um CSV (texto puro) — usado tanto pela planilha oficial embutida no app. */
export function parseCsvText(text: string): ParsedSheet {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) throw new Error('Arquivo vazio');

  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return { headers, rows, totalRows: rows.length };
}

/**
 * Auto-detecta mapeamento de colunas com base em nomes comuns.
 */
export function autoDetectMapping(headers: string[]): ColumnMapping[] {
  const mapping: ColumnMapping[] = [];
  const normalized = headers.map((h) => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));

  const fieldAliases: Record<string, string[]> = {
    numero_inscricao: ['numero', 'numeral', 'num', 'nro', 'inscricao', 'id', 'codigo', 'code', '#', 'peito', 'dorsal'],
    nome: ['nome', 'name', 'atleta', 'athlete', 'participante'],
    cpf: ['cpf', 'documento', 'doc', 'rg'],
    data_nascimento: ['nascimento', 'data_nasc', 'dtnasc', 'birthdate', 'birth', 'dob'],
    sexo: ['sexo', 'genero', 'gender', 'sex'],
    categoria: ['categoria', 'category', 'cat', 'modalidade'],
    telefone: ['telefone', 'tel', 'phone', 'celular', 'whatsapp', 'fone'],
    email: ['email', 'e-mail', 'mail'],
    contato_emergencia_nome: ['emergencia_nome', 'contato_emergencia', 'emergency_name', 'nome_emergencia'],
    contato_emergencia_tel: ['emergencia_tel', 'tel_emergencia', 'emergency_phone'],
    nome_mae: ['mae', 'mother', 'nome_mae'],
    nome_pai: ['pai', 'father', 'nome_pai'],
    cidade: ['cidade', 'city', 'municipio'],
    uf: ['uf', 'estado', 'state', 'estado_uf'],
    tamanho_camiseta: ['camiseta', 'shirt', 'tamanho', 'size'],
    equipe: ['equipe', 'team', 'assessoria', 'clube', 'club'],
    apelido: ['apelido', 'nickname', 'como quer ser chamado', 'chamado'],
    pcd: ['pcd', 'deficiencia', 'disability', 'especial'],
    observacoes: ['obs', 'observacoes', 'observacao', 'notes', 'remarks', 'comentario'],
  };

  const usedFields = new Set<string>();

  // Itera por COLUNA (não por campo) para que cada coluna vire no máximo um campo,
  // evitando que uma coluna "vença" silenciosamente a de outro campo mais específico.
  for (let i = 0; i < normalized.length; i++) {
    const h = normalized[i];
    const tokens = h.split(/[^a-z0-9]+/).filter(Boolean);

    for (const [field, aliases] of Object.entries(fieldAliases)) {
      if (usedFields.has(field)) continue;
      // Aliases curtos (<=3 caracteres, ex: "uf", "id", "cat") só valem como
      // palavra inteira — senão "id" bate dentro de "modalidade", "uf" dentro
      // de qualquer coisa, etc. Aliases mais longos podem casar por substring.
      const matches = aliases.some((alias) =>
        alias.length <= 3 ? tokens.includes(alias) : h.includes(alias)
      );
      if (matches) {
        mapping.push({ sheetColumn: headers[i], systemField: field });
        usedFields.add(field);
        break;
      }
    }
  }

  return mapping;
}

export interface ImportResult {
  athletes: Athlete[];
  warnings: { row: number; message: string }[];
}

/**
 * Converte linhas da planilha em objetos Athlete usando o mapeamento de colunas.
 */
export function mapRowsToAthletes(
  rows: Record<string, string>[],
  mapping: ColumnMapping[]
): ImportResult {
  const athletes: Athlete[] = [];
  const warnings: { row: number; message: string }[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 porque começa na linha 2 da planilha (linha 1 é header)

    // Aplica mapeamento
    const mapped: Record<string, string> = {};
    for (const { sheetColumn, systemField } of mapping) {
      if (sheetColumn && systemField && systemField !== '__ignore__') {
        mapped[systemField] = String(row[sheetColumn] ?? '').trim();
      }
    }

    // Validações mínimas
    if (!mapped.nome && !mapped.numero_inscricao) {
      warnings.push({ row: rowNum, message: 'Linha sem nome e sem número de inscrição — ignorada.' });
      continue;
    }

    if (!mapped.nome) {
      warnings.push({ row: rowNum, message: `Linha ${rowNum}: sem nome preenchido.` });
    }
    if (!mapped.numero_inscricao) {
      mapped.numero_inscricao = String(i + 1).padStart(3, '0'); // fallback sequencial
      warnings.push({ row: rowNum, message: `Linha ${rowNum}: sem número de inscrição — atribuído #${mapped.numero_inscricao}.` });
    }
    if (!mapped.apelido && mapped.nome) {
      mapped.apelido = mapped.nome.split(' ')[0];
    }

    const idadeCalculada = calcAge(mapped.data_nascimento);

    const athlete: Athlete = {
      numero_inscricao: mapped.numero_inscricao || String(i + 1),
      nome: mapped.nome || '(sem nome)',
      cpf: mapped.cpf || undefined,
      data_nascimento: mapped.data_nascimento || undefined,
      idade_calculada: idadeCalculada,
      sexo: mapped.sexo || undefined,
      categoria: mapped.categoria || undefined,
      telefone: mapped.telefone || undefined,
      email: mapped.email || undefined,
      contato_emergencia_nome: mapped.contato_emergencia_nome || undefined,
      contato_emergencia_tel: mapped.contato_emergencia_tel || undefined,
      nome_mae: mapped.nome_mae || undefined,
      nome_pai: mapped.nome_pai || undefined,
      cidade: mapped.cidade || undefined,
      uf: mapped.uf || undefined,
      tamanho_camiseta: mapped.tamanho_camiseta || undefined,
      equipe: mapped.equipe || undefined,
      apelido: mapped.apelido || undefined,
      pcd: mapped.pcd || undefined,
      observacoes: mapped.observacoes || undefined,
      status: 'pendente',
      historico: [],
      importado_em: now,
      _search: buildSearchString(mapped as Parameters<typeof buildSearchString>[0]),
    };

    athletes.push(athlete);
  }

  return { athletes, warnings };
}
