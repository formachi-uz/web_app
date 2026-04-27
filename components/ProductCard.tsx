'use client'

import Link from 'next/link'
import { Product } from '@/lib/db' // Ensure Product type here is updated with `is_customizable`
import { ShoppingBag } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export default function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discount_percent > 0
  const totalStock = product.stocks.reduce((s, st) => s + st.quantity, 0)
  const stockStatus = totalStock === 0 ? 'out' : totalStock <= 3 ? 'low' : 'ok'
  const availableSizes = product.stocks.filter((stock) => stock.quantity > 0).map((stock) => stock.size)

  return (
    <Link
      href={`/product/${product.id}`}
      className="shop-product-card flex flex-col relative rounded-xl bg-surface border border-border overflow-hidden hover:border-accent transition-all group"
      onClick={() =>
        trackEvent('product_click', {
          product_id: product.id,
          category_id: product.category_id,
          price: Math.round(product.final_price),
        })
      }
    >
      <div className="relative aspect-[4/5] bg-surface2 overflow-hidden flex items-center justify-center p-4">
        {product.photo_url ? (
          <img
            src={`/api/photo?file_id=${product.photo_url}`}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="text-muted font-bold text-xl tracking-widest">FORMACHI</div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-danger text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded">
              -{Math.round(product.discount_percent)}%
            </span>
          )}
          {stockStatus === 'low' && (
            <span className="bg-warning text-black text-[10px] md:text-xs font-bold px-2 py-1 rounded">
              Kam qoldi
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-grow p-3 md:p-4">
        <div className="text-[10px] md:text-xs text-accent mb-1 uppercase tracking-wider">
          {product.category_name}
        </div>
        <h3 className="text-sm md:text-base font-medium text-white line-clamp-2 mb-2 leading-tight">
          {product.name}
        </h3>

        {/* Conditional Customization Label */}
        {product.is_customizable && (
          <div className="mb-2 inline-block border border-accent/30 text-accent text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-md">
            + Ism va raqam yozish
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-border flex items-end justify-between">
          <div className="flex flex-col">
            {hasDiscount && <del className="text-[10px] text-gray-500">{product.price.toLocaleString()} so'm</del>}
            <strong className="text-sm md:text-lg text-white">
              {Math.round(product.final_price).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">so'm</span>
            </strong>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-gray-400 group-hover:bg-accent group-hover:text-black transition-colors">
            <ShoppingBag size={14} />
          </div>
        </div>
      </div>
    </Link>
  )
}
