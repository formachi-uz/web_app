import Link from 'next/link'
import { Instagram, Mail, Phone, Send } from 'lucide-react'

export default function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            FORMACHI
          </Link>
          <p>Futbol formalari, butsiylar va sport kiyimlari uchun premium online do'kon.</p>
          <div className="footer-socials">
            <a href="https://instagram.com/formachi.uz" target="_blank" rel="noopener noreferrer">
              <Instagram size={18} />
              formachi.uz
            </a>
            <a href="https://t.me/formachi_uz" target="_blank" rel="noopener noreferrer">
              <Send size={18} />
              formachi_uz
            </a>
          </div>
        </div>

        <div className="footer-links">
          <span>Sahifalar</span>
          <Link href="/">Bosh sahifa</Link>
          <Link href="/catalog">Katalog</Link>
          <Link href="/#teams">Jamoalar</Link>
          <Link href="/#boots">Butsiylar</Link>
        </div>

        <div className="footer-contact">
          <span>Aloqa</span>
          <a href="mailto:info@formachi.uz">
            <Mail size={18} />
            info@formachi.uz
          </a>
          <a href="tel:+998901234567">
            <Phone size={18} />
            +998 90 123 45 67
          </a>
          <a href="https://t.me/Formachi_uzBot" target="_blank" rel="noopener noreferrer">
            <Send size={18} />
            Telegram orqali buyurtma
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2024 FORMACHI. Barcha huquqlar himoyalangan.</span>
        <span>Telegram orqali tez buyurtma</span>
      </div>
    </footer>
  )
}
