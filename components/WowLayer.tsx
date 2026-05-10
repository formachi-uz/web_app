'use client'

import { useEffect, useState } from 'react'

type GoalBurst = {
  id: number
  title: string
  subtitle: string
}

export default function WowLayer() {
  const [burst, setBurst] = useState<GoalBurst | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null

    const onGoal = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; subtitle?: string }>).detail || {}
      if (timeout) clearTimeout(timeout)

      setBurst({
        id: Date.now(),
        title: detail.title || 'GOOOL!',
        subtitle: detail.subtitle || "Mahsulot savatga qo'shildi",
      })

      timeout = setTimeout(() => setBurst(null), 1550)
    }

    window.addEventListener('formachi:goal', onGoal)
    return () => {
      window.removeEventListener('formachi:goal', onGoal)
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  if (!burst) return null

  return (
    <div className="goal-burst" aria-live="polite" aria-atomic="true">
      <div className="goal-burst-lights" />
      <div className="goal-burst-card" key={burst.id}>
        <span>FORMACHI</span>
        <strong>{burst.title}</strong>
        <small>{burst.subtitle}</small>
      </div>
    </div>
  )
}
