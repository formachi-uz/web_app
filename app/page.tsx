import Link from 'next/link'
import type { ReactNode } from 'react'
import { Send, ShieldCheck, Shirt, Truck } from 'lucide-react'
import { getProducts, getReviews } from '@/lib/db'
import ProductCard from '@/components/ProductCard'

export const revalidate = 60

// Updated teams array with explicit filter parameters and logo paths
const teams = [
  { name: 'Real Madrid', logo: '/logos/real-madrid.png', filterParam: 'Real Madrid' },
  { name: 'Barcelona', logo: '/logos/barcelona.png', filterParam: 'Barcelona' },
  { name: 'Manchester City', logo: '/logos/man-city.png', filterParam: 'Manchester City' },
  { name: 'Chelsea', logo: '/logos/chelsea.png', filterParam: 'Chelsea' },
  { name: 'Liverpool', logo: '/logos/liverpool.png', filterParam: 'Liverpool' },
  { name: 'Bayern Munich', logo: '/logos/bayern.png', filterParam: 'Bayern Munich' },
  { name: 'PSG', logo: '/logos/psg.png', filterParam: 'PSG' },
  { name: 'Milliy Jamoalar', logo: '/logos/uzb.png', filterParam: 'National' },
]

export default async function HomePage() {
  const [products, reviews] = await Promise.all([getProducts(), getReviews()])

  const featuredProducts = products.slice(0, 8)

  let avgRating = '5.0'
  if (reviews.length > 0) {
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    avgRating = (sum / reviews.length).toFixed(1)
  }

  return (
    <div className="store-home bg-bg text-white min-h-screen">
      {/* 1. PREMIUM PROMO HERO SECTION */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Forma Promo Block */}
          <Link href="/catalog?category=formalar" className="relative group overflow-hidden rounded-2xl aspect-[4/3] md:aspect-video bg-surface2 border border-border hover:border-accent transition-all duration-300">
            <img
              src="/images/premium-jersey-promo.jpg"
              alt="Top Formalar"
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                Yangi kolleksiya
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Top Formalar</h2>
              <p className="text-gray-300 text-sm md:text-base">Sevimli jamoangiz libosini tanlang</p>
            </div>
          </Link>

          {/* Premium Butsi Promo Block */}
          <Link href="/catalog?category=butsiylar" className="relative group overflow-hidden rounded-2xl aspect-[4/3] md:aspect-video bg-surface2 border border-border hover:border-accent transition-all duration-300">
            <img
              src="/images/premium-boot-promo.jpg"
              alt="Premium Butsiylar"
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                Professional tanlov
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Premium Butsiylar</h2>
              <p className="text-gray-300 text-sm md:text-base">Maydonda o'z kuchingizni ko'rsating</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 2. TEAM SELECTOR (Horizontal Scroll with PNG Logos) */}
      <section id="teams" className="container mx-auto px-4 py-8">
        <SectionHead eyebrow="Jamoalar" title="Jamoangizni tanlang" href="/catalog" />
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar mt-6" aria-label="Jamoalar bo'yicha tezkor filter">
          {teams.map((team) => (
            <Link
              key={team.name}
              href={`/catalog?team=${encodeURIComponent(team.filterParam)}`}
              className="flex-shrink-0 snap-start flex flex-col items-center justify-center bg-surface border border-border rounded-xl p-4 w-[100px] hover:border-accent hover:shadow-[0_0_15px_rgba(0,229,160,0.15)] transition-all group"
            >
              <div className="w-14 h-14 mb-3 flex items-center justify-center">
                <img
                  src={team.logo}
                  alt={team.name}
                  className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform"
                />
              </div>
              <strong className="text-[11px] text-center text-gray-300 uppercase tracking-wide group-hover:text-accent">
                {team.name}
              </strong>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. CATALOG GRID (Compact 2-column mobile layout inherited via ProductCard) */}
      {featuredProducts.length > 0 && (
        <section id="catalog" className="container mx-auto px-4 py-8">
          <SectionHead eyebrow="Katalog" title="Ommabop mahsulotlar" href="/catalog" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mt-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. TRUST BADGES */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TrustItem icon={<Truck size={24} />} title="1-2 kun yetkazish" />
          <TrustItem icon={<ShieldCheck size={24} />} title="Sifatli material" />
          <TrustItem icon={<Shirt size={24} />} title="Ism yozish xizmati" />
          <TrustItem icon={<Send size={24} />} title="Telegram buyurtma" />
        </div>
      </section>
    </div>
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
