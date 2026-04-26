'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronLeft, CreditCard, Handshake } from 'lucide-react'
import { useCart } from '@/lib/cart'

const PAYNET_LINK =
  "https://app.paynet.uz/qr-online/00020101021140440012qr-online.uz01186r0C2GWSuXEb8UE7KQ0202115204531153038605802UZ5910AO'PAYNET'6008Tashkent610610002164280002uz0106PAYNET0208Toshkent80520012qr-online.uz03097120207070419marketing@paynet.uz6304A3D2"

type Step = 'info' | 'payment' | 'success'
type PaymentType = 'card' | 'credit'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<Step>('info')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkFile, setCheckFile] = useState<File | null>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentType: '' as PaymentType | '',
  })

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleInfoSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Barcha maydonlarni to'ldiring!")
      return
    }
    setError('')
    setStep('payment')
  }

  const handlePayment = async (paymentType: PaymentType) => {
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
      setCheckFile(null)
      setCheckMessage('')
      clearCart()
      setStep('success')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckUpload = async () => {
    if (!orderId || !checkFile) {
      setCheckMessage('Iltimos, chek rasmini tanlang')
      return
    }

    setCheckLoading(true)
    setCheckMessage('')

    try {
      const payload = new FormData()
      payload.append('order_id', String(orderId))
      payload.append('customer_name', form.name)
      payload.append('customer_phone', form.phone)
      payload.append('check', checkFile)

      const res = await fetch('/api/checks', { method: 'POST', body: payload })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chek yuborilmadi')

      setCheckFile(null)
      setCheckMessage('✅ Chek qabul qilindi. Admin tekshiradi.')
    } catch (err: any) {
      setCheckMessage(err.message)
    } finally {
      setCheckLoading(false)
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
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div className="container">
          {step !== 'success' && (
            <button
              onClick={() => (step === 'payment' ? setStep('info') : router.back())}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--muted)',
                fontSize: 13,
              }}
            >
              <ChevronLeft size={16} /> Orqaga
            </button>
          )}
        </div>
      </div>

      <div className="container checkout-container" style={{ maxWidth: 640 }}>
        {step !== 'success' && <Steps current={step} />}
        {error && <Alert>{error}</Alert>}

        {step === 'info' && (
          <form onSubmit={handleInfoSubmit}>
            <Title>BUYURTMA MA&apos;LUMOTLARI</Title>
            <CartSummary items={items} total={total()} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <Field label="To'liq ism *">
                <input
                  className="input"
                  placeholder="Masalan: Musurmon Husanov"
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  required
                />
              </Field>
              <Field label="Telefon *">
                <input
                  className="input"
                  placeholder="+998 93 107 13 08"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateForm('phone', event.target.value)}
                  required
                />
              </Field>
              <Field label="Yetkazish manzili *">
                <textarea
                  className="input"
                  placeholder="Viloyat, tuman, aniq manzil&#10;Masalan: Samarqand viloyati, Tayloq tumani, Musurmon"
                  value={form.address}
                  onChange={(event) => updateForm('address', event.target.value)}
                  rows={3}
                  required
                  style={{ resize: 'vertical' }}
                />
              </Field>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}>
              Davom etish →
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="checkout-payment">
            <Title>TO&apos;LOV USULI</Title>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32 }}>
              Qulay to'lov usulini tanlang
            </p>

            <div className="payment-options">
              <PaymentButton
                title="💳 Karta / Paynet"
                description="To'lov linki yuboriladi. Chek talab qilinadi."
                icon={<CreditCard size={22} color="var(--accent)" />}
                loading={loading}
                onClick={() => handlePayment('card')}
              />
              <PaymentButton
                title="🤝 Uzum Nasiya"
                description="Admin tez orada siz bilan bog'lanadi"
                icon={<Handshake size={22} color="var(--accent)" />}
                loading={loading}
                onClick={() => handlePayment('credit')}
              />
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>
                ⏳ Buyurtma yuborilmoqda...
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="success-mark">
              <CheckCircle size={40} color="var(--accent)" />
            </div>
            <h1 className="success-title">QABUL QILINDI!</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>
              Buyurtma <strong style={{ color: 'var(--text)' }}>#{orderId}</strong> muvaffaqiyatli yuborildi
            </p>

            {form.paymentType === 'card' ? (
              <div className="success-card">
                <div style={{ fontWeight: 600, marginBottom: 8 }}>💳 To'lovni amalga oshiring</div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
                  Paynet orqali to'lang, keyin chek rasmini shu yerga yuklang
                </p>
                <a href={PAYNET_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  💳 Paynet orqali to'lash
                </a>
                <div className="check-upload-box">
                  <label className="check-upload-label">
                    Chek rasmini yuklang
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(event) => setCheckFile(event.target.files?.[0] || null)}
                    />
                  </label>
                  {checkFile && <div className="check-upload-file">{checkFile.name}</div>}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={!checkFile || checkLoading}
                    onClick={handleCheckUpload}
                    style={{ width: '100%', marginTop: 12 }}
                  >
                    {checkLoading ? 'Yuborilmoqda...' : 'Chekni yuborish'}
                  </button>
                  {checkMessage && <div className="check-upload-message">{checkMessage}</div>}
                </div>
              </div>
            ) : (
              <div className="success-card">
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
              <a href="https://t.me/formachi_admin" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                💬 Admin bilan bog'lanish
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 1, marginBottom: 32 }}>
      {children}
    </h1>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,71,87,0.08)',
        border: '1px solid rgba(255,71,87,0.2)',
        color: 'var(--danger)',
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  )
}

function Steps({ current }: { current: Step }) {
  const steps: Step[] = ['info', 'payment']
  return (
    <div className="checkout-steps">
      {steps.map((step, index) => {
        const active = current === step
        const done = index < steps.indexOf(current)
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={active || done ? 'step-dot step-dot-active' : 'step-dot'}>{index + 1}</div>
            <span className={active ? 'step-label step-label-active' : 'step-label'}>
              {step === 'info' ? "Ma'lumotlar" : "To'lov"}
            </span>
            {index < steps.length - 1 && <div className={done ? 'step-line step-line-active' : 'step-line'} />}
          </div>
        )
      })}
    </div>
  )
}

function CartSummary({ items, total }: { items: any[]; total: number }) {
  return (
    <div className="summary-card">
      <div className="summary-label">Savatingiz</div>
      {items.map((item, index) => (
        <div key={index} className="summary-row">
          <span>
            {item.name}
            {item.size ? ` (${item.size})` : ''}
            {item.back_print ? ` | ✍️${item.back_print}` : ''} × {item.qty}
          </span>
          <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
            {(item.price * item.qty).toLocaleString()}
          </span>
        </div>
      ))}
      <div className="summary-total">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Jami:</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>
          {total.toLocaleString()} so'm
        </span>
      </div>
    </div>
  )
}

function PaymentButton({
  title,
  description,
  icon,
  loading,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  loading: boolean
  onClick: () => void
}) {
  return (
    <button disabled={loading} onClick={onClick} className="payment-option">
      <div className="payment-option-inner">
        <div className="payment-icon">{icon}</div>
        <div className="payment-copy">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{description}</div>
        </div>
      </div>
    </button>
  )
}
