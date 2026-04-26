import Link from 'next/link'
import { getCategories, getProducts, getReviews } from '@/lib/db'
import ProductCard from '@/components/ProductCard'

export const revalidate = 60

export default async function HomePage() {
  const categories = await getCategories()
  const products = await getProducts()
  const reviews = await getReviews()

  const featuredProducts = products.slice(0, 8)

  let avgRating = '5.0'
  if (reviews.length > 0) {
    const sum = reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0)
    avgRating = (sum / reviews.length).toFixed(1)
  }

  return (
    <div>
      {/* HERO */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(0,229,160,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,180,122,0.04) 0%, transparent 50%)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,229,160,0.08)',
              border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 20, padding: '6px 16px', marginBottom: 32,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase',
              }}>
                Toshkentdagi sport kiyimlari
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px, 8vw, 96px)',
              letterSpacing: 2, lineHeight: 0.95,
              color: 'var(--text)', marginBottom: 24,
            }}>
              SPORT<br />
              <span style={{ color: 'var(--accent)' }}>KIYIMLARI</span><br />
              DO&apos;KONI
            </h1>

            <p style={{
              fontSize: 16, color: 'var(--muted)', lineHeight: 1.7,
              marginBottom: 40, maxWidth: 480,
            }}>
              Formalar, retro kiyimlar, butsalar va sarakonjoshkalar.
              Tez yetkazish. Yuqori sifat. Qulay narx.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 60 }}>
              <Link href="/catalog" className="btn btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
                Katalogni ko&apos;rish →
              </Link>
              <a
                href="https://t.me/Formachi_uzBot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: 15, padding: '14px 32px' }}
              >
                ⚡ Bot orqali buyurtma
              </a>
            </div>

            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { value: products.length + '+', label: 'Mahsulotlar' },
                { value: reviews.length + '+', label: 'Sharhlar' },
                { value: avgRating + '⭐', label: "O'rtacha baho" },
                { value: '1-3', label: 'Kun yetkazish' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 32,
                    color: 'var(--accent)', letterSpacing: 1,
                  }}>{stat.value}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase',
                  }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute', right: '-5%', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 'clamp(200px, 25vw, 380px)',
          opacity: 0.04, userSelect: 'none', lineHeight: 1,
        }}>⚽</div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 40 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
              color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
            }}>Kategoriyalar</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1 }}>
              NIMA QIDIRYAPSIZ?
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {categories.map((cat) => (
              <Link key={cat.id} href={'/catalog?category=' + cat.id} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: '28px 24px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{cat.emoji}</div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 22,
                    letterSpacing: 1, marginBottom: 6,
                  }}>{cat.name}</h3>
                  {cat.description && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                      {cat.description}
                    </p>
                  )}
                  <div style={{
                    marginTop: 16, fontFamily: 'var(--font-mono)',
                    fontSize: 11, color: 'var(--accent)', letterSpacing: 1,
                  }}>
                    Ko&apos;rish →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="section" style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="container">
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 40, flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                  color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
                }}>Mahsulotlar</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1 }}>
                  SO&apos;NGGI KELGANLAR
                </h2>
              </div>
              <Link href="/catalog" className="btn btn-secondary">
                Barchasini ko&apos;rish →
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}>
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 40,
              letterSpacing: 1, marginBottom: 12,
            }}>NIMA UCHUN BIZ?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              Mijozlarimiz bizni qayta-qayta tanlaydi
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {[
              { icon: '⚡', title: 'Tez buyurtma', desc: 'Telegram bot orqali 2 daqiqada buyurtma bering' },
              { icon: '🚚', title: 'Tez yetkazish', desc: 'BTS pochta orqali 1-3 kun ichida qo\'lingizda' },
              { icon: '✅', title: 'Sifat kafolati', desc: 'Barcha mahsulotlar sifat nazoratidan o\'tgan' },
              { icon: '💰', title: 'Qulay narx', desc: 'Bozordan 20-30% arzonroq narxlarda' },
            ].map((item) => (
              <div key={item.title} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: 28, textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: 20,
                  letterSpacing: 1, marginBottom: 8,
                }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="section" style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
        }}>
          <div className="container">
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
              }}>Mijozlar fikri</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1 }}>
                SHARHLAR
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: 24,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 12,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{review.user_name}</div>
                      {review.product_name && (
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10,
                          color: 'var(--muted)', marginTop: 2,
                        }}>{review.product_name}</div>
                      )}
                    </div>
                    <div className="stars" style={{ fontSize: 14 }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.text && (
                    <p style={{
                      fontSize: 13, color: 'var(--muted)',
                      lineHeight: 1.6, fontStyle: 'italic',
                    }}>
                      &quot;{review.text}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(0,180,122,0.04) 100%)',
            border: '1px solid rgba(0,229,160,0.2)',
            borderRadius: 20, padding: '60px 40px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 56px)',
              letterSpacing: 2, marginBottom: 16,
            }}>
              BUYURTMA BERISHGA TAYYOR?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32 }}>
              Katalogdan tanlang yoki Telegram bot orqali buyurtma bering
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/catalog" className="btn btn-primary" style={{ fontSize: 15, padding: '14px 36px' }}>
                Katalog →
              </Link>
              <a
                href="https://t.me/Formachi_uzBot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: 15, padding: '14px 36px' }}
              >
                ⚡ Telegram bot
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
