import Link from 'next/link'
import type { ReactNode } from 'react'
import { Send, ShieldCheck, Shirt, Truck } from 'lucide-react'
import { getProducts, getReviews, Product } from '@/lib/db'
import { teamFilters } from '@/lib/team-data'
import HomeCategoryProductSection from '@/components/HomeCategoryProductSection'

export const revalidate = 60

export default async function HomePage() {
  const [products, reviews] = await Promise.all([getProducts(), getReviews()])

  const formalar = products.filter(isFormaProduct).slice(0, 12)
  const retroFormalar = products.filter(isRetroProduct).slice(0, 12)
  const butsiylar = products.filter(isBootProduct).slice(0, 12)
  const fallback = products.slice(0, 12)

  const topFormaCount = formalar.length || fallback.length
  const bootCount = butsiylar.length || fallback.length

  let avgRating = '5.0'
  if (reviews.length > 0) {
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    avgRating = (sum / reviews.length).toFixed(1)
  }

  return (
    <div className="store-home bg-bg text-white min-h-screen">
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PromoCard
            href="/catalog?mainCategory=FORMLAR"
            image="/images/premium-jersey-promo.jpg"
            eyebrow="Yangi kolleksiya"
            title="Top Formalar"
            text={`${topFormaCount} ta premium forma va ism yozish xizmati`}
          />
          <PromoCard
            href="/catalog?mainCategory=BUTSIYLAR"
            image="/images/premium-boot-promo.jpg"
            eyebrow="Professional tanlov"
            title="Premium Butsiylar"
            text={`${bootCount} ta tezlik va nazorat uchun tanlov`}
          />
        </div>
      </section>

      <section id="teams" className="container mx-auto px-4 py-8">
        <SectionHead eyebrow="Jamoalar" title="Jamoangizni tanlang" href="/catalog" />
        <div className="team-logo-scroll mt-6" aria-label="Jamoalar bo'yicha tezkor filter">
          {teamFilters.map((team) => (
            <Link key={team.name} href={`/catalog?team=${encodeURIComponent(team.query)}`} className="team-logo-card">
              <span>
                <img src={team.logo} alt={team.name} />
              </span>
              <strong>{team.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section id="catalog" className="container mx-auto px-4 py-8">
        <SectionHead eyebrow="Katalog" title="3 asosiy bo'lim" href="/catalog" />
        <div className="home-category-stack mt-6">
          <HomeCategoryProductSection
            title="Formlar"
            text="Klub va milliy jamoalar. Ism va raqam yozish xizmati mavjud."
            href="/catalog?mainCategory=FORMLAR"
            products={formalar.length ? formalar : fallback}
          />
          <HomeCategoryProductSection
            title="Retro formalar"
            text="Klassik, vintage va trenddagi eski mavsum formalari."
            href="/catalog?mainCategory=RETRO_FORMALAR"
            products={retroFormalar}
          />
          <HomeCategoryProductSection
            title="Butsiylar"
            text="Nike, Adidas, Puma va boshqa premium futbol butsiylari."
            href="/catalog?mainCategory=BUTSIYLAR"
            products={butsiylar}
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TrustItem icon={<Truck size={24} />} title="1-2 kun yetkazish" />
          <TrustItem icon={<ShieldCheck size={24} />} title="Sifatli material" />
          <TrustItem icon={<Shirt size={24} />} title="Ism yozish xizmati" />
          <TrustItem icon={<Send size={24} />} title={`Telegram buyurtma | ${avgRating}`} />
        </div>
      </section>
    </div>
  )
}

function PromoCard({ href, image, eyebrow, title, text }: { href: string; image: string; eyebrow: string; title: string; text: string }) {
  return (
    <Link href={href} className="relative group overflow-hidden rounded-2xl aspect-[4/3] md:aspect-video bg-surface2 border border-border hover:border-accent transition-all duration-300 promo-card-link">
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 md:p-8">
        <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider rounded-full mb-3">
          {eyebrow}
        </span>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300 text-sm md:text-base">{text}</p>
      </div>
    </Link>
  )
}

function TrustItem({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-surface border border-border">
      <span className="text-accent mb-2">{icon}</span>
      <strong className="text-xs md:text-sm text-gray-300">{title}</strong>
    </div>
  )
}

function SectionHead({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="flex justify-between items-end border-b border-border pb-4">
      <div>
        <span className="text-accent text-sm font-semibold tracking-wider uppercase">{eyebrow}</span>
        <h2 className="text-2xl md:text-3xl font-display font-bold mt-1">{title}</h2>
      </div>
      <Link href={href} className="text-sm text-gray-400 hover:text-accent transition-colors hidden md:block">
        Barchasini ko'rish &rarr;
      </Link>
    </div>
  )
}

function valueOf(product: Product, key: string) {
  const source = product as unknown as Record<string, unknown>
  return String(source[key] ?? '')
}

function textOf(product: Product, keys: string[]) {
  return keys.map((key) => valueOf(product, key)).join(' ').toLowerCase()
}

function isRetroProduct(product: Product) {
  const mainCategory = valueOf(product, 'main_category').toUpperCase()
  if (mainCategory === 'RETRO_FORMALAR') return true

  const text = textOf(product, ['main_category', 'product_type', 'category_name', 'name'])
  return text.includes('retro') || text.includes('classic') || text.includes('vintage')
}

function isBootProduct(product: Product) {
  const mainCategory = valueOf(product, 'main_category').toUpperCase()
  const productType = valueOf(product, 'product_type').toLowerCase()
  if (mainCategory === 'BUTSIYLAR') return true
  if (['boots', 'boot', 'socks', 'accessory'].includes(productType)) return true

  const text = textOf(product, ['main_category', 'product_type', 'category_name', 'brand', 'model', 'name'])
  return [
    'butsa',
    'butsi',
    'buts',
    'boot',
    'sarakan',
    'sarakanosh',
    'sorokon',
    'poyabzal',
    'magista',
    'mercurial',
    'predator',
    'phantom',
    'speedportal',
    'f50',
    'puma',
    'nike',
    'adidas',
    'mizuno',
    'new balance',
  ].some((word) => text.includes(word))
}

function isFormaProduct(product: Product) {
  const mainCategory = valueOf(product, 'main_category').toUpperCase()
  if (mainCategory === 'FORMLAR') return true
  if (mainCategory === 'RETRO_FORMALAR' || mainCategory === 'BUTSIYLAR') return false

  return !isBootProduct(product) && !isRetroProduct(product)
}
