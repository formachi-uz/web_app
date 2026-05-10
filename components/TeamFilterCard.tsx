'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getTeamThemeStyle } from '@/lib/teamTheme'

export default function TeamFilterCard({
  name,
  logo,
  href,
  active,
}: {
  name: string
  logo: string
  href: string
  active: boolean
}) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <Link href={href} className={active ? 'quick-team active' : 'quick-team'} style={getTeamThemeStyle(name)}>
      <span className="quick-team-logo">
        {!failed ? <img src={logo} alt={name} onError={() => setFailed(true)} /> : <b>{initials || 'FM'}</b>}
      </span>
      <strong>{name}</strong>
    </Link>
  )
}
