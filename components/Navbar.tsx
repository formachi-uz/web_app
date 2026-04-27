'use client'

import Link from 'next/link'
import { MapPin, Menu, Phone, Search, ShoppingCart, Zap } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function Navbar() {
  const count = useCart((s) => s.count())

  return (
    <nav className="site-nav">
      <div className="site-topbar">
        <div className="container site-topbar-inner">
          <a href="tel:+998931071308"><Phone size={14} /> +998 93 107 13 08</a>
          <span><MapPin size={14} /> Toshkent, Uchtepa outlet center B157</span>
          <a href="https://t.me/formachi_admin" target="_blank" rel="noopener noreferrer">Admin bilan bog'lanish</a>
        </div>
      </div>

      <div className="site-mainbar">
        <div className="container nav-inner">
          <Link href="/" className="brand-link">
            <img
              src="/logo.png"
              alt="Formachi"
              className="brand-logo"
              onError={(event) => {
                event.currentTarget.src = '/formachi-logo.svg'
              }}
            />
            <span className="brand-word">FORMACHI</span>
          </Link>

          <Link href="/catalog" className="nav-category">
            <Menu size={18} />
            Barcha kategoriyalar
          </Link>

          <Link href="/catalog" className="nav-search">
            <Search size={18} />
            <span>Forma, butsa yoki klub nomini qidirish</span>
          </Link>

          <div className="nav-links">
            <Link href="/">Bosh sahifa</Link>
            <Link href="/catalog">Katalog</Link>
          </div>

          <div className="nav-actions">
            <a
              href="https://t.me/Formachi_uzBot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary nav-bot-btn"
            >
              <Zap size={15} /> Bot orqali buyurtma
            </a>

            <button
              id="cart-toggle"
              className="cart-button"
              onClick={() => {
                const drawer = document.getElementById('cart-drawer')
                if (drawer) drawer.style.transform = 'translateX(0)'
              }}
            >
              <ShoppingCart size={19} />
              {count > 0 && <span>{count}</span>}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
