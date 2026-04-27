import { getCategories, getProducts } from '@/lib/db'
import CatalogSearch from '@/components/CatalogSearch'
import Link from 'next/link'
import { Home } from 'lucide-react'

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
  const mainCategoryLabels: Record<string, string> = {
    FORMLAR: 'Formlar',
    RETRO_FORMALAR: 'Retro formalar',
    BUTSIYLAR: 'Butsiylar',
  }
  const titleLabel = activeCategory
    ? `${activeCategory.emoji} ${activeCategory.name}`
    : mainCategory
      ? mainCategoryLabels[mainCategory] ?? mainCategory
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
    params.delete('mainCategory')
    if (id) params.set('category', String(id))
    else params.delete('category')
    return params.toString() ? `/catalog?${params.toString()}` : '/catalog'
  }

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="container">
          <Link href="/" className="catalog-home-link">
            <Home size={16} /> Asosiy menyuga qaytish
          </Link>
          <span className="section-kicker" style={{ marginTop: 16 }}>{titleLabel}</span>
          <h1>Katalog</h1>
          <p>
            {query ? `"${query}" bo'yicha ` : ''}
            {products.length} ta mahsulot topildi
          </p>
        </div>
      </section>

      <section className="container catalog-shell">
        <div className="catalog-filter-row" aria-label="Asosiy mahsulot bo'limlari">
          <Link href="/catalog" className={!categoryId && !mainCategory ? 'active' : ''}>
            Barchasi
          </Link>
          <Link href="/catalog?mainCategory=FORMLAR" className={mainCategory === 'FORMLAR' ? 'active' : ''}>
            Formlar
          </Link>
          <Link href="/catalog?mainCategory=RETRO_FORMALAR" className={mainCategory === 'RETRO_FORMALAR' ? 'active' : ''}>
            Retro formalar
          </Link>
          <Link href="/catalog?mainCategory=BUTSIYLAR" className={mainCategory === 'BUTSIYLAR' ? 'active' : ''}>
            Butsiylar
          </Link>
        </div>

        <div className="catalog-filter-row" aria-label="Katalog kategoriyalari">
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
