import type { UserRole } from '../types/database'

export function normalizeUserRole(role: string | null | undefined): string {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  }

export function isAdminRole(role: string | UserRole | null | undefined): boolean {
  const normalizedRole = normalizeUserRole(role)
  return normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === 'administrador'
}

export function isCorporateManagerRole(role: string | UserRole | null | undefined): boolean {
  const normalizedRole = normalizeUserRole(role)
  return normalizedRole === 'corporate_manager' || normalizedRole === 'approver_manager'
}
