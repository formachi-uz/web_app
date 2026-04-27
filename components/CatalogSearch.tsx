'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/lib/db'
import { trackEvent } from '@/lib/analytics'

export default function CatalogSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = normalize(query)

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products
    return products.filter((product) => {
      const sizes = product.stocks.map((stock) => stock.size).join(' ')
      const haystack = normalize([
        product.name,
        product.description || '',
        product.category_name || '',
        sizes,
        String(Math.round(product.final_price)),
      ].join(' '))

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
            placeholder="Forma, klub, o'lcham yoki narx bo'yicha qidirish"
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
          <div>🔎</div>
          <strong>Mahsulot topilmadi</strong>
          <span>Boshqa nom, klub yoki o'lcham bilan qidirib ko'ring</span>
        </div>
      ) : (
        <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <style jsx>{`
        .catalog-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .catalog-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 52px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0 14px;
          color: var(--muted);
        }
        .catalog-search:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px rgba(0,229,160,0.1);
        }
        .catalog-search input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 14px;
        }
        .catalog-search input::placeholder { color: var(--muted); }
        .catalog-search button {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 8px;
          background: var(--surface2);
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .catalog-count {
          min-width: 74px;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          color: var(--muted);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .catalog-empty {
          text-align: center;
          padding: 80px 0;
          color: var(--muted);
        }
        .catalog-empty div { font-size: 48px; margin-bottom: 16px; }
        .catalog-empty strong {
          display: block;
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text);
          margin-bottom: 8px;
        }
        .catalog-empty span { font-size: 13px; }

        @media (max-width: 720px) {
          .catalog-toolbar {
            flex-direction: column;
            align-items: stretch;
            margin-bottom: 18px;
          }
          .catalog-search {
            min-height: 50px;
          }
          .catalog-search input {
            font-size: 13px;
          }
          .catalog-count {
            width: fit-content;
            min-height: 34px;
            padding: 0 12px;
          }
          .catalog-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .catalog-empty {
            padding: 56px 0;
          }
        }
      `}</style>
    </div>
  )
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
