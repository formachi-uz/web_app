'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/lib/db'
import { trackEvent } from '@/lib/analytics'

export default function CatalogSearch({
  products,
  initialQuery = '',
}: {
  products: Product[]
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const normalizedQuery = normalize(query)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products
    return products.filter((product) => {
      const sizes = (product.stocks ?? []).map((stock) => stock.size).join(' ')
      const haystack = normalize(
        [
          product.name,
          product.description || '',
          product.category_name || '',
          product.team || '',
          product.brand || '',
          product.season || '',
          product.kit_type || '',
          sizes,
          String(Math.round(product.final_price)),
        ].join(' ')
      )

      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery, products])

  useEffect(() => {
    if (normalizedQuery.length < 2) return
    const timer = window.setTimeout(() => {
      trackEvent('product_search', {
        query: normalizedQuery,
        results: filteredProducts.length,
      })
    }, 500)
    return () => window.clearTimeout(timer)
  }, [filteredProducts.length, normalizedQuery])

  return (
    <div>
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Forma, klub, butsa yoki o'lcham bo'yicha qidirish"
            aria-label="Mahsulot qidirish"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Qidiruvni tozalash">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="catalog-count">
          {filteredProducts.length} / {products.length}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="catalog-empty">
          <div>FORMACHI</div>
          <strong>Mahsulot topilmadi</strong>
          <span>Boshqa klub, nom yoki o'lcham bilan qidirib ko'ring</span>
        </div>
      ) : (
        <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/['\u2019`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
