'use client'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/db'
import { ShoppingCart, Zap, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

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
  const totalStock = availableStocks.reduce((sum, stock) => sum + stock.quantity, 0)
  const stockLabel = totalStock === 0 ? 'Tugagan' : totalStock <= 3 ? `Kam qoldi: ${totalStock} ta` : `Sotuvda: ${totalStock} ta`

  useEffect(() => {
    trackEvent('product_view', {
      product_id: product.id,
      category_id: product.category_id,
      price: Math.round(product.final_price),
    })
  }, [product.id, product.category_id, product.final_price])

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
    trackEvent(goCheckout ? 'buy_now' : 'add_to_cart', {
      product_id: product.id,
      category_id: product.category_id,
      size: selectedSize,
      back_print: Boolean(backPrint),
      price: Math.round(price),
    })

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
      const drawer = document.getElementById('cart-drawer')
      if (drawer) drawer.style.transform = 'translateX(0)'
    }
  }

  return (
    <div>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <Link href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', textDecoration: 'none', fontSize: 13,
          }}>
            <ChevronLeft size={16} /> Katalogga qaytish
          </Link>
        </div>
      </div>

      <div className="container product-detail-container">
        <div className="product-detail-grid">
          <div>
            <div className="product-image-frame" style={{
              aspectRatio: '1', borderRadius: 16, overflow: 'hidden', background: 'var(--surface)',
              border: '1px solid var(--border)', position: 'relative',
            }}>
              {product.photo_url ? (
                <img
                  src={`/api/photo?file_id=${product.photo_url}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 80, color: 'var(--muted)' }}>⚽</div>
              )}
              {hasDiscount && (
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--danger)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 6 }}>
                  -{Math.round(product.discount_percent)}%
                </div>
              )}
              <div className={totalStock <= 3 ? 'product-stock-badge product-stock-low' : 'product-stock-badge'}>
                {stockLabel}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {product.category_emoji} {product.category_name}
            </div>
            <h1 className="product-title" style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1, lineHeight: 1, marginBottom: 16 }}>
              {product.name}
            </h1>

            {product.review_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div className="stars">{'★'.repeat(Math.round(product.avg_rating)) + '☆'.repeat(5 - Math.round(product.avg_rating))}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {product.avg_rating.toFixed(1)} ({product.review_count} ta sharh)
                </span>
              </div>
            )}

            <div className="price-box" style={{ marginBottom: 28, padding: '20px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
              {hasDiscount && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--muted)', textDecoration: 'line-through', marginBottom: 4 }}>
                  {product.price.toLocaleString()} so'm
                </div>
              )}
              <div className="product-price" style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--accent)', letterSpacing: 1 }}>
                {Math.round(product.final_price).toLocaleString()}
                <span style={{ fontSize: 18, fontFamily: 'var(--font-mono)', marginLeft: 8 }}>so'm</span>
              </div>
              {isForma && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>+ ism yozish: 50,000 so'm (ixtiyoriy)</div>}
              {availableStocks.length > 0 && (
                <div className="detail-size-strip">
                  {availableStocks.map((stock) => <span key={stock.size}>{stock.size} · {stock.quantity} ta</span>)}
                </div>
              )}
            </div>

            {product.description && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>{product.description}</p>}

            {availableStocks.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>O'lchamni tanlang</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.stocks.map((stock) => {
                    const isOut = stock.quantity === 0
                    const isLow = stock.quantity > 0 && stock.quantity <= 2
                    const isSel = selectedSize === stock.size
                    return (
                      <button
                        key={stock.size}
                        disabled={isOut}
                        onClick={() => setSelectedSize(stock.size)}
                        style={{
                          padding: '10px 18px', borderRadius: 8,
                          border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                          background: isSel ? 'rgba(0,229,160,0.1)' : 'var(--surface2)',
                          color: isOut ? 'var(--muted)' : isSel ? 'var(--accent)' : 'var(--text)',
                          cursor: isOut ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)',
                          fontSize: 13, fontWeight: 600, opacity: isOut ? 0.4 : 1, position: 'relative',
                        }}
                      >
                        {stock.size}
                        {isLow && !isOut && <span style={{ position: 'absolute', top: -6, right: -6, background: '#ffa502', color: '#000', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>⚠️</span>}
                        {isOut && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: 0.3 }}>✕</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {isForma && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>✍️ Forma orqasiga ism yozish (+50,000 so'm)</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[
                    { val: false, label: "Yo'q, kerak emas" },
                    { val: true, label: 'Ha, yozdiraman' },
                  ].map((opt) => (
                    <button key={String(opt.val)} onClick={() => setBackPrint(opt.val)} style={{
                      flex: 1, padding: '10px 16px', borderRadius: 8,
                      border: `1px solid ${backPrint === opt.val ? 'var(--accent)' : 'var(--border)'}`,
                      background: backPrint === opt.val ? 'rgba(0,229,160,0.1)' : 'var(--surface2)',
                      color: backPrint === opt.val ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}>{opt.label}</button>
                  ))}
                </div>
                {backPrint && (
                  <input className="input" placeholder="Masalan: HUSANOV 45" value={printName} onChange={(event) => setPrintName(event.target.value.toUpperCase())} maxLength={25} style={{ letterSpacing: 2, fontFamily: 'var(--font-mono)' }} />
                )}
              </div>
            )}

            <div className="product-actions">
              <button className="btn btn-primary" style={{ flex: 1, fontSize: 14 }} onClick={() => handleAddToCart(false)}>
                {added ? '✅ Qo\'shildi!' : <><ShoppingCart size={16} /> Savatga</>}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, fontSize: 14 }} onClick={() => handleAddToCart(true)}>
                <Zap size={16} /> Tezkor buyurtma
              </button>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🚚', text: 'BTS pochta orqali 1-3 kun' },
                  { icon: '📦', text: 'Yetkazish: 20,000 - 30,000 so\'m' },
                  { icon: '✅', text: 'Sifat kafolati' },
                ].map((item) => (
                  <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--muted)' }}>
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
