import Link from 'next/link'
import { getCategories, getProducts, getReviews } from '@/lib/db'
import ProductCard from '@/components/ProductCard'

export const revalidate = 60

export default async function HomePage() {
  const [categories, products, reviews] = await Promise.all([
    getCategories(),
    getProducts(),
    getReviews(),
  ])

  const featuredProducts = products.slice(0, 8)
  const saleProducts = products.filter((product) => product.discount_percent > 0).slice(0, 4)
  const heroProduct = products.find((product) => product.photo_url) || products[0]
  const heroProductId = heroProduct ? heroProduct.id : 0
  const secondProduct = products.find((product) => product.id !== heroProductId && product.photo_url)
  const secondProductId = secondProduct ? secondProduct.id : 0
  const thirdProduct = products.find((product) => product.id !== heroProductId && product.id !== secondProductId && product.photo_url)

  let avgRating = '5.0'
  if (reviews.length > 0) {
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    avgRating = (sum / reviews.length).toFixed(1)
  }

  return (
    <div className="store-home">
      <section className="store-hero container">
        <div className="store-hero-main">
          <div>
            <span className="store-eyebrow">Futbol formalari 2025/26</span>
            <h1>Sport kiyimlari do'koni</h1>
            <p>Originalga yaqin sifat, klub formalari, retro kiyimlar va butsalar. Toshkentdan tez yetkazish.</p>
            <div className="store-hero-actions">
              <Link href="/catalog" className="btn btn-primary">Katalogni ko'rish</Link>
              <a href="https://t.me/Formachi_uzBot" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Bot orqali buyurtma
              </a>
            </div>
          </div>

          {heroProduct?.photo_url && (
            <div className="store-hero-product">
              <img src={`/api/photo?file_id=${heroProduct.photo_url}`} alt={heroProduct.name} />
              <div>
                <span>Top mahsulot</span>
                <strong>{heroProduct.name}</strong>
                <small>{Math.round(heroProduct.final_price).toLocaleString()} so'm</small>
              </div>
            </div>
          )}
        </div>

        <div className="store-hero-side">
          <PromoTile title="Yangi kelganlar" text="Eng so'nggi formalar" href="/catalog" image={secondProduct?.photo_url} />
          <PromoTile title="Chegirmalar" text="Ombordagi maxsus takliflar" href="/catalog" image={thirdProduct?.photo_url} />
        </div>
      </section>

      <section className="container store-benefits">
        {[
          ['Tez yetkazish', 'BTS pochta orqali 1-3 kun'],
          ["Paynet to'lov", "Chekni saytning o'zida yuklang"],
          ['Uzum Nasiya', "Admin siz bilan bog'lanadi"],
          ['Sifat nazorati', 'Har bir mahsulot tekshiriladi'],
        ].map(([title, text]) => (
          <div key={title}>
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        ))}
      </section>

      <section className="container store-section">
        <SectionHead eyebrow="Kategoriyalar" title="Kerakli bo'limni tanlang" href="/catalog" />
        <div className="store-category-grid">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/catalog?category=${cat.id}`} className="store-category-card">
              <span>{cat.emoji}</span>
              <strong>{cat.name}</strong>
              {cat.description && <small>{cat.description}</small>}
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="container store-section">
          <SectionHead eyebrow="Mahsulotlar" title="Yangi kelganlar" href="/catalog" />
          <div className="store-product-grid">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      <section className="container store-promo-row">
        <div className="store-wide-promo">
          <span>Forma orqasiga ism yozish</span>
          <h2>Ism va raqam bilan buyurtma bering</h2>
          <p>Forma tanlang, o'lchamni belgilang va orqasiga yoziladigan ism/raqamni checkoutdan oldin kiriting.</p>
          <Link href="/catalog" className="btn btn-primary">Buyurtma boshlash</Link>
        </div>
        <div className="store-stats">
          <strong>{products.length}+</strong><span>Mahsulot</span>
          <strong>{reviews.length}+</strong><span>Sharh</span>
          <strong>{avgRating}</strong><span>O'rtacha baho</span>
        </div>
      </section>

      {saleProducts.length > 0 && (
        <section className="container store-section">
          <SectionHead eyebrow="Maxsus taklif" title="Chegirmadagi mahsulotlar" href="/catalog" />
          <div className="store-product-grid store-product-grid-small">
            {saleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function PromoTile({ title, text, href, image }: { title: string; text: string; href: string; image?: string | null }) {
  return (
    <Link href={href} className="store-promo-tile">
      {image && <img src={`/api/photo?file_id=${image}`} alt="" />}
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </Link>
  )
}

function SectionHead({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="store-section-head">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Link href={href}>Barchasini ko'rish</Link>
    </div>
  )
}
