import { getCategories, getProducts } from '@/lib/db'
import { teamFilters } from '@/lib/team-data'
import CatalogSearch from '@/components/CatalogSearch'
import TeamFilterCard from '@/components/TeamFilterCard'
import Link from 'next/link'
import { Home } from 'lucide-react'

export const revalidate = 60

const quickBrands = ['Nike', 'Adidas', 'Puma', 'Mizuno', 'New Balance']

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
    : team
      ? `Jamoa: ${team}`
      : brand
        ? `Brend: ${brand}`
        : mainCategory
          ? mainCategoryLabels[mainCategory] ?? mainCategory
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

  const makeQuickHref = (type: 'team' | 'brand', value?: string) => {
    const params = new URLSearchParams(preserveQuery)
    params.delete(type)
    if (type === 'team') params.delete('brand')
    if (type === 'brand') params.delete('team')
    if (value) params.set(type, value)
    return params.toString() ? `/catalog?${params.toString()}` : '/catalog'
  }

  const showTeamQuickFilter = mainCategory !== 'BUTSIYLAR'
  const showBrandQuickFilter = mainCategory === 'BUTSIYLAR' || (!mainCategory && !team)

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="container catalog-hero-inner">
          <div className="catalog-hero-content">
            <Link href="/" className="catalog-home-link">
              <Home size={15} /> Asosiy menyu
            </Link>
            <span className="section-kicker catalog-kicker">{titleLabel}</span>
            <h1>Katalog</h1>
            <p>
              {query ? `"${query}" bo'yicha ` : ''}
              {products.length} ta mahsulot topildi
            </p>
          </div>
        </div>
      </section>

      <section className="container catalog-shell">
        <div className="catalog-filter-panel" aria-label="Katalog filterlari">
          <div className="catalog-filter-group">
            <span className="catalog-filter-label">Mahsulot turi</span>
            <div className="catalog-filter-row" aria-label="Asosiy mahsulot bo'limlari">
              <Link href="/catalog" className={!categoryId && !mainCategory ? 'active' : ''}>Barchasi</Link>
              <Link href="/catalog?mainCategory=FORMLAR" className={mainCategory === 'FORMLAR' ? 'active' : ''}>Formlar</Link>
              <Link href="/catalog?mainCategory=RETRO_FORMALAR" className={mainCategory === 'RETRO_FORMALAR' ? 'active' : ''}>Retro</Link>
              <Link href="/catalog?mainCategory=BUTSIYLAR" className={mainCategory === 'BUTSIYLAR' ? 'active' : ''}>Butsiylar</Link>
            </div>
          </div>

          <div className="catalog-filter-group">
            <span className="catalog-filter-label">Kategoriyalar</span>
            <div className="catalog-filter-row" aria-label="Katalog kategoriyalari">
              {categories.map((cat) => (
                <Link key={cat.id} href={makeCategoryHref(cat.id)} className={categoryId === cat.id ? 'active' : ''}>
                  <span>{cat.emoji}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {showTeamQuickFilter && (
          <div className="quick-filter-block quick-filter-card">
            <div className="quick-filter-head">
              <span>Jamoalar</span>
              {team && <Link href={makeQuickHref('team')}>Tozalash</Link>}
            </div>
            <div className="quick-team-row">
              {teamFilters.map((item) => (
                <TeamFilterCard
                  key={item.name}
                  name={item.name}
                  logo={item.logo}
                  href={makeQuickHref('team', item.query)}
                  active={team === item.query}
                />
              ))}
            </div>
          </div>
        )}

        {showBrandQuickFilter && (
          <div className="quick-filter-block quick-filter-card">
            <div className="quick-filter-head">
              <span>Brendlar</span>
              {brand && <Link href={makeQuickHref('brand')}>Tozalash</Link>}
            </div>
            <div className="quick-brand-row">
              {quickBrands.map((item) => (
                <Link key={item} href={makeQuickHref('brand', item)} className={brand === item ? 'quick-brand active' : 'quick-brand'}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
        )}

        <CatalogSearch products={products} initialQuery={query} />
      </section>
    </div>
  )
}
