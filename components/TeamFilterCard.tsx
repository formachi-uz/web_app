'use client'

import { useState } from 'react'
import Link from 'next/link'

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
    <Link href={href} className={active ? 'quick-team active' : 'quick-team'}>
      <span className="quick-team-logo">
        {!failed ? <img src={logo} alt={name} onError={() => setFailed(true)} /> : <b>{initials || 'FM'}</b>}
      </span>
      <strong>{name}</strong>
    </Link>
  )
}
