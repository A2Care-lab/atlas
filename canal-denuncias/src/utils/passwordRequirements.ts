export const MIN_PASSWORD_LENGTH = 6

export type PasswordRequirementStatus = {
  minLength: boolean
  hasLowercase: boolean
  hasUppercase: boolean
  hasNumber: boolean
  hasSymbol: boolean
}

export const evaluatePasswordRequirements = (password: string): PasswordRequirementStatus => ({
  minLength: password.length >= MIN_PASSWORD_LENGTH,
  hasLowercase: /[a-z]/.test(password),
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSymbol: /[^A-Za-z0-9]/.test(password),
})

export const isPasswordStrong = (password: string) => {
  const requirements = evaluatePasswordRequirements(password)
  return Object.values(requirements).every(Boolean)
}

export const getPasswordStrength = (password: string) => {
  const requirements = evaluatePasswordRequirements(password)
  const fulfilled = Object.values(requirements).filter(Boolean).length

  return {
    requirements,
    fulfilled,
    percentage: (fulfilled / Object.keys(requirements).length) * 100,
  }
}
