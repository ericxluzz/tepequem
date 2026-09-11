export type AthleteStatus = 'pendente' | 'valido' | 'invalido';

export interface CheckRecord {
  status: 'valido' | 'invalido';
  motivo?: string;
  observacao?: string;
  operador: string;
  timestamp: string;
}

export interface Athlete {
  id?: number;
  numero_inscricao: string;
  nome: string;
  cpf?: string;
  data_nascimento?: string;
  idade_calculada?: number;
  sexo?: string;
  categoria?: string;
  telefone?: string;
  email?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_tel?: string;
  nome_mae?: string;
  nome_pai?: string;
  cidade?: string;
  uf?: string;
  tamanho_camiseta?: string;
  equipe?: string;
  apelido?: string;
  pcd?: string;
  observacoes?: string;
  status: AthleteStatus;
  historico: CheckRecord[];
  importado_em: string;
  // nome normalizado para busca (sem acento, lowercase)
  _search?: string;
  // campos extras da planilha
  [key: string]: unknown;
}

export interface ColumnMapping {
  sheetColumn: string;
  systemField: string;
}

export const SYSTEM_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: 'numero_inscricao', label: 'Número de Inscrição', required: true },
  { key: 'nome', label: 'Nome Completo', required: true },
  { key: 'cpf', label: 'CPF / Documento', required: false },
  { key: 'data_nascimento', label: 'Data de Nascimento', required: false },
  { key: 'sexo', label: 'Sexo (M/F)', required: false },
  { key: 'categoria', label: 'Categoria', required: false },
  { key: 'telefone', label: 'Telefone', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'contato_emergencia_nome', label: 'Contato de Emergência (Nome)', required: false },
  { key: 'contato_emergencia_tel', label: 'Contato de Emergência (Tel)', required: false },
  { key: 'nome_mae', label: 'Nome da Mãe', required: false },
  { key: 'nome_pai', label: 'Nome do Pai', required: false },
  { key: 'cidade', label: 'Cidade', required: false },
  { key: 'uf', label: 'UF', required: false },
  { key: 'tamanho_camiseta', label: 'Tamanho de Camiseta', required: false },
  { key: 'equipe', label: 'Equipe / Assessoria', required: false },
  { key: 'apelido', label: 'Como quer ser chamado', required: false },
  { key: 'pcd', label: 'PcD (Categoria)', required: false },
  { key: 'observacoes', label: 'Observações', required: false },
];

// Data da prova para cálculo de idade
export const RACE_DATE = new Date('2026-09-19');
