'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Home, Minus, Plus, Send, ShoppingCart, Zap, ZoomIn } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { Product } from '@/lib/db'
import { trackEvent } from '@/lib/analytics'

export default function ProductDetailClient({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedPreview, setSelectedPreview] = useState(0)
  const [backPrint, setBackPrint] = useState<boolean | null>(null)
  const [printPlayerName, setPrintPlayerName] = useState('')
  const [printNumber, setPrintNumber] = useState('')
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, shineX: 50, shineY: 42, active: false })
  const [added, setAdded] = useState(false)
  const [notice, setNotice] = useState('')
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()

  const hasDiscount = product.discount_percent > 0
  const customizationStatus = product.customization_status ?? 'not_available'
  const isForma = isFormaProduct(product)
  const canCustomize = product.is_customizable || customizationStatus !== 'not_available' || isForma
  const customizationPrice = customizationStatus === 'included_bonus' ? 0 : Number(product.customization_price ?? 50000)
  const stocks = product.stocks ?? []
  const availableStocks = stocks.filter((stock) => (stock.available ?? stock.quantity) > 0)
  const totalStock = availableStocks.reduce((sum, stock) => sum + (stock.available ?? stock.quantity), 0)
  const stockLabel = totalStock === 0 ? 'Tugagan' : totalStock <= 3 ? `Kam qoldi: ${totalStock} ta` : 'Sotuvda bor'
  const firstAvailableSize = availableStocks[0]?.size ?? null
  const selectedStock = selectedSize ? stocks.find((stock) => stock.size === selectedSize) : null
  const selectedAvailable = selectedStock ? (selectedStock.available ?? selectedStock.quantity) : totalStock || 1
  const maxQuantity = Math.max(1, selectedAvailable)
  const galleryImages = buildGalleryImages(product)
  const previewSlots = galleryImages.length > 0 ? galleryImages : [{ label: 'FORMACHI', src: '' }]
  const telegramUrl = `https://t.me/Formachi_uzBot?start=product_${product.id}`
  const unitPrice = product.final_price + (canCustomize && backPrint ? customizationPrice : 0)
  const orderTotal = unitPrice * quantity
  const selectedSizeLabel = selectedSize || (availableStocks.length > 0 ? "O'lcham tanlanmagan" : "O'lcham talab qilinmaydi")
  const previewName = cleanPrintName(printPlayerName) || 'HUSANOV'
  const previewNumber = cleanPrintNumber(printNumber) || '45'
  const backPrintText = `${previewName} ${previewNumber}`.trim()
  const tiltStyle = {
    '--tilt-x': `${tilt.rx.toFixed(2)}deg`,
    '--tilt-y': `${tilt.ry.toFixed(2)}deg`,
    '--tilt-scale': tilt.active ? '1.018' : '1',
    '--shine-x': `${tilt.shineX.toFixed(1)}%`,
    '--shine-y': `${tilt.shineY.toFixed(1)}%`,
    '--shine-opacity': tilt.active ? '.86' : '.22',
  } as CSSProperties

  useEffect(() => {
    trackEvent('product_view', {
      product_id: product.id,
      category_id: product.category_id,
      price: Math.round(product.final_price),
    })
  }, [product.id, product.category_id, product.final_price])

  useEffect(() => {
    setSelectedSize(firstAvailableSize)
    setQuantity(1)
    setPrintPlayerName('')
    setPrintNumber('')
    setNotice('')
  }, [product.id, firstAvailableSize])

  useEffect(() => {
    setQuantity((value) => Math.min(value, maxQuantity))
  }, [maxQuantity])

  useEffect(() => {
    if (canCustomize) setBackPrint(false)
  }, [product.id, canCustomize])

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
    setNotice('')
    if (stocks.length > 0 && totalStock === 0) {
      setNotice('Bu mahsulot hozircha sotuvda yoq.')
      return
    }
    if (!selectedSize && availableStocks.length > 0) {
      setNotice("O'lchamni tanlang.")
      return
    }
    if (canCustomize && backPrint === null) {
      setNotice('Ism va raqam yozish kerak yoki kerak emasligini tanlang.')
      return
    }
    if (canCustomize && backPrint && (!cleanPrintName(printPlayerName) || !cleanPrintNumber(printNumber))) {
      setNotice('Forma orqasiga yoziladigan ism va raqamni kiriting.')
      return
    }
    if (availableStocks.length > 0 && quantity > maxQuantity) {
      setNotice(`Bu o'lchamdan ${maxQuantity} ta mavjud.`)
      return
    }

    trackEvent(goCheckout ? 'buy_now' : 'add_to_cart', {
      product_id: product.id,
      category_id: product.category_id,
      size: selectedSize,
      qty: quantity,
      back_print: Boolean(backPrint),
      print_name: backPrint ? cleanPrintName(printPlayerName) : null,
      print_number: backPrint ? cleanPrintNumber(printNumber) : null,
      price: Math.round(unitPrice),
    })

    addItem({
      product_id: product.id,
      name: product.name,
      price: unitPrice,
      qty: quantity,
      size: selectedSize,
      back_print: backPrint ? backPrintText : null,
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

  const handleTiltMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.buttons > 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1)

    setTilt({
      rx: (0.5 - y) * 11,
      ry: (x - 0.5) * 13,
      shineX: x * 100,
      shineY: y * 100,
      active: true,
    })
  }

  const resetTilt = () => {
    setTilt({ rx: 0, ry: 0, shineX: 50, shineY: 42, active: false })
  }

  return (
    <div className="product-page">
      <div className="product-breadcrumb">
        <div className="container product-breadcrumb-row">
          <Link href="/">
            <Home size={16} /> Asosiy menyu
          </Link>
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
                  key={`${slot.label}-${index}`}
                  type="button"
                  className={selectedPreview === index ? 'product-thumb active' : 'product-thumb'}
                  onClick={() => setSelectedPreview(index)}
                  aria-label={`${slot.label} rasm`}
                >
                  {slot.src ? (
                    <img src={slot.src} alt={`${product.name} ${slot.label}`} />
                  ) : (
                    <span>FM</span>
                  )}
                </button>
              ))}
            </div>

            <div
              className="product-image-frame product-tilt-frame"
              style={tiltStyle}
              onPointerMove={handleTiltMove}
              onPointerLeave={resetTilt}
              onPointerCancel={resetTilt}
              onBlur={resetTilt}
            >
              {previewSlots[selectedPreview]?.src ? (
                <img
                  src={previewSlots[selectedPreview].src}
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
              {canCustomize && backPrint && (
                <div className="jersey-image-print-overlay" aria-label="Forma ustidagi yozuv preview">
                  <strong>{previewName}</strong>
                  <b>{previewNumber}</b>
                </div>
              )}
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
                    ? 'Ism va raqam yozish bonus sifatida bepul'
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
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>
                  <Minus size={15} />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={availableStocks.length > 0 && quantity >= maxQuantity}
                >
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
                  <div className="print-live-panel">
                    <div className="print-input-grid">
                      <label>
                        <span>Ism</span>
                        <input
                          className="input"
                          placeholder="HUSANOV"
                          value={printPlayerName}
                          onChange={(event) => setPrintPlayerName(cleanPrintName(event.target.value))}
                          maxLength={14}
                        />
                      </label>
                      <label>
                        <span>Raqam</span>
                        <input
                          className="input"
                          inputMode="numeric"
                          placeholder="45"
                          value={printNumber}
                          onChange={(event) => setPrintNumber(cleanPrintNumber(event.target.value))}
                          maxLength={2}
                        />
                      </label>
                    </div>
                    <div className="print-preview-strip">
                      <span>Preview</span>
                      <strong>{backPrintText}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {notice && <div className="product-notice">{notice}</div>}

            <div className="product-mobile-summary">
              <div>
                <span>Tanlov</span>
                <strong>{selectedSizeLabel} / {quantity} ta</strong>
              </div>
              {canCustomize && backPrint && (
                <div>
                  <span>Yozuv</span>
                  <strong>{backPrintText}</strong>
                </div>
              )}
              <div>
                <span>Jami</span>
                <strong>{Math.round(orderTotal).toLocaleString()} so'm</strong>
              </div>
            </div>

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

function isFormaProduct(product: Product) {
  const source = product as unknown as Record<string, unknown>
  const text = [product.name, product.category_name, source.main_category, source.product_type]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ')
  return text.includes('forma') || text.includes('jersey') || text.includes('kit')
}

function buildGalleryImages(product: Product) {
  const source = product as unknown as Record<string, unknown>
  const values = [product.photo_url, source.gallery]
    .flatMap((value) => String(value ?? '').split(','))
    .map((item) => item.trim())
    .filter(Boolean)
  const unique = Array.from(new Set(values))

  return unique.map((value, index) => ({
    label: index === 0 ? 'Asosiy' : `Rasm ${index + 1}`,
    src: toPhotoSrc(value),
  }))
}

function toPhotoSrc(value: string) {
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value
  return `/api/photo?file_id=${encodeURIComponent(value)}`
}

function cleanPrintName(value: string) {
  return value
    .toUpperCase()
    .replace(/[^\p{L}'\-\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, 14)
}

function cleanPrintNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 2)
}
