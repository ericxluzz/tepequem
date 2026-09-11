/**
 * Normaliza uma string para busca: remove acentos, converte para lowercase, remove espaços extras.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Constrói a string de busca composta para um atleta.
 * Concatena todos os campos pesquisáveis num único campo normalizado.
 */
export function buildSearchString(athlete: {
  nome?: string;
  apelido?: string;
  nome_mae?: string;
  nome_pai?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  numero_inscricao?: string;
  equipe?: string;
}): string {
  return normalizeForSearch(
    [
      athlete.nome,
      athlete.apelido,
      athlete.nome_mae,
      athlete.nome_pai,
      athlete.cpf,
      athlete.telefone,
      athlete.email,
      athlete.numero_inscricao,
      athlete.equipe,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

/**
 * Calcula a idade em anos na data da prova (19/09/2026).
 */
export function calcAge(dataNascimento: string | undefined): number | undefined {
  if (!dataNascimento) return undefined;

  const raceDate = new Date('2026-09-19');
  let birth: Date;

  // Tenta parsear data em vários formatos: DD/MM/YYYY, YYYY-MM-DD, ou timestamp numérico (Excel serial)
  if (/^\d{5}$/.test(dataNascimento)) {
    // Excel serial date
    const excelEpoch = new Date(Date.UTC(1900, 0, 1));
    birth = new Date(excelEpoch.getTime() + (parseInt(dataNascimento) - 2) * 86400000);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) {
    const [d, m, y] = dataNascimento.split('/');
    birth = new Date(`${y}-${m}-${d}`);
  } else {
    birth = new Date(dataNascimento);
  }

  if (isNaN(birth.getTime())) return undefined;

  let age = raceDate.getFullYear() - birth.getFullYear();
  const m = raceDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && raceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Formata data para exibição em pt-BR.
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formata datetime para exibição em pt-BR.
 */
export function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gera nome de arquivo com timestamp.
 */
export function timestampedFilename(prefix: string, ext: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}h${pad(now.getMinutes())}`;
  return `${prefix}_${date}_${time}.${ext}`;
}

/**
 * Infere categoria a partir da idade e sexo.
 */
export function inferCategory(age: number | undefined, sexo: string | undefined): string {
  if (age === undefined) return '—';
  const group = age >= 60 ? 'Diamante Brilhante' : 'Diamante Bruto';
  const gender = sexo?.toUpperCase().startsWith('F') ? 'Feminino' : 'Masculino';
  return `${group} ${gender}`;
}

/**
 * Merge simples de classes CSS (substituindo cn do tailwind-merge para simplicidade).
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
