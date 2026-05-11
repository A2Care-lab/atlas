import { CheckCircle, Circle } from 'lucide-react'
import { evaluatePasswordRequirements, MIN_PASSWORD_LENGTH } from '../utils/passwordRequirements'

type PasswordRequirementsProps = {
  password: string
  variant?: 'dark' | 'light'
  className?: string
}

export default function PasswordRequirements({
  password,
  variant = 'dark',
  className = '',
}: PasswordRequirementsProps) {
  const requirements = evaluatePasswordRequirements(password)
  const items = [
    {
      label: `Minimo ${MIN_PASSWORD_LENGTH} caracteres`,
      fulfilled: requirements.minLength,
    },
    {
      label: 'Uma letra minuscula',
      fulfilled: requirements.hasLowercase,
    },
    {
      label: 'Uma letra maiuscula',
      fulfilled: requirements.hasUppercase,
    },
    {
      label: 'Um numero',
      fulfilled: requirements.hasNumber,
    },
    {
      label: 'Um simbolo',
      fulfilled: requirements.hasSymbol,
    },
  ]

  const fulfilledCount = items.filter((item) => item.fulfilled).length
  const pendingTextClass = variant === 'light' ? 'text-gray-500' : 'text-gray-400'
  const pendingIconClass = variant === 'light' ? 'text-gray-300' : 'text-gray-600'
  const wrapperClass =
    variant === 'light'
      ? 'rounded-xl border border-gray-200 bg-gray-50/80 p-3'
      : 'rounded-xl border border-white/10 bg-white/5 p-3'
  const badgeClass =
    fulfilledCount === items.length
      ? 'bg-green-500/15 text-green-500 border-green-500/30'
      : variant === 'light'
        ? 'bg-white text-gray-600 border-gray-200'
        : 'bg-gray-900/70 text-gray-300 border-white/10'

  return (
    <div className={`${wrapperClass} ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-medium ${variant === 'light' ? 'text-gray-700' : 'text-gray-200'}`}>
          Sua senha precisa conter:
        </p>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors ${badgeClass}`}>
          {fulfilledCount}/{items.length} concluidos
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all duration-200 ${
              item.fulfilled
                ? 'border-green-500/30 bg-green-500/10 text-green-500 shadow-sm shadow-green-500/10'
                : variant === 'light'
                  ? `border-gray-200 bg-white ${pendingTextClass}`
                  : `border-white/10 bg-gray-900/30 ${pendingTextClass}`
            }`}
          >
            {item.fulfilled ? (
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Circle className={`h-3.5 w-3.5 shrink-0 ${pendingIconClass}`} />
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
