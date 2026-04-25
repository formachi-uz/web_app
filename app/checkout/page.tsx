'use client'
import { useState } from 'react'
import { useCart } from '@/lib/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CreditCard, Handshake, CheckCircle } from 'lucide-react'

const PAYNET_LINK =
  "https://app.paynet.uz/qr-online/00020101021140440012qr-online.uz01186r0C2GWSuXEb8UE7KQ0202115204531153038605802UZ5910AO'PAYNET'6008Tashkent610610002164280002uz0106PAYNET0208Toshkent80520012qr-online.uz03097120207070419marketing@paynet.uz6304A3D2"

type Step = 'info' | 'payment' | 'success'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<Step>('info')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentType: '' as 'card' | 'credit' | '',
  })

  const updateForm = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  // Step 1 → 2
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Barcha maydonlarni to'ldiring!")
      return
    }
    setError('')
    setStep('payment')
  }

  // Step 2 → 3 — buyurtma yuborish
  const handlePayment = async (paymentType: 'card' | 'credit') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          address: form.address,
          payment_type: paymentType,
          items,
          total: total(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xato yuz berdi')

      setOrderId(data.order_id)
      updateForm('paymentType', paymentType)
      clearCart()
      setStep('success')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && step === 'info') {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 12 }}>
          SAVAT BO'SH
        </h2>
        <Link href="/catalog" className="btn btn-primary" style={{ marginTop: 8 }}>
          Katalogga o'tish →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0',
      }}>
        <div className="container">
          {step !== 'success' && (
            <button onClick={() => step === 'payment' ? setStep('info') : router.back()}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--muted)', fontSize: 13,
              }}>
              <ChevronLeft size={16} /> Orqaga
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '40px 24px', maxWidth: 640 }}>

        {/* ─── Steps indicator ─────────────────────────────────────────────── */}
        {step !== 'success' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 40, alignItems: 'center' }}>
            {['info', 'payment'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step === s ? 'var(--accent)' : (i < ['info','payment'].indexOf(step) ? 'var(--accent)' : 'var(--surface2)'),
                  border: `1px solid ${step === s ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  color: step === s || i < ['info','payment'].indexOf(step) ? '#000' : 'var(--muted)',
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1,
                  color: step === s ? 'var(--accent)' : 'var(--muted)',
                  textTransform: 'uppercase',
                }}>
                  {s === 'info' ? "Ma'lumotlar" : "To'lov"}
                </span>
                {i < 1 && (
                  <div style={{
                    width: 40, height: 1,
                    background: step === 'payment' ? 'var(--accent)' : 'var(--border)',
                    margin: '0 4px',
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
            color: 'var(--danger)', padding: '12px 16px', borderRadius: 8,
            fontSize: 13, marginBottom: 20,
          }}>{error}</div>
        )}

        {/* ─── Step 1: Ma'lumotlar ─────────────────────────────────────────── */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 36,
              letterSpacing: 1, marginBottom: 32,
            }}>BUYURTMA MA'LUMOTLARI</h1>

            {/* Savat xulosa */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 20, marginBottom: 32,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
                color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12,
              }}>Savatingiz</div>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, marginBottom: 8, color: 'var(--muted)',
                }}>
                  <span>
                    {item.name}
                    {item.size ? ` (${item.size})` : ''}
                    {item.back_print ? ` | ✍️${item.back_print}` : ''}
                    {' '}× {item.qty}
                  </span>
                  <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                    {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={{
                borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Jami:</span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)',
                }}>
                  {total().toLocaleString()} so'm
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
                }}>To'liq ism *</label>
                <input className="input" placeholder="Masalan: Musurmon Husanov"
                  value={form.name} onChange={e => updateForm('name', e.target.value)} required />
              </div>
              <div>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
                }}>Telefon *</label>
                <input className="input" placeholder="+998 93 107 13 08" type="tel"
                  value={form.phone} onChange={e => updateForm('phone', e.target.value)} required />
              </div>
              <div>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
                }}>Yetkazish manzili *</label>
                <textarea className="input"
                  placeholder="Viloyat, tuman, aniq manzil&#10;Masalan: Samarqand viloyati, Tayloq tumani, Musurmon"
                  value={form.address} onChange={e => updateForm('address', e.target.value)}
                  rows={3} required style={{ resize: 'vertical' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}>
              Davom etish →
            </button>
          </form>
        )}

        {/* ─── Step 2: To'lov ─────────────────────────────────────────────── */}
        {step === 'payment' && (
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 36,
              letterSpacing: 1, marginBottom: 8,
            }}>TO'LOV USULI</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
              Qulay to'lov usulini tanlang
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Karta */}
              <button
                disabled={loading}
                onClick={() => handlePayment('card')}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 24, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--accent)'
                  el.style.background = 'rgba(0,229,160,0.04)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--border)'
                  el.style.background = 'var(--surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'rgba(0,229,160,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CreditCard size={22} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                      💳 Karta / Paynet
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      To'lov linki yuboriladi. Chek talab qilinadi.
                    </div>
                  </div>
                </div>
              </button>

              {/* Nasiya */}
              <button
                disabled={loading}
                onClick={() => handlePayment('credit')}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 24, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--accent)'
                  el.style.background = 'rgba(0,229,160,0.04)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--border)'
                  el.style.background = 'var(--surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'rgba(0,229,160,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Handshake size={22} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                      🤝 Uzum Nasiya
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Admin tez orada siz bilan bog'lanadi
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
                ⏳ Buyurtma yuborilmoqda...
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Muvaffaqiyat ────────────────────────────────────────── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle size={40} color="var(--accent)" />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 40,
              letterSpacing: 1, color: 'var(--accent)', marginBottom: 12,
            }}>QABUL QILINDI!</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>
              Buyurtma <strong style={{ color: 'var(--text)' }}>#{orderId}</strong> muvaffaqiyatli yuborildi
            </p>

            {form.paymentType === 'card' ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 24, marginTop: 32, marginBottom: 24,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>💳 To'lovni amalga oshiring</div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
                  Quyidagi tugma orqali Paynet da to'lang, keyin chekni admin ga yuboring
                </p>
                <a
                  href={PAYNET_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex' }}
                >
                  💳 Paynet orqali to'lash
                </a>
              </div>
            ) : (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 24, marginTop: 32, marginBottom: 24,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>🤝 Uzum Nasiya</div>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Admin tez orada siz bilan bog'lanib, nasiya shartlarini tushuntiradi
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/catalog" className="btn btn-secondary">
                Katalogga qaytish
              </Link>
              <a
                href="https://t.me/formachi_admin"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                💬 Admin bilan bog'lanish
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
