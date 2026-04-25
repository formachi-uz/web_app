import { getCategories, getProducts } from '@/lib/db'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

export const revalidate = 60

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const categoryId = searchParams.category ? parseInt(searchParams.category) : undefined
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(categoryId),
  ])

  const activeCategory = categories.find((c) => c.id === categoryId)

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 0',
      }}>
        <div className="container">
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
            color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            {activeCategory ? `${activeCategory.emoji} ${activeCategory.name}` : 'Barcha mahsulotlar'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2 }}>
            KATALOG
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
            {products.length} ta mahsulot
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px' }}>
        {/* Category filters */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40,
        }}>
          <Link
            href="/catalog"
            style={{
              padding: '8px 20px',
              borderRadius: 20, border: '1px solid',
              fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1,
              textDecoration: 'none', transition: 'all 0.15s',
              borderColor: !categoryId ? 'var(--accent)' : 'var(--border)',
              background: !categoryId ? 'rgba(0,229,160,0.1)' : 'transparent',
              color: !categoryId ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            Barchasi
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.id}`}
              style={{
                padding: '8px 20px',
                borderRadius: 20, border: '1px solid',
                fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1,
                textDecoration: 'none', transition: 'all 0.15s',
                borderColor: categoryId === cat.id ? 'var(--accent)' : 'var(--border)',
                background: categoryId === cat.id ? 'rgba(0,229,160,0.1)' : 'transparent',
                color: categoryId === cat.id ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--muted)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>
              MAHSULOTLAR YO'Q
            </div>
            <div style={{ fontSize: 13 }}>
              Bu kategoriyada hozircha mahsulot mavjud emas
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
