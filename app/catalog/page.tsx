import { getCategories, getProducts } from '@/lib/db'
import CatalogSearch from '@/components/CatalogSearch'
import Link from 'next/link'

export const revalidate = 60

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; team?: string }
}) {
  const categoryId = searchParams.category ? parseInt(searchParams.category) : undefined
  const query = searchParams.q || ''
  const team = searchParams.team || ''
  
  // Note: You must update `getProducts` in lib/db.ts to accept the `team` parameter.
  const [categories, products] = await Promise.all([getCategories(), getProducts(categoryId, query, team)])

  const activeCategory = categories.find((c) => c.id === categoryId)

  return (
    <div className="catalog-page bg-bg min-h-screen text-white pt-6">
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col gap-2">
          <span className="text-accent text-sm font-bold uppercase tracking-widest">
            {activeCategory ? `${activeCategory.emoji} ${activeCategory.name}` : team ? `Jamoa: ${team}` : 'Barcha mahsulotlar'}
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Katalog</h1>
          <p className="text-gray-400 text-sm">
            {query ? `"${query}" bo'yicha ` : ''}
            {products.length} ta mahsulot topildi
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        {/* Category Pills */}
        <div className="flex overflow-x-auto snap-x gap-2 pb-4 hide-scrollbar mb-6" aria-label="Katalog kategoriyalari">
          <Link 
            href={query ? `/catalog?q=${encodeURIComponent(query)}` : '/catalog'} 
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${!categoryId && !team ? 'bg-white text-black border-white' : 'bg-surface border-border text-gray-300 hover:border-accent'}`}
          >
            Barchasi
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border ${categoryId === cat.id ? 'bg-white text-black border-white' : 'bg-surface border-border text-gray-300 hover:border-accent'}`}
            >
              <span className="mr-2">{cat.emoji}</span>
              {cat.name}
            </Link>
          ))}
        </div>

        <CatalogSearch products={products} initialQuery={query} />
      </section>
    </div>
  )
}
