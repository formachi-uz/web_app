'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Product } from '@/lib/db'
import ProductCard from '@/components/ProductCard'

export default function HomeCategoryProductSection({
  title,
  text,
  href,
  products,
}: {
  title: string
  text: string
  href: string
  products: Product[]
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleProducts = expanded ? products.slice(0, 12) : products.slice(0, 10)

  return (
    <div className={expanded ? 'category-product-section is-expanded' : 'category-product-section'}>
      <div className="category-product-head">
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
        <div className="category-product-actions">
          {products.length > 2 && (
            <button
              type="button"
              className="category-toggle-btn"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {expanded ? 'Yopish' : "To'liq ko'rish"}
            </button>
          )}
          <Link href={href}>Katalog</Link>
        </div>
      </div>
      {visibleProducts.length > 0 ? (
        <div className="category-product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={`${title}-${product.id}`} product={product} />
          ))}
        </div>
      ) : (
        <div className="category-empty">Bu bo'limga mahsulot qo'shilganda shu yerda ko'rinadi.</div>
      )}
    </div>
  )
}
