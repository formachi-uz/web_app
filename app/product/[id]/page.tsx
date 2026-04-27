import pool, { getProductById, getProducts, getReviews } from '@/lib/db'
import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'
import ProductCard from '@/components/ProductCard'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProductById(parseInt(params.id))
  if (!product) return { title: 'Topilmadi' }
  return {
    title: `${product.name} — Formachi.uz`,
    description: product.description || `${product.name} — ${Math.round(product.final_price).toLocaleString()} so'm`,
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const [product, reviews, related, productMeta] = await Promise.all([
    getProductById(id),
    getReviews(id),
    getProducts(),
    getProductMeta(id),
  ])

  if (!product) notFound()

  const hydratedProduct = { ...product, ...productMeta }
  const relatedProducts = related
    .filter((p) => p.id !== id && p.category_id === product.category_id)
    .slice(0, 4)

  return (
    <div>
      <ProductDetailClient product={hydratedProduct as typeof product} />

      {reviews.length > 0 && (
        <section style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: '60px 0',
        }}>
          <div className="container">
            <div style={{ marginBottom: 32 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Mijozlar fikri
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1 }}>
                SHARHLAR ({reviews.length})
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {reviews.map((review) => (
                <div key={review.id} style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: 20,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 10,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {review.user_name}
                    </div>
                    <div className="stars" style={{ fontSize: 13 }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.text && (
                    <p style={{
                      fontSize: 13, color: 'var(--muted)',
                      lineHeight: 1.6, fontStyle: 'italic',
                    }}>
                      "{review.text}"
                    </p>
                  )}
                  <div style={{
                    marginTop: 8,
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                  }}>
                    {new Date(review.created_at).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section style={{ padding: '60px 0' }}>
          <div className="container">
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1 }}>
                O'XSHASH MAHSULOTLAR
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

async function getProductMeta(id: number) {
  if (!Number.isFinite(id) || !process.env.DATABASE_URL) return {}

  try {
    const { rows } = await pool.query(
      'SELECT gallery, main_category, product_type FROM products WHERE id = $1 LIMIT 1',
      [id]
    )
    return rows[0] ?? {}
  } catch (error) {
    console.error('getProductMeta failed:', error)
    return {}
  }
}
