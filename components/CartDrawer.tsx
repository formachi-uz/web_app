'use client'
import { useCart } from '@/lib/cart'
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, count } = useCart()

  const close = () => {
    const drawer = document.getElementById('cart-drawer')
    if (drawer) drawer.style.transform = 'translateX(100%)'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        id="cart-backdrop"
        onClick={close}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 199, opacity: 0, pointerEvents: 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer */}
      <div
        id="cart-drawer"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 400,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          zIndex: 200,
          transform: 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={18} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 1 }}>
              SAVAT
            </span>
            {count() > 0 && (
              <span style={{
                background: 'var(--accent)', color: '#000',
                borderRadius: 20, padding: '2px 8px',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              }}>{count()} ta</span>
            )}
          </div>
          <button onClick={close} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>
                SAVAT BO'SH
              </div>
              <div style={{ fontSize: 13 }}>Katalogdan mahsulot tanlang</div>
              <Link href="/catalog" onClick={close}
                className="btn btn-primary"
                style={{ marginTop: 24, display: 'inline-flex' }}
              >
                Katalogga o'tish
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: 16,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                      {item.size && `O'lcham: ${item.size}`}
                      {item.back_print && ` | ✍️ ${item.back_print}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--accent)' }}>
                        {(item.price * item.qty).toLocaleString()} so'm
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => updateQty(i, item.qty - 1)} style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          cursor: 'pointer', color: 'var(--text)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Minus size={12} /></button>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 20, textAlign: 'center' }}>
                          {item.qty}
                        </span>
                        <button onClick={() => updateQty(i, item.qty + 1)} style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          cursor: 'pointer', color: 'var(--text)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(i)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', padding: 4,
                    transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: 24,
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 16,
            }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Jami:</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>
                {total().toLocaleString()} so'm
              </span>
            </div>
            <Link href="/checkout" onClick={close} className="btn btn-primary" style={{ width: '100%' }}>
              Buyurtma berish →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
