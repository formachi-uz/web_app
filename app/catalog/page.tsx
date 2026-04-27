import { getCategories, getProducts } from '@/lib/db'
import CatalogSearch from '@/components/CatalogSearch'
import Link from 'next/link'

export const revalidate = 60

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: {
    category?: string
    q?: string
    team?: string
    brand?: string
    mainCategory?: string
    productType?: string
    season?: string
    kitType?: string
  }
}) {
  const categoryId = searchParams.category ? Number(searchParams.category) : undefined
  const query = searchParams.q || ''
  const team = searchParams.team || ''
  const brand = searchParams.brand || ''
  const mainCategory = searchParams.mainCategory || ''
  const productType = searchParams.productType || ''
  const season = searchParams.season || ''
  const kitType = searchParams.kitType || ''

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categoryId,
      search: query,
      team,
      brand,
      mainCategory,
      productType,
      season,
      kitType,
    }),
  ])

  const activeCategory = categories.find((c) => c.id === categoryId)
  const titleLabel = activeCategory
    ? `${activeCategory.emoji} ${activeCategory.name}`
    : team
      ? `Jamoa: ${team}`
      : brand
        ? `Brend: ${brand}`
        : 'Barcha mahsulotlar'

  const preserveQuery = new URLSearchParams()
  if (query) preserveQuery.set('q', query)
  if (team) preserveQuery.set('team', team)
  if (brand) preserveQuery.set('brand', brand)
  if (mainCategory) preserveQuery.set('mainCategory', mainCategory)
  if (productType) preserveQuery.set('productType', productType)
  if (season) preserveQuery.set('season', season)
  if (kitType) preserveQuery.set('kitType', kitType)

  const makeCategoryHref = (id?: number) => {
    const params = new URLSearchParams(preserveQuery)
    if (id) params.set('category', String(id))
    return params.toString() ? `/catalog?${params.toString()}` : '/catalog'
  }

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="container">
          <span className="section-kicker">{titleLabel}</span>
          <h1>Katalog</h1>
          <p>
            {query ? `"${query}" bo'yicha ` : ''}
            {products.length} ta mahsulot topildi
          </p>
        </div>
      </section>

      <section className="container catalog-shell">
        <div className="catalog-filter-row" aria-label="Katalog kategoriyalari">
          <Link href={makeCategoryHref()} className={!categoryId ? 'active' : ''}>
            Barchasi
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={makeCategoryHref(cat.id)}
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
