'use client'

import Link from 'next/link'
import { Search, Send, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart'

const navItems = [
  { href: '/', label: 'Bosh sahifa' },
  { href: '/#catalog', label: "Katalogni ko'rish" },
  { href: '/#teams', label: 'Jamoalar' },
  { href: '/#boots', label: 'Butsiylar' },
  { href: '/#contact', label: 'Aloqa' },
]

export default function Navbar() {
  const count = useCart((s) => s.count())

  const openCart = () => {
    const drawer = document.getElementById('cart-drawer')
    const backdrop = document.getElementById('cart-backdrop')
    if (drawer) drawer.style.transform = 'translateX(0)'
    if (backdrop) {
      backdrop.style.opacity = '1'
      backdrop.style.pointerEvents = 'auto'
    }
  }

  return (
    <nav className="site-nav">
      <div className="container nav-inner">
        <Link href="/" className="brand-link" aria-label="FORMACHI bosh sahifa">
          <img
            src="/logo.png"
            alt="FORMACHI"
            className="brand-logo"
            onError={(event) => {
              event.currentTarget.src = '/formachi-logo.svg'
            }}
          />
          <span className="brand-word">FORMACHI</span>
        </Link>

        <div className="nav-links" aria-label="Asosiy navigatsiya">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <Link href="/catalog" className="nav-icon-btn" aria-label="Qidirish">
            <Search size={19} />
          </Link>

          <button id="cart-toggle" className="cart-button" onClick={openCart} aria-label="Savatni ochish">
            <ShoppingCart size={20} />
            {count > 0 && <span>{count}</span>}
          </button>

          <a
            href="https://t.me/Formachi_uzBot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-telegram nav-bot-btn"
          >
            <Send size={17} />
            <span>Telegram orqali buyurtma</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
