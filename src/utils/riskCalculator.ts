import type { SituationType, RiskLevel } from '../types/database';

interface RiskFactors {
  situationType: SituationType;
  hasImmediateRisk: boolean;
  involvesLeadership: boolean;
  affectedScope: 'individual' | 'team' | 'department' | 'company';
  recurrence: 'first_time' | 'occurred_before' | 'frequent';
  hasRetaliation: boolean;
}

interface RiskCalculation {
  score: number;
  level: RiskLevel;
  justification: string;
}

const SITUATION_SCORES: Record<SituationType, number> = {
  conflict: 10,
  misconduct: 20,
  moral_harassment: 35,
  discrimination: 45,
  sexual_harassment: 60,
  threat_violence: 70,
  fraud: 60,
  other: 20,
};

const AFFECTED_SCOPE_SCORES = {
  individual: 0,
  team: 10,
  department: 20,
  company: 30,
};

const RECURRENCE_SCORES = {
  first_time: 0,
  occurred_before: 10,
  frequent: 20,
};

export function calculateRiskLevel(factors: RiskFactors): RiskCalculation {
  let score = SITUATION_SCORES[factors.situationType] || 20;
  let justificationParts: string[] = [];

  // Score base
  justificationParts.push(`Tipo = ${getSituationTypeLabel(factors.situationType)} (${score})`);

  // Risco imediato
  if (factors.hasImmediateRisk) {
    score += 40;
    justificationParts.push('Risco imediato (+40)');
  }

  // Envolvimento de liderança
  if (factors.involvesLeadership) {
    score += 20;
    justificationParts.push('Envolve liderança (+20)');
  }

  // Alcance
  const scopeScore = AFFECTED_SCOPE_SCORES[factors.affectedScope];
  score += scopeScore;
  if (scopeScore > 0) {
    justificationParts.push(`Alcance ${getAffectedScopeLabel(factors.affectedScope)} (+${scopeScore})`);
  }

  // Recorrência
  const recurrenceScore = RECURRENCE_SCORES[factors.recurrence];
  score += recurrenceScore;
  if (recurrenceScore > 0) {
    justificationParts.push(`Recorrência ${getRecurrenceLabel(factors.recurrence)} (+${recurrenceScore})`);
  }

  // Retaliação
  if (factors.hasRetaliation) {
    score += 30;
    justificationParts.push('Retaliação (+30)');
  }

  // Determinar nível baseado no score
  let level: RiskLevel;
  if (score >= 110) {
    level = 'critical';
  } else if (score >= 70) {
    level = 'high';
  } else if (score >= 30) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  // Overrides obrigatórios
  if (factors.situationType === 'sexual_harassment' || factors.situationType === 'threat_violence') {
    if (level === 'low' || level === 'moderate') {
      level = 'high';
      justificationParts.push('OVERRIDE: Assédio sexual ou ameaça = mínimo ALTO');
    }
  }

  if (factors.hasImmediateRisk && factors.situationType === 'threat_violence') {
    level = 'critical';
    justificationParts.push('OVERRIDE: Risco imediato + ameaça/violência = CRÍTICO');
  } else if (factors.hasImmediateRisk && (level === 'low' || level === 'moderate')) {
    level = 'high';
    justificationParts.push('OVERRIDE: Risco imediato = mínimo ALTO');
  }

  const justification = `Classificação: Risco ${getRiskLevelLabel(level)}. ${justificationParts.join(', ')}. Score total: ${score}.`;

  return {
    score,
    level,
    justification,
  };
}

function getSituationTypeLabel(type: SituationType): string {
  const labels = {
    conflict: 'Conflito/clima',
    misconduct: 'Conduta inadequada',
    moral_harassment: 'Assédio moral',
    discrimination: 'Discriminação',
    sexual_harassment: 'Assédio sexual',
    threat_violence: 'Ameaça/violência',
    fraud: 'Fraude/irregularidade',
    other: 'Outro',
  };
  return labels[type] || 'Desconhecido';
}

function getAffectedScopeLabel(scope: string): string {
  const labels: Record<string, string> = {
    individual: 'individual',
    team: 'equipe',
    department: 'área',
    company: 'empresa',
  };
  return labels[scope] || scope;
}

function getRecurrenceLabel(recurrence: string): string {
  const labels: Record<string, string> = {
    first_time: 'primeira vez',
    occurred_before: 'já ocorreu',
    frequent: 'frequente',
  };
  return labels[recurrence] || recurrence;
}

function getRiskLevelLabel(level: RiskLevel): string {
  const labels = {
    low: 'Baixo',
    moderate: 'Moderado',
    high: 'Alto',
    critical: 'Crítico',
  };
  return labels[level] || level;
}