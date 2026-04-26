'use client'
import Link from 'next/link'
import { Product } from '@/lib/db'
import { ShoppingCart } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discount_percent > 0
  const totalStock = product.stocks.reduce((s, st) => s + st.quantity, 0)
  const stockStatus = totalStock === 0 ? 'out' : totalStock <= 3 ? 'low' : 'ok'
  const availableSizes = product.stocks.filter((stock) => stock.quantity > 0).map((stock) => stock.size)

  return (
    <Link
      href={`/product/${product.id}`}
      style={{ textDecoration: 'none' }}
      onClick={() => trackEvent('product_click', {
        product_id: product.id,
        category_id: product.category_id,
        price: Math.round(product.final_price),
      })}
    >
      <div className="card product-card" style={{ cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--surface2)' }}>
          {product.photo_url ? (
            <img
              src={`/api/photo?file_id=${product.photo_url}`}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
              onError={(event) => { event.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--muted)',
            }}>⚽</div>
          )}

          {hasDiscount && (
            <div style={{
              position: 'absolute', top: 12, left: 12, background: 'var(--danger)', color: '#fff',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
            }}>
              -{Math.round(product.discount_percent)}%
            </div>
          )}

          {stockStatus === 'out' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(7,7,9,0.7)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)',
              fontSize: 20, color: 'var(--danger)', letterSpacing: 2,
            }}>TUGADI</div>
          )}
          {stockStatus === 'low' && <div className="stock-pill stock-pill-low">Kam qoldi: {totalStock} ta</div>}
          {stockStatus === 'ok' && availableSizes.length > 0 && (
            <div className="stock-pill">Bor: {availableSizes.slice(0, 4).join(', ')}</div>
          )}
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
              color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4,
            }}>
              {product.category_emoji} {product.category_name}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 8 }}>
              {product.name}
            </h3>
          </div>

          {product.review_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="stars" style={{ fontSize: 12 }}>
                {'★'.repeat(Math.round(product.avg_rating))}
                {'☆'.repeat(5 - Math.round(product.avg_rating))}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                ({product.review_count})
              </span>
            </div>
          )}

          {availableSizes.length > 0 && (
            <div className="card-size-row">
              {availableSizes.slice(0, 5).map((size) => <span key={size}>{size}</span>)}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {hasDiscount && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through', marginBottom: 2 }}>
                  {product.price.toLocaleString()} so'm
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: hasDiscount ? 'var(--accent)' : 'var(--text)', letterSpacing: 1 }}>
                {Math.round(product.final_price).toLocaleString()}
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginLeft: 4 }}>so'm</span>
              </div>
            </div>
            <div style={{
              width: 36, height: 36, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
            }}>
              <ShoppingCart size={15} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
