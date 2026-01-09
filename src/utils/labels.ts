import type { SituationType } from '../types/database'

export function getSituationTypeLabel(type: SituationType): string {
  const labels: Record<SituationType, string> = {
    conflict: 'Conflito/clima',
    misconduct: 'Conduta inadequada',
    moral_harassment: 'Assédio moral',
    discrimination: 'Discriminação',
    sexual_harassment: 'Assédio sexual',
    threat_violence: 'Ameaça/violência',
    fraud: 'Fraude/irregularidade',
    other: 'Outros',
  }
  return labels[type] || 'Desconhecido'
}

