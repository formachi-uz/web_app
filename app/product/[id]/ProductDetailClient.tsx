'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Minus, Plus, Send, ShoppingCart, Zap, ZoomIn } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/db'
import { trackEvent } from '@/lib/analytics'

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedPreview, setSelectedPreview] = useState(0)
  const [backPrint, setBackPrint] = useState<boolean | null>(null)
  const [printName, setPrintName] = useState('')
  const [added, setAdded] = useState(false)
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

  const hasDiscount = product.discount_percent > 0
  const customizationStatus = product.customization_status ?? 'not_available'
  const canCustomize = product.is_customizable || customizationStatus !== 'not_available'
  const customizationPrice = customizationStatus === 'included_bonus' ? 0 : Number(product.customization_price ?? 50000)
  const stocks = product.stocks ?? []
  const availableStocks = stocks.filter((stock) => (stock.available ?? stock.quantity) > 0)
  const totalStock = availableStocks.reduce((sum, stock) => sum + (stock.available ?? stock.quantity), 0)
  const stockLabel = totalStock === 0 ? 'Tugagan' : totalStock <= 3 ? `Kam qoldi: ${totalStock} ta` : 'Sotuvda bor'
  const previewSlots = product.photo_url ? ['Asosiy', 'Detal', 'Komplekt'] : ['FORMACHI']
  const telegramUrl = `https://t.me/Formachi_uzBot?start=product_${product.id}`

  useEffect(() => {
    trackEvent('product_view', {
      product_id: product.id,
      category_id: product.category_id,
      price: Math.round(product.final_price),
    })
  }, [product.id, product.category_id, product.final_price])

  const openCart = () => {
    const drawer = document.getElementById('cart-drawer')
    const backdrop = document.getElementById('cart-backdrop')
    if (drawer) drawer.style.transform = 'translateX(0)'
    if (backdrop) {
      backdrop.style.opacity = '1'
      backdrop.style.pointerEvents = 'auto'
    }
  }

  const handleAddToCart = (goCheckout = false) => {
    if (!selectedSize && availableStocks.length > 0) {
      alert("O'lchamni tanlang!")
      return
    }
    if (canCustomize && backPrint === null) {
      alert('Ism yozish haqida qaror qiling!')
      return
    }
    if (canCustomize && backPrint && !printName.trim()) {
      alert('Ism va raqamni kiriting!')
      return
    }

    const price = product.final_price + (canCustomize && backPrint ? customizationPrice : 0)
    trackEvent(goCheckout ? 'buy_now' : 'add_to_cart', {
      product_id: product.id,
      category_id: product.category_id,
      size: selectedSize,
      qty: quantity,
      back_print: Boolean(backPrint),
      price: Math.round(price),
    })

    addItem({
      product_id: product.id,
      name: product.name,
      price,
      qty: quantity,
      size: selectedSize,
      back_print: backPrint ? printName.trim() : null,
      photo_url: product.photo_url,
    })

    if (goCheckout) {
      router.push('/checkout')
    } else {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
      openCart()
    }
  }

  return (
    <div className="product-page">
      <div className="product-breadcrumb">
        <div className="container">
          <Link href="/catalog">
            <ChevronLeft size={16} /> Katalogga qaytish
          </Link>
        </div>
      </div>

      <div className="container product-detail-container">
        <div className="product-detail-grid">
          <div className="product-gallery">
            <div className="product-thumbs">
              {previewSlots.map((slot, index) => (
                <button
                  key={slot}
                  type="button"
                  className={selectedPreview === index ? 'product-thumb active' : 'product-thumb'}
                  onClick={() => setSelectedPreview(index)}
                  aria-label={`${slot} rasm`}
                >
                  {product.photo_url ? (
                    <img src={`/api/photo?file_id=${product.photo_url}`} alt={`${product.name} ${slot}`} />
                  ) : (
                    <span>FM</span>
                  )}
                </button>
              ))}
            </div>

            <div className="product-image-frame">
              {product.photo_url ? (
                <img
                  src={`/api/photo?file_id=${product.photo_url}`}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="product-image-placeholder">FORMACHI</div>
              )}
              <button type="button" className="product-zoom" aria-label="Rasmni yaqin ko'rish">
                <ZoomIn size={18} />
              </button>
              {hasDiscount && <div className="product-sale-badge">-{Math.round(product.discount_percent)}%</div>}
              <div className={totalStock <= 3 ? 'product-stock-badge product-stock-low' : 'product-stock-badge'}>
                {stockLabel}
              </div>
            </div>
          </div>

          <div className="product-info-panel">
            <span className="section-kicker">
              {product.category_emoji} {product.category_name}
            </span>
            <h1 className="product-title">{product.name}</h1>

            {product.review_count > 0 && (
              <div className="product-review-row">
                <div className="stars">
                  {Array.from({ length: Math.round(product.avg_rating) }).map((_, index) => (
                    <span key={`full-${index}`}>&#9733;</span>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - Math.round(product.avg_rating)) }).map((_, index) => (
                    <span key={`empty-${index}`}>&#9734;</span>
                  ))}
                </div>
                <span>
                  {product.avg_rating.toFixed(1)} ({product.review_count} ta sharh)
                </span>
              </div>
            )}

            <div className="price-box">
              {hasDiscount && <del>{product.price.toLocaleString()} so'm</del>}
              <strong className="product-price">
                {Math.round(product.final_price).toLocaleString()} <span>so'm</span>
              </strong>
              {canCustomize && (
                <small>
                  {customizationStatus === 'included_bonus'
                    ? "Ism va raqam yozish bonus sifatida bepul"
                    : `+ ism yozish: ${customizationPrice.toLocaleString()} so'm (ixtiyoriy)`}
                </small>
              )}
              {availableStocks.length > 0 && (
                <div className="detail-size-strip">
                  {availableStocks.map((stock) => (
                    <span key={stock.size}>
                      {stock.size} - {stock.available ?? stock.quantity} ta
                    </span>
                  ))}
                </div>
              )}
            </div>

            {product.description && <p className="product-description">{product.description}</p>}

            {availableStocks.length > 0 && (
              <div className="product-option-block">
                <span className="field-label">O'lchamni tanlang</span>
                <div className="detail-size-row">
                  {stocks.map((stock) => {
                    const available = stock.available ?? stock.quantity
                    const isOut = available === 0
                    const isLow = available > 0 && available <= 2
                    const isSel = selectedSize === stock.size
                    return (
                      <button
                        key={stock.size}
                        type="button"
                        disabled={isOut}
                        onClick={() => setSelectedSize(stock.size)}
                        className={isSel ? 'size-option active' : 'size-option'}
                      >
                        {stock.size}
                        {isLow && !isOut && <i>!</i>}
                        {isOut && <em>x</em>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="product-option-block">
              <span className="field-label">Miqdor</span>
              <div className="qty-control">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                  <Minus size={15} />
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => value + 1)}>
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {canCustomize && (
              <div className="product-option-block">
                <span className="field-label">
                  {customizationStatus === 'included_bonus'
                    ? 'Forma orqasiga ism yozish (bepul)'
                    : `Forma orqasiga ism yozish (+${customizationPrice.toLocaleString()} so'm)`}
                </span>
                <div className="print-choice-row">
                  {[
                    { val: false, label: "Yo'q, kerak emas" },
                    { val: true, label: 'Ha, yozdiraman' },
                  ].map((opt) => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => setBackPrint(opt.val)}
                      className={backPrint === opt.val ? 'print-choice active' : 'print-choice'}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {backPrint && (
                  <input
                    className="input"
                    placeholder="Masalan: HUSANOV 45"
                    value={printName}
                    onChange={(event) => setPrintName(event.target.value.toUpperCase())}
                    maxLength={25}
                  />
                )}
              </div>
            )}

            <div className="product-actions">
              <button className="btn btn-primary" onClick={() => handleAddToCart(false)}>
                {added ? "Qo'shildi!" : <><ShoppingCart size={17} /> Savatga qo'shish</>}
              </button>
              <button className="btn btn-secondary" onClick={() => handleAddToCart(true)}>
                <Zap size={17} /> Hozir buyurtma
              </button>
            </div>

            <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-telegram product-telegram">
              <Send size={17} />
              Telegram orqali buyurtma
            </a>

            <div className="product-service-list">
              <span>1-3 kun ichida yetkazish</span>
              <span>Yetkazish: 20,000 - 30,000 so'm</span>
              <span>Sifat nazorati</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
