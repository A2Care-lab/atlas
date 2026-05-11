export function formatCNPJ(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return value || '';
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function formatDate(value?: string | number | Date): string {
  if (!value) return ''
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return ''
  }
}
