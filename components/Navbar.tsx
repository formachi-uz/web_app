'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useState } from 'react'

export default function Navbar() {
  const count = useCart((s) => s.count())
  const [open, setOpen] = useState(false)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(7,7,9,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      height: '70px',
    }}>
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 20, color: '#000',
            fontWeight: 700,
          }}>F</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--text)' }}>
            FORMACHI
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden md:flex">
          {[
            { href: '/', label: 'Bosh sahifa' },
            { href: '/catalog', label: 'Katalog' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{
              color: 'var(--muted)', textDecoration: 'none',
              fontSize: 13, fontWeight: 500, letterSpacing: 0.5,
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Cart + Telegram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="https://t.me/Formachi_uzBot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 12 }}
          >
            ⚡ Bot orqali buyurtma
          </a>

          <button
            id="cart-toggle"
            style={{
              position: 'relative',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8, width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text)',
              transition: 'border-color 0.15s',
            }}
            onClick={() => {
              const drawer = document.getElementById('cart-drawer')
              if (drawer) drawer.style.transform = 'translateX(0)'
            }}
          >
            <ShoppingCart size={18} />
            {count > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--accent)', color: '#000',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
              }}>{count}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
