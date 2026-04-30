'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/lib/cart'

export default function CartDrawer() {
  const { items, removeItem, updateQty, total, count } = useCart()

  const close = () => {
    const drawer = document.getElementById('cart-drawer')
    const backdrop = document.getElementById('cart-backdrop')
    if (drawer) drawer.style.transform = 'translateX(100%)'
    if (backdrop) {
      backdrop.style.opacity = '0'
      backdrop.style.pointerEvents = 'none'
    }
  }

  return (
    <>
      <div id="cart-backdrop" className="cart-backdrop" onClick={close} />

      <aside id="cart-drawer" className="cart-drawer" aria-label="Savat">
        <div className="cart-drawer-head">
          <div>
            <ShoppingBag size={20} />
            <strong>Savat</strong>
            {count() > 0 && <span>{count()} ta</span>}
          </div>
          <button type="button" onClick={close} aria-label="Savatni yopish">
            <X size={21} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <strong>Savat bo'sh</strong>
              <span>Katalogdan mahsulot tanlang</span>
              <Link href="/catalog" onClick={close} className="btn btn-primary">
                Katalogga o'tish
              </Link>
            </div>
          ) : (
            <div className="cart-items">
              {items.map((item, index) => {
                const imageSrc = toPhotoSrc(item.photo_url)
                return (
                  <div key={`${item.product_id}-${item.size}-${index}`} className="cart-item">
                    <div className="cart-item-image">
                      {imageSrc ? <img src={imageSrc} alt={item.name} /> : <span>FM</span>}
                    </div>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <small>
                        {item.size && `O'lcham: ${item.size}`}
                        {item.back_print && ` | ${item.back_print}`}
                      </small>
                      <div className="cart-item-bottom">
                        <span>{(item.price * item.qty).toLocaleString()} so'm</span>
                        <div className="cart-qty">
                          <button type="button" onClick={() => updateQty(index, item.qty - 1)} aria-label="Kamaytirish">
                            <Minus size={13} />
                          </button>
                          <em>{item.qty}</em>
                          <button type="button" onClick={() => updateQty(index, item.qty + 1)} aria-label="Ko'paytirish">
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="cart-remove" onClick={() => removeItem(index)} aria-label="O'chirish">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-foot">
            <div>
              <span>Jami:</span>
              <strong>{total().toLocaleString()} so'm</strong>
            </div>
            <Link href="/checkout" onClick={close} className="btn btn-primary">
              Buyurtma berish
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}

function toPhotoSrc(value?: string | null) {
  if (!value) return null
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value
  return `/api/photo?file_id=${encodeURIComponent(value)}`
}
