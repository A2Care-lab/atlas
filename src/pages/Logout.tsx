import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Logout() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return

    const run = async () => {
      try {
        if (!user) {
          try { window.location.replace('#/login') } catch {}
          navigate('/login', { replace: true })
          return
        }

        await signOut()
      } catch (_) {
        // ignore
      } finally {
        try { window.location.replace('#/login') } catch {}
        navigate('/login', { replace: true })
        try { setTimeout(() => window.location.reload(), 50) } catch {}
      }
    }

    // Fallback de segurança caso algo demore
    const t = setTimeout(() => {
      try { window.location.replace('#/login') } catch {}
      navigate('/login', { replace: true })
    }, 3000)
    run()
    return () => clearTimeout(t)
  }, [navigate, signOut, user, loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-700">Saindo...</p>
      </div>
    </div>
  )
}
