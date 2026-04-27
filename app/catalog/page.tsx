import { getCategories, getProducts } from '@/lib/db'
import CatalogSearch from '@/components/CatalogSearch'
import Link from 'next/link'

export const revalidate = 60

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string }
}) {
  const categoryId = searchParams.category ? parseInt(searchParams.category) : undefined
  const query = searchParams.q || ''
  const [categories, products] = await Promise.all([getCategories(), getProducts(categoryId)])

  const activeCategory = categories.find((c) => c.id === categoryId)

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="container">
          <span className="section-kicker">
            {activeCategory ? `${activeCategory.emoji} ${activeCategory.name}` : 'Barcha mahsulotlar'}
          </span>
          <h1>Katalog</h1>
          <p>
            {query ? `"${query}" bo'yicha ` : ''}
            {products.length} ta mahsulot
          </p>
        </div>
      </section>

      <section className="container catalog-shell">
        <div className="catalog-filter-row" aria-label="Katalog kategoriyalari">
          <Link href={query ? `/catalog?q=${encodeURIComponent(query)}` : '/catalog'} className={!categoryId ? 'active' : ''}>
            Barchasi
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={categoryId === cat.id ? 'active' : ''}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </Link>
          ))}
        </div>

        <CatalogSearch products={products} initialQuery={query} />
      </section>
    </div>
  )
}
