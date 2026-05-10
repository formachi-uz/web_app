import type { Metadata } from 'next'
import './globals.css'
import './formachi-fixes.css'
import './mobile-first.css'
import './telegram-webapp-fixes.css'
import './catalog-polish.css'
import './admin-payment.css'
import './jersey-preview.css'
import './wow-effects.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import CartAnalytics from '@/components/CartAnalytics'
import TelegramWebAppFix from '@/components/TelegramWebAppFix'
import WowLayer from '@/components/WowLayer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Formachi.uz — Sport Kiyimlari',
  description: 'Formalar, retro kiyimlar, butsalar. Tez yetkazish. Yuqori sifat.',
  keywords: 'forma, futbol forma, sport kiyim, butsalar, Toshkent',
  openGraph: {
    title: 'Formachi.uz',
    description: 'Sport kiyimlari do\'koni',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="noise">
        <TelegramWebAppFix />
        <Navbar />
        <main className="site-main">{children}</main>
        <Footer />
        <CartDrawer />
        <CartAnalytics />
        <WowLayer />
      </body>
    </html>
  )
}
