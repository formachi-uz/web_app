'use client'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function Navbar() {
  const count = useCart((s) => s.count())

  return (
    <nav className="site-nav">
      <div className="container nav-inner">
        <Link href="/" className="brand-link">
          <img src="/formachi-logo.svg" alt="Formachi" className="brand-logo" />
          <span className="brand-word">
            FORMACHI
          </span>
        </Link>

        <div className="nav-links">
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

        <div className="nav-actions">
          <a
            href="https://t.me/Formachi_uzBot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: 12 }}
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
