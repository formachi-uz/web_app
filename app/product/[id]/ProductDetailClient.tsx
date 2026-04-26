'use client'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart'
import { Product, ProductStock } from '@/lib/db'
import { ShoppingCart, Zap, Star, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [backPrint, setBackPrint] = useState<boolean | null>(null)
  const [printName, setPrintName] = useState('')
  const [added, setAdded] = useState(false)
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

  const hasDiscount = product.discount_percent > 0
  const isForma = [1, 2].includes(product.category_id)
  const availableStocks = product.stocks.filter((s) => s.quantity > 0)

  const getStockForSize = (size: string): ProductStock | undefined =>
    product.stocks.find((s) => s.size === size)

  const handleAddToCart = (goCheckout = false) => {
    if (!selectedSize && availableStocks.length > 0) {
      alert("O'lchamni tanlang!")
      return
    }
    if (isForma && backPrint === null) {
      alert('Ism yozish haqida qaror qiling!')
      return
    }
    if (isForma && backPrint && !printName.trim()) {
      alert('Ism va raqamni kiriting!')
      return
    }

    const price = product.final_price + (isForma && backPrint ? 50000 : 0)
    addItem({
      product_id: product.id,
      name: product.name,
      price,
      qty: 1,
      size: selectedSize,
      back_print: backPrint ? printName.trim() : null,
      photo_url: product.photo_url,
    })

    if (goCheckout) {
      router.push('/checkout')
    } else {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      // Savatni ochish
      const drawer = document.getElementById('cart-drawer')
      if (drawer) drawer.style.transform = 'translateX(0)'
    }
  }

  return (
    <div>
      {/* Back */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <Link href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', textDecoration: 'none', fontSize: 13,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <ChevronLeft size={16} /> Katalogga qaytish
          </Link>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: 48, alignItems: 'start',
        }}>

          {/* ─── Rasm ─────────────────────────────────────────────────────── */}
          <div>
            <div style={{
              aspectRatio: '1', borderRadius: 16,
              overflow: 'hidden',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              position: 'relative',
            }}>
              {product.photo_url ? (
                <img
                  src={`/api/photo?file_id=${product.photo_url}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 80, color: 'var(--muted)',
                }}>⚽</div>
              )}
              {hasDiscount && (
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: 'var(--danger)', color: '#fff',
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                  padding: '4px 12px', borderRadius: 6,
                }}>
                  -{Math.round(product.discount_percent)}%
                </div>
              )}
            </div>
          </div>

          {/* ─── Info ─────────────────────────────────────────────────────── */}
          <div>
            {/* Category */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
              color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
            }}>
              {product.category_emoji} {product.category_name}
            </div>

            {/* Name */}
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 40,
              letterSpacing: 1, lineHeight: 1, marginBottom: 16,
            }}>{product.name}</h1>

            {/* Rating */}
            {product.review_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div className="stars">{
                  '★'.repeat(Math.round(product.avg_rating)) +
                  '☆'.repeat(5 - Math.round(product.avg_rating))
                }</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {product.avg_rating.toFixed(1)} ({product.review_count} ta sharh)
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: 28, padding: '20px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
              {hasDiscount && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14,
                  color: 'var(--muted)', textDecoration: 'line-through', marginBottom: 4,
                }}>
                  {product.price.toLocaleString()} so'm
                </div>
              )}
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 40,
                color: 'var(--accent)', letterSpacing: 1,
              }}>
                {Math.round(product.final_price).toLocaleString()}
                <span style={{ fontSize: 18, fontFamily: 'var(--font-mono)', marginLeft: 8 }}>so'm</span>
              </div>
              {isForma && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                  + ism yozish: 50,000 so'm (ixtiyoriy)
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{
                fontSize: 14, color: 'var(--muted)', lineHeight: 1.7,
                marginBottom: 28,
              }}>{product.description}</p>
            )}

            {/* Size selector */}
            {availableStocks.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                  color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12,
                }}>
                  O'lchamni tanlang
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.stocks.map((stock) => {
                    const isOut  = stock.quantity === 0
                    const isLow  = stock.quantity > 0 && stock.quantity <= 2
                    const isSel  = selectedSize === stock.size

                    return (
                      <button
                        key={stock.size}
                        disabled={isOut}
                        onClick={() => setSelectedSize(stock.size)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 8,
                          border: `1px solid ${isSel ? 'var(--accent)' : isOut ? 'var(--border)' : 'var(--border)'}`,
                          background: isSel ? 'rgba(0,229,160,0.1)' : 'var(--surface2)',
                          color: isOut ? 'var(--muted)' : isSel ? 'var(--accent)' : 'var(--text)',
                          cursor: isOut ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                          opacity: isOut ? 0.4 : 1,
                          transition: 'all 0.15s',
                          position: 'relative',
                        }}
                      >
                        {stock.size}
                        {isLow && !isOut && (
                          <span style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#ffa502', color: '#000',
                            fontSize: 9, fontWeight: 700,
                            padding: '1px 4px', borderRadius: 4,
                          }}>⚠️</span>
                        )}
                        {isOut && (
                          <span style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, opacity: 0.3,
                          }}>✕</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Orqa ism yozish */}
            {isForma && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                  color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12,
                }}>
                  ✍️ Forma orqasiga ism yozish (+50,000 so'm)
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[
                    { val: false, label: "Yo'q, kerak emas" },
                    { val: true,  label: "Ha, yozdiraman" },
                  ].map((opt) => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setBackPrint(opt.val)}
                      style={{
                        flex: 1, padding: '10px 16px', borderRadius: 8,
                        border: `1px solid ${backPrint === opt.val ? 'var(--accent)' : 'var(--border)'}`,
                        background: backPrint === opt.val ? 'rgba(0,229,160,0.1)' : 'var(--surface2)',
                        color: backPrint === opt.val ? 'var(--accent)' : 'var(--muted)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
                {backPrint && (
                  <input
                    className="input"
                    placeholder="Masalan: HUSANOV 45"
                    value={printName}
                    onChange={e => setPrintName(e.target.value.toUpperCase())}
                    maxLength={25}
                    style={{ letterSpacing: 2, fontFamily: 'var(--font-mono)' }}
                  />
                )}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, fontSize: 14 }}
                onClick={() => handleAddToCart(false)}
              >
                {added ? '✅ Qo\'shildi!' : (
                  <><ShoppingCart size={16} /> Savatga</>
                )}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 14 }}
                onClick={() => handleAddToCart(true)}
              >
                <Zap size={16} /> Tezkor buyurtma
              </button>
            </div>

            {/* Delivery info */}
            <div style={{
              marginTop: 24, padding: 16,
              background: 'var(--surface2)', borderRadius: 10,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🚚', text: 'BTS pochta orqali 1-3 kun' },
                  { icon: '📦', text: 'Yetkazish: 20,000 - 30,000 so\'m' },
                  { icon: '✅', text: 'Sifat kafolati' },
                ].map((item) => (
                  <div key={item.text} style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    fontSize: 12, color: 'var(--muted)',
                  }}>
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
