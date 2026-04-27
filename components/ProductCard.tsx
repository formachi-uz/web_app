'use client'

import Link from 'next/link'
import { Product } from '@/lib/db'
import { ShoppingBag } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discount_percent > 0
  const stocks = product.stocks ?? []
  const totalStock = stocks.reduce((sum, stock) => sum + (stock.available ?? stock.quantity), 0)
  const stockStatus = totalStock === 0 ? 'out' : totalStock <= 3 ? 'low' : 'ok'
  const availableSizes = stocks
    .filter((stock) => (stock.available ?? stock.quantity) > 0)
    .map((stock) => stock.size)
  const rating = Math.max(1, Math.round(product.avg_rating || 5))
  const imageSrc = toPhotoSrc(product.photo_url)

  return (
    <Link
      href={`/product/${product.id}`}
      className="shop-product-card"
      onClick={() =>
        trackEvent('product_click', {
          product_id: product.id,
          category_id: product.category_id,
          price: Math.round(product.final_price),
        })
      }
    >
      <div className="shop-product-image">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="shop-product-placeholder">FORMACHI</div>
        )}

        {stockStatus !== 'out' && <span className="shop-stock-pill">Sotuvda bor</span>}
        {hasDiscount && <span className="shop-badge shop-badge-sale">-{Math.round(product.discount_percent)}%</span>}
        {stockStatus === 'low' && <span className="shop-badge shop-badge-low">Kam qoldi</span>}
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

        <span className="shop-order-btn">
          <ShoppingBag size={17} />
          Buyurtma berish
        </span>
      </div>
    </Link>
  )
}

function toPhotoSrc(photoUrl: string | null) {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/')) return photoUrl
  return `/api/photo?file_id=${encodeURIComponent(photoUrl)}`
}
