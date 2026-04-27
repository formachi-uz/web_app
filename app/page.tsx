import Link from 'next/link'
import type { ReactNode } from 'react'
import { Minus, Plus, Send, ShieldCheck, Shirt, Truck, ZoomIn } from 'lucide-react'
import { getProducts, getReviews, Product } from '@/lib/db'
import ProductCard from '@/components/ProductCard'

export const revalidate = 60

const teams = [
  { name: 'Real Madrid', badge: 'RM', query: 'Real Madrid' },
  { name: 'Barcelona', badge: 'FCB', query: 'Barcelona' },
  { name: 'Manchester City', badge: 'MC', query: 'Manchester City' },
  { name: 'Chelsea', badge: 'CFC', query: 'Chelsea' },
  { name: 'Liverpool', badge: 'LFC', query: 'Liverpool' },
  { name: 'Bayern Munich', badge: 'FCB', query: 'Bayern Munich' },
  { name: 'PSG', badge: 'PSG', query: 'PSG' },
  { name: 'Milliy Jamoalar', badge: 'UZ', query: 'Milliy' },
  { name: 'Butsiylar', badge: 'BT', query: 'butsa' },
]

export default async function HomePage() {
  const [products, reviews] = await Promise.all([getProducts(), getReviews()])

  const featuredProducts = products.slice(0, 8)
  const bootProducts = products.filter(isBootProduct).slice(0, 3)
  const fallbackBoots = bootProducts.length > 0 ? bootProducts : products.slice(0, 3)
  const photoProducts = products.filter((product) => product.photo_url)
  const heroJersey = photoProducts.find((product) => !isBootProduct(product)) || photoProducts[0] || products[0]
  const heroBoot = photoProducts.find(isBootProduct) || photoProducts.find((product) => product.id !== heroJersey?.id) || heroJersey
  const previewProduct = photoProducts.find((product) => product.id !== heroBoot?.id) || heroJersey

  let avgRating = '5.0'
  if (reviews.length > 0) {
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    avgRating = (sum / reviews.length).toFixed(1)
  }

  return (
    <div className="store-home">
      <section className="store-hero container">
        <div className="store-hero-copy">
          <span className="store-eyebrow">FORMACHI Premium Football Store</span>
          <h1>
            Sevimli jamoangiz <span>formasini tanlang</span>
          </h1>
          <p>Futbol formalari, butsiylar va sport kiyimlari - tez yetkazib berish bilan</p>
          <div className="store-hero-actions">
            <Link href="/catalog" className="btn btn-primary">
              Katalogni ko'rish
            </Link>
            <a
              href="https://t.me/Formachi_uzBot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Send size={18} />
              Telegram orqali buyurtma
            </a>
          </div>

          <div className="hero-proof-row" aria-label="Do'kon ko'rsatkichlari">
            <span>{products.length}+ mahsulot</span>
            <span>{avgRating} reyting</span>
            <span>1-2 kun yetkazish</span>
          </div>
        </div>

        <div className="store-hero-visual" aria-label="Forma va butsa ko'rgazmasi">
          <HeroProduct product={heroJersey} label="Top forma" variant="jersey" />
          <HeroProduct product={heroBoot} label="Premium butsa" variant="boot" />
          <div className="hero-spotlight" />
        </div>
      </section>

      <section id="teams" className="container store-section">
        <SectionHead eyebrow="Jamoalar" title="Jamoangizni tanlang" href="/catalog" />
        <div className="team-scroll" aria-label="Jamoalar bo'yicha tezkor filter">
          {teams.map((team, index) => (
            <Link
              key={team.name}
              href={`/catalog?q=${encodeURIComponent(team.query)}`}
              className={index === 0 ? 'team-card active' : 'team-card'}
            >
              <span className="team-badge">{team.badge}</span>
              <strong>{team.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section id="catalog" className="container store-section">
          <SectionHead eyebrow="Katalog" title="Premium mahsulotlar" href="/catalog" />
          <div className="store-product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {fallbackBoots.length > 0 && (
        <section id="boots" className="container store-section">
          <SectionHead eyebrow="Featured Boots" title="Mashhur butsiylar" href="/catalog?q=butsa" />
          <div className="boot-grid">
            {fallbackBoots.map((product) => (
              <BootCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {previewProduct && (
        <section className="container store-section">
          <ProductPreview product={previewProduct} thumbs={photoProducts.slice(0, 4)} />
        </section>
      )}

      <section className="container trust-grid" aria-label="FORMACHI afzalliklari">
        <TrustItem icon={<Truck size={30} />} title="1-2 kun ichida yetkazib berish" />
        <TrustItem icon={<ShieldCheck size={30} />} title="Sifatli material" />
        <TrustItem icon={<Shirt size={30} />} title="Ism va raqam yozish xizmati" />
        <TrustItem icon={<Send size={30} />} title="Telegram orqali tez buyurtma" />
      </section>
    </div>
  )
}

function HeroProduct({
  product,
  label,
  variant,
}: {
  product?: Product
  label: string
  variant: 'jersey' | 'boot'
}) {
  return (
    <div className={`hero-product-card hero-product-${variant}`}>
      <span>{label}</span>
      {product?.photo_url ? (
        <img src={`/api/photo?file_id=${product.photo_url}`} alt={product.name} />
      ) : (
        <div className="hero-product-placeholder">FORMACHI</div>
      )}
      {product && <strong>{product.name}</strong>}
    </div>
  )
}

function BootCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="boot-card">
      <div className="boot-card-image">
        {product.photo_url ? (
          <img src={`/api/photo?file_id=${product.photo_url}`} alt={product.name} />
        ) : (
          <span>FORMACHI</span>
        )}
      </div>
      <div className="boot-card-body">
        <div>
          <strong>{product.name}</strong>
          <span>{Math.round(product.final_price).toLocaleString()} so'm</span>
        </div>
        <small>Buyurtma</small>
      </div>
    </Link>
  )
}

function ProductPreview({ product, thumbs }: { product: Product; thumbs: Product[] }) {
  const sizes = product.stocks.filter((stock) => stock.quantity > 0).map((stock) => stock.size)
  const previewSizes = sizes.length > 0 ? sizes.slice(0, 5) : ['S', 'M', 'L', 'XL', '2XL']

  return (
    <div className="product-preview-card">
      <div className="preview-gallery">
        <div className="preview-thumbs">
          {(thumbs.length > 0 ? thumbs : [product]).slice(0, 4).map((thumb, index) => (
            <Link
              href={`/product/${thumb.id}`}
              key={`${thumb.id}-${index}`}
              className={thumb.id === product.id ? 'preview-thumb active' : 'preview-thumb'}
            >
              {thumb.photo_url ? <img src={`/api/photo?file_id=${thumb.photo_url}`} alt={thumb.name} /> : <span>FM</span>}
            </Link>
          ))}
        </div>
        <Link href={`/product/${product.id}`} className="preview-main-image">
          {product.photo_url ? <img src={`/api/photo?file_id=${product.photo_url}`} alt={product.name} /> : <span>FORMACHI</span>}
          <i>
            <ZoomIn size={18} />
          </i>
        </Link>
      </div>

      <div className="preview-panel">
        <span className="section-kicker">{product.category_name || 'FORMACHI'}</span>
        <h2>{product.name}</h2>
        <strong className="preview-price">{Math.round(product.final_price).toLocaleString()} so'm</strong>

        <div className="preview-control">
          <small>Size</small>
          <div className="preview-size-row">
            {previewSizes.map((size, index) => (
              <span key={size} className={index === 0 ? 'active' : ''}>
                {size}
              </span>
            ))}
          </div>
        </div>

        <div className="preview-control">
          <small>Miqdor</small>
          <div className="quantity-preview">
            <button aria-label="Kamaytirish">
              <Minus size={14} />
            </button>
            <span>1</span>
            <button aria-label="Ko'paytirish">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="preview-actions">
          <Link href={`/product/${product.id}`} className="btn btn-primary">
            Savatga qo'shish
          </Link>
          <a href="https://t.me/Formachi_uzBot" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <Send size={17} />
            Telegram orqali buyurtma
          </a>
        </div>
      </div>
    </div>
  )
}

function TrustItem({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="trust-item">
      <span>{icon}</span>
      <strong>{title}</strong>
    </div>
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

function isBootProduct(product: Product) {
  const value = `${product.name} ${product.category_name || ''}`.toLowerCase()
  return ['butsa', 'buts', 'boot', 'mercurial', 'predator', 'phantom', 'speedportal'].some((word) =>
    value.includes(word)
  )
}
