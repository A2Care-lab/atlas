import { useEffect, useRef, useState } from 'react'

export default function ChartContainer({ className = '', children }: { className?: string, children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      const r = el.getBoundingClientRect()
      setReady(r.width > 0 && r.height > 0)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={ref} className={`min-w-0 min-h-0 ${className}`}>
      {ready ? children : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse text-xs text-gray-400">Carregando…</div>
        </div>
      )}
    </div>
  )
}

