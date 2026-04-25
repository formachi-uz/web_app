'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      marginTop: 80,
    }}>
      <div className="container" style={{ padding: '48px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40,
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, letterSpacing: 3,
              color: 'var(--accent)', marginBottom: 12,
            }}>⚽ FORMACHI</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Sport kiyimlari do'koni.<br />
              Formalar, butsalar, retro kiyimlar.
            </p>
          </div>

          {/* Links */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: 3, color: 'var(--muted)',
              textTransform: 'uppercase', marginBottom: 16,
            }}>Sahifalar</div>
            {[
              { href: '/', label: 'Bosh sahifa' },
              { href: '/catalog', label: 'Katalog' },
              { href: '/cart', label: 'Savat' },
              { href: '/orders', label: 'Buyurtmalarim' },
            ].map((item) => (
              <div key={item.href} style={{ marginBottom: 8 }}>
                <Link href={item.href} style={{
                  color: 'var(--muted)', textDecoration: 'none',
                  fontSize: 13, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >{item.label}</Link>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: 3, color: 'var(--muted)',
              textTransform: 'uppercase', marginBottom: 16,
            }}>Aloqa</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://t.me/Formachi_uzBot" target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: 'var(--muted)', textDecoration: 'none', fontSize: 13,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                📱 Telegram bot
              </a>
              <a href="https://t.me/formachi_admin" target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: 'var(--muted)', textDecoration: 'none', fontSize: 13,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                💬 Admin bilan bog'lanish
              </a>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                📍 Toshkent, Uchtepa outlet center B157
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                ⏱️ 11:00 — 22:00
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            © 2024 Formachi.uz — Barcha huquqlar himoyalangan
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            🚚 BTS pochta orqali yetkazish
          </div>
        </div>
      </div>
    </footer>
  )
}
