import csvRaw from '../../lista_atletas_real.csv?raw';
import { parseCsvText, autoDetectMapping, mapRowsToAthletes } from '../lib/import';
import type { Athlete } from '../types/athlete';

/**
 * Planilha oficial da prova, embutida no build — todo aparelho que abrir o
 * app já nasce com a mesma base de atletas, sem precisar de nenhum passo
 * manual de importação (e sem risco de um aparelho carregar um arquivo diferente).
 */
export function getSeedAthletes(): Athlete[] {
  const parsed = parseCsvText(csvRaw);
  const mapping = autoDetectMapping(parsed.headers);
  const fullMapping = parsed.headers.map(
    (h) => mapping.find((m) => m.sheetColumn === h) ?? { sheetColumn: h, systemField: '__ignore__' }
  );
  return mapRowsToAthletes(parsed.rows, fullMapping).athletes;
}
