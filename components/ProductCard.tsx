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
      className="shop-product-card"
      onClick={() => trackEvent('product_click', {
        product_id: product.id,
        category_id: product.category_id,
        price: Math.round(product.final_price),
      })}
    >
      <div className="shop-product-image">
        {product.photo_url ? (
          <img
            src={`/api/photo?file_id=${product.photo_url}`}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="shop-product-placeholder">FORMACHI</div>
        )}

        {hasDiscount && <span className="shop-badge shop-badge-sale">-{Math.round(product.discount_percent)}%</span>}
        {stockStatus === 'low' && <span className="shop-badge shop-badge-low">Kam qoldi</span>}
        {stockStatus === 'out' && <div className="shop-out">TUGADI</div>}
      </div>

      <div className="shop-product-body">
        <div className="shop-product-category">{product.category_emoji} {product.category_name}</div>
        <h3>{product.name}</h3>

        <div className="shop-rating">
          <span className="stars">{'★'.repeat(Math.max(1, Math.round(product.avg_rating || 5)))}</span>
          <small>{product.review_count > 0 ? `${product.review_count} sharh` : 'Sotuvda mavjud'}</small>
        </div>

        {availableSizes.length > 0 && (
          <div className="card-size-row">
            {availableSizes.slice(0, 5).map((size) => <span key={size}>{size}</span>)}
          </div>
        )}

        <div className="shop-product-footer">
          <div>
            {hasDiscount && <del>{product.price.toLocaleString()} so'm</del>}
            <strong>{Math.round(product.final_price).toLocaleString()} <span>so'm</span></strong>
          </div>
          <span className="shop-cart-icon"><ShoppingCart size={17} /></span>
        </div>
      </div>
    </Link>
  )
}
