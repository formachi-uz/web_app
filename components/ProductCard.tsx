'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingBag, ShoppingCart, X } from 'lucide-react'
import { Product } from '@/lib/db'
import { useCart } from '@/lib/cart'
import { trackEvent } from '@/lib/analytics'

export default function ProductCard({ product }: { product: Product }) {
  const [quickOpen, setQuickOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [imageFailed, setImageFailed] = useState(false)
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

  const hasDiscount = product.discount_percent > 0
  const stocks = product.stocks ?? []
  const availableStocks = stocks.filter((stock) => (stock.available ?? stock.quantity) > 0)
  const totalStock = availableStocks.reduce((sum, stock) => sum + (stock.available ?? stock.quantity), 0)
  const stockStatus = totalStock === 0 ? 'out' : totalStock <= 3 ? 'low' : 'ok'
  const availableSizes = availableStocks.map((stock) => stock.size)
  const rating = Math.max(1, Math.round(product.avg_rating || 5))
  const imageSrc = toPhotoSrc(product.photo_url)
  const showImage = Boolean(imageSrc && !imageFailed)
  const selectedStock = selectedSize ? availableStocks.find((stock) => stock.size === selectedSize) : availableStocks[0]
  const maxQty = Math.max(1, selectedStock ? (selectedStock.available ?? selectedStock.quantity) : totalStock || 1)

  const openCart = () => {
    const drawer = document.getElementById('cart-drawer')
    const backdrop = document.getElementById('cart-backdrop')
    if (drawer) drawer.style.transform = 'translateX(0)'
    if (backdrop) {
      backdrop.style.opacity = '1'
      backdrop.style.pointerEvents = 'auto'
    }
  }

  const openQuickOrder = () => {
    if (stockStatus === 'out') return
    setSelectedSize(availableSizes[0] ?? null)
    setQty(1)
    setQuickOpen(true)
    trackEvent('quick_order_open', { product_id: product.id, category_id: product.category_id })
  }

  const addToCart = (checkout = false) => {
    const size = selectedSize || availableSizes[0] || null
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.final_price,
      qty,
      size,
      back_print: null,
      photo_url: product.photo_url,
    })
    trackEvent(checkout ? 'quick_buy_now' : 'quick_add_to_cart', {
      product_id: product.id,
      category_id: product.category_id,
      size,
      qty,
      price: Math.round(product.final_price),
    })
    setQuickOpen(false)
    if (checkout) router.push('/checkout')
    else openCart()
  }

  return (
    <article className="shop-product-card">
      <Link
        href={`/product/${product.id}`}
        className="shop-product-link"
        onClick={() =>
          trackEvent('product_click', {
            product_id: product.id,
            category_id: product.category_id,
            price: Math.round(product.final_price),
          })
        }
      >
        <div className="shop-product-image">
          {showImage ? (
            <img
              src={imageSrc as string}
              alt={product.name}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="shop-product-placeholder">FORMACHI</div>
          )}

          {stockStatus === 'ok' && <span className="shop-stock-pill">Sotuvda bor</span>}
          {stockStatus === 'low' && <span className="shop-stock-pill shop-stock-pill-low">Kam qoldi</span>}
          {hasDiscount && <span className="shop-badge shop-badge-sale">-{Math.round(product.discount_percent)}%</span>}
          {stockStatus === 'out' && <div className="shop-out">TUGADI</div>}
        </div>

        <div className="shop-product-body">
          <div className="shop-product-category">
            {product.category_emoji} {product.category_name}
          </div>
          <h3>{product.name}</h3>

          <div className="shop-rating">
            <span className="stars" aria-label={`${rating} yulduz`}>
              {Array.from({ length: rating }).map((_, index) => (
                <span key={index}>&#9733;</span>
              ))}
            </span>
            <small>{product.review_count > 0 ? `${product.review_count} sharh` : 'Premium tanlov'}</small>
          </div>

          {availableSizes.length > 0 && (
            <div className="card-size-row">
              {availableSizes.slice(0, 6).map((size) => (
                <span key={size}>{size}</span>
              ))}
            </div>
          )}

          <div className="shop-product-footer">
            <div>
              {hasDiscount && <del>{product.price.toLocaleString()} so'm</del>}
              <strong>
                {Math.round(product.final_price).toLocaleString()} <span>so'm</span>
              </strong>
            </div>
          </div>
        </div>
      </Link>

      <div className="shop-card-action">
        <button type="button" className="shop-order-btn" onClick={openQuickOrder} disabled={stockStatus === 'out'}>
          <ShoppingBag size={17} />
          Buyurtma berish
        </button>
      </div>

      {quickOpen && (
        <div className="quick-order-backdrop" role="dialog" aria-modal="true">
          <button className="quick-order-dim" type="button" onClick={() => setQuickOpen(false)} aria-label="Yopish" />
          <div className="quick-order-sheet">
            <div className="quick-order-head">
              <div>
                <span>Tez buyurtma</span>
                <strong>{product.name}</strong>
              </div>
              <button type="button" onClick={() => setQuickOpen(false)} aria-label="Yopish">
                <X size={18} />
              </button>
            </div>

            <div className="quick-order-info">
              <div className="quick-order-thumb">
                {showImage ? <img src={imageSrc as string} alt={product.name} /> : <span>FM</span>}
              </div>
              <div>
                <small>{product.category_name}</small>
                <strong>{Math.round(product.final_price).toLocaleString()} so'm</strong>
                <p>Ism va raqam yozish kerak bo'lsa, mahsulot sahifasida tanlang.</p>
              </div>
            </div>

            {availableSizes.length > 0 && (
              <div className="quick-order-block">
                <span>O'lcham</span>
                <div className="quick-size-row">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={selectedSize === size ? 'active' : ''}
                      onClick={() => {
                        setSelectedSize(size)
                        setQty(1)
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="quick-order-block">
              <span>Miqdor</span>
              <div className="quick-qty">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} disabled={qty <= 1}>
                  <Minus size={15} />
                </button>
                <strong>{qty}</strong>
                <button type="button" onClick={() => setQty((value) => Math.min(maxQty, value + 1))} disabled={qty >= maxQty}>
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="quick-order-actions">
              <button type="button" className="btn btn-secondary" onClick={() => addToCart(false)}>
                <ShoppingCart size={16} /> Savatga
              </button>
              <button type="button" className="btn btn-primary" onClick={() => addToCart(true)}>
                Hozir buyurtma
              </button>
            </div>

            <Link href={`/product/${product.id}`} className="quick-detail-link">
              Batafsil ko'rish va ism yozish
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}

function toPhotoSrc(photoUrl?: string | null) {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/')) return photoUrl
  return `/api/photo?file_id=${encodeURIComponent(photoUrl)}`
}
