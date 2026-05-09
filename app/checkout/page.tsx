'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronLeft, Clock, Copy, CreditCard, Handshake, ShieldCheck, Upload } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { CartItem } from '@/lib/db'
import { trackEvent } from '@/lib/analytics'

const PAYNET_LINK =
  "https://app.paynet.uz/qr-online/00020101021140440012qr-online.uz01186r0C2GWSuXEb8UE7KQ0202115204531153038605802UZ5910AO'PAYNET'6008Tashkent610610002164280002uz0106PAYNET0208Toshkent80520012qr-online.uz03097120207070419marketing@paynet.uz6304A3D2"
const CARD_NUMBER = '9860340101082121'
const CARD_OWNER = "Xolbo'tayev Bobur"
const CARD_PAYMENT = `${CARD_NUMBER} - ${CARD_OWNER}`
const MAX_CHECK_SIZE = 10 * 1024 * 1024
const PAYMENT_WINDOW_SECONDS = 15 * 60

type Step = 'info' | 'payment' | 'success'
type PaymentType = 'card' | 'credit'
type DeliveryZone = 'tashkent' | 'region'

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
  const [submittedItems, setSubmittedItems] = useState<CartItem[]>([])
  const [submittedTotal, setSubmittedTotal] = useState(0)
  const [paymentSeconds, setPaymentSeconds] = useState(PAYMENT_WINDOW_SECONDS)
  const [copyMessage, setCopyMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    deliveryZone: '' as DeliveryZone | '',
    address: '',
    paymentType: '' as PaymentType | '',
  })

  const updateForm = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))
  const fullAddress = () => `${form.deliveryZone === 'tashkent' ? 'Toshkent shahar' : 'Viloyat'}: ${form.address}`
  const paymentExpired = paymentSeconds <= 0

  useEffect(() => {
    if (step !== 'success' || form.paymentType !== 'card' || paymentSeconds <= 0) return
    const timer = window.setInterval(() => {
      setPaymentSeconds((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step, form.paymentType, paymentSeconds])

  const handleInfoSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.deliveryZone || !form.address.trim()) {
      setError("Barcha maydonlarni to'ldiring!")
      return
    }
    setError('')
    trackEvent('checkout_step', { step: 'payment', items_count: items.length, total: total() })
    setStep('payment')
  }

  const handlePayment = async (paymentType: PaymentType) => {
    setLoading(true)
    setError('')
    try {
      const orderItems = [...items]
      const orderTotal = total()
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          address: fullAddress(),
          delivery_zone: form.deliveryZone,
          payment_type: paymentType,
          items: orderItems,
          total: orderTotal,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xato yuz berdi')

      setOrderId(data.order_id)
      updateForm('paymentType', paymentType)
      setPaymentSeconds(PAYMENT_WINDOW_SECONDS)
      setCopyMessage('')
      setCheckFile(null)
      setCheckMessage('')
      setSubmittedItems(orderItems)
      setSubmittedTotal(orderTotal)
      trackEvent('order_submitted', {
        order_id: data.order_id,
        payment_type: paymentType,
        items_count: orderItems.length,
        total: orderTotal,
      })
      clearCart()
      setStep('success')
    } catch (err: any) {
      trackEvent('checkout_error', { message: err.message, payment_type: paymentType })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const validateCheckFile = (file: File) => {
    const isAllowedType = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!isAllowedType) return "Chek rasm yoki PDF formatida bo'lishi kerak."
    if (file.size > MAX_CHECK_SIZE) return "Chek fayli 10 MB dan kichik bo'lishi kerak."
    return ''
  }

  const handleCheckFileChange = (file?: File | null) => {
    setCheckMessage('')
    if (!file) {
      setCheckFile(null)
      return
    }
    const validation = validateCheckFile(file)
    if (validation) {
      setCheckFile(null)
      setCheckMessage(validation)
      return
    }
    setCheckFile(file)
    setCheckMessage(`${file.name} tanlandi. Endi "Chekni yuborish" tugmasini bosing.`)
  }

  const handleCheckUpload = async () => {
    if (!orderId || !checkFile) {
      setCheckMessage('Iltimos, chek rasmini tanlang')
      return
    }
    const validation = validateCheckFile(checkFile)
    if (validation) {
      setCheckMessage(validation)
      return
    }
    setCheckLoading(true)
    setCheckMessage('Chek Telegram admin kanaliga yuborilmoqda...')
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
      setCheckMessage('Chek qabul qilindi. Admin tekshiradi.')
      trackEvent('check_uploaded', { order_id: orderId })
    } catch (err: any) {
      trackEvent('checkout_error', { message: err.message, order_id: orderId, type: 'check_upload' })
      setCheckMessage(err.message)
    } finally {
      setCheckLoading(false)
    }
  }

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER)
      setCopyMessage('Karta raqam nusxalandi')
    } catch {
      setCopyMessage(`Karta raqam: ${CARD_NUMBER}`)
    }
  }

  if (items.length === 0 && step === 'info') {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 28, marginBottom: 20, fontWeight: 900 }}>Savat bo'sh</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 12 }}>SAVAT BO'SH</h2>
        <Link href="/catalog" className="btn btn-primary" style={{ marginTop: 8 }}>Katalogga o'tish</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
        <div className="container">
          {step !== 'success' && (
            <button onClick={() => (step === 'payment' ? setStep('info') : router.back())} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
              <ChevronLeft size={16} /> Orqaga
            </button>
          )}
        </div>
      </div>

      <div className="container checkout-container" style={{ maxWidth: 720 }}>
        {step !== 'success' && <Steps current={step} />}
        {error && <Alert>{error}</Alert>}

        {step === 'info' && (
          <form onSubmit={handleInfoSubmit}>
            <Title>BUYURTMA MA&apos;LUMOTLARI</Title>
            <CartSummary items={items} total={total()} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <Field label="To'liq ism *"><input className="input" placeholder="Masalan: Musurmon Husanov" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required /></Field>
              <Field label="Telefon *"><input className="input" placeholder="+998 93 107 13 08" type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} required /></Field>
              <Field label="Yetkazish hududi *">
                <div className="delivery-zone-grid">
                  <button type="button" className={form.deliveryZone === 'tashkent' ? 'delivery-zone active' : 'delivery-zone'} onClick={() => updateForm('deliveryZone', 'tashkent')}>
                    Toshkent shahar
                    <span>Yandex orqali yetkazish</span>
                  </button>
                  <button type="button" className={form.deliveryZone === 'region' ? 'delivery-zone active' : 'delivery-zone'} onClick={() => updateForm('deliveryZone', 'region')}>
                    Viloyatlar
                    <span>Pochta/kuryer orqali</span>
                  </button>
                </div>
              </Field>
              <Field label="Yetkazish manzili *"><textarea className="input" placeholder={form.deliveryZone === 'tashkent' ? "Toshkent shahar, tuman, ko'cha yoki mo'ljal" : "Viloyat, tuman, aniq manzil\nMasalan: Samarqand viloyati, Tayloq tumani"} value={form.address} onChange={(e) => updateForm('address', e.target.value)} rows={3} required style={{ resize: 'vertical' }} /></Field>
              {form.deliveryZone === 'tashkent' && <div className="delivery-note">Toshkent bo'yicha admin siz bilan bog'lanib, Yandex yetkazish uchun lokatsiyani aniqlashtiradi.</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}>Davom etish</button>
          </form>
        )}

        {step === 'payment' && (
          <div className="checkout-payment">
            <Title>TO&apos;LOV USULI</Title>
            <CartSummary items={items} total={total()} compact />
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Buyurtmani yaratib, keyingi oynada summa, karta raqam va chek yuklash chiqadi.</p>
            <div className="payment-options">
              <PaymentButton title="Karta / Paynet" description="15 minut ichida to'lov qiling va chekni yuklang." icon={<CreditCard size={22} color="var(--accent)" />} loading={loading} onClick={() => handlePayment('card')} />
              <PaymentButton title="Uzum Nasiya" description="Ariza adminga yuboriladi, siz bilan bog'lanamiz." icon={<Handshake size={22} color="var(--accent)" />} loading={loading} onClick={() => handlePayment('credit')} />
            </div>
            {loading && <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 13 }}>Buyurtma yuborilmoqda...</div>}
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="success-mark"><CheckCircle size={40} color="var(--accent)" /></div>
            <h1 className="success-title">QABUL QILINDI!</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>Buyurtma <strong style={{ color: 'var(--text)' }}>#{orderId}</strong> muvaffaqiyatli yuborildi</p>
            <OrderSummary items={submittedItems} total={submittedTotal} paymentType={form.paymentType} phone={form.phone} address={fullAddress()} />

            {form.paymentType === 'card' ? (
              <PaymentWindow
                total={submittedTotal}
                seconds={paymentSeconds}
                expired={paymentExpired}
                checkFile={checkFile}
                checkLoading={checkLoading}
                checkMessage={checkMessage}
                copyMessage={copyMessage}
                onCopy={copyCardNumber}
                onFileChange={handleCheckFileChange}
                onUpload={handleCheckUpload}
              />
            ) : (
              <div className="success-card"><div style={{ fontWeight: 600, marginBottom: 8 }}>Uzum Nasiya</div><p style={{ color: 'var(--muted)', fontSize: 13 }}>Arizangiz adminga yuborildi. Tez orada siz bilan bog'lanamiz.</p></div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/catalog" className="btn btn-secondary">Katalogga qaytish</Link>
              <a href="https://t.me/formachi_admin" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Admin bilan bog'lanish</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PaymentWindow({
  total,
  seconds,
  expired,
  checkFile,
  checkLoading,
  checkMessage,
  copyMessage,
  onCopy,
  onFileChange,
  onUpload,
}: {
  total: number
  seconds: number
  expired: boolean
  checkFile: File | null
  checkLoading: boolean
  checkMessage: string
  copyMessage: string
  onCopy: () => void
  onFileChange: (file?: File | null) => void
  onUpload: () => void
}) {
  return (
    <div className="professional-payment-card">
      <div className="payment-card-head">
        <div>
          <span className="section-kicker"><ShieldCheck size={14} /> To'lov oynasi</span>
          <h2>15 daqiqa ichida to'lang</h2>
        </div>
        <div className={expired ? 'payment-timer expired' : 'payment-timer'}>
          {formatTime(seconds)}
          <small>qolgan vaqt</small>
        </div>
      </div>

      <div className="payment-amount-box">
        <span>To'lanadigan summa</span>
        <strong>{total.toLocaleString()} so'm</strong>
      </div>

      <div className="payment-method-row">
        <a href={PAYNET_LINK} target="_blank" rel="noopener noreferrer" className="payment-method-chip">
          <span>Paynet</span>
          <strong>To'lash</strong>
        </a>
        <div className="payment-method-chip">
          <span>Payme / Click</span>
          <strong>Tez orada</strong>
        </div>
      </div>

      <div className="payment-card-number">
        <div>
          <span>Karta orqali o'tkazma</span>
          <strong>{CARD_PAYMENT}</strong>
        </div>
        <button type="button" className="payment-copy-btn" onClick={onCopy}><Copy size={14} /> Nusxa</button>
      </div>
      {copyMessage && <div className="check-upload-message">{copyMessage}</div>}

      <div className="payment-upload-zone">
        <p>To'lovdan keyin chek rasmini yoki PDF faylni yuklang. Admin tekshiradi va buyurtmani tasdiqlaydi.</p>
        <div className="payment-upload-actions">
          <label className="payment-upload-label">
            <Upload size={16} /> Chek yuklash
            <input type="file" accept="image/*,.pdf,application/pdf" onChange={(event) => onFileChange(event.target.files?.[0] || null)} />
          </label>
          <button type="button" className="btn btn-primary" disabled={!checkFile || checkLoading} onClick={onUpload}>{checkLoading ? 'Yuborilmoqda...' : 'Chekni yuborish'}</button>
        </div>
        {checkFile && <div className="check-upload-file">{checkFile.name}</div>}
        {checkMessage && <div className="check-upload-message">{checkMessage}</div>}
        {expired && <div className="payment-expired-note"><Clock size={14} /> 15 minut tugadi. To'lov qilgan bo'lsangiz chekni baribir yuboring yoki admin bilan bog'laning.</div>}
      </div>
    </div>
  )
}

function OrderSummary({ items, total, paymentType, phone, address }: { items: CartItem[]; total: number; paymentType: PaymentType | ''; phone: string; address: string }) {
  if (!items.length) return null
  return (
    <div className="order-summary">
      <div className="summary-label">Buyurtma xulosasi</div>
      {items.map((item, index) => (
        <div key={index} className="summary-row"><span>{item.name}{item.size ? ` (${item.size})` : ''}{item.back_print ? ` | ${item.back_print}` : ''} x {item.qty}</span><span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{(item.price * item.qty).toLocaleString()}</span></div>
      ))}
      <div className="summary-meta"><span>Tel: {phone}</span><span>{paymentType === 'card' ? 'Paynet / karta' : 'Uzum Nasiya'}</span></div>
      <div className="summary-address">Manzil: {address}</div>
      <div className="summary-total"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Jami:</span><span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>{total.toLocaleString()} so'm</span></div>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 1, marginBottom: 32 }}>{children}</h1>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="field-label">{label}</span>{children}</label>
}
function Alert({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{children}</div>
}
function Steps({ current }: { current: Step }) {
  const steps: Step[] = ['info', 'payment']
  return <div className="checkout-steps">{steps.map((step, index) => {
    const active = current === step
    const done = index < steps.indexOf(current)
    return <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className={active || done ? 'step-dot step-dot-active' : 'step-dot'}>{index + 1}</div><span className={active ? 'step-label step-label-active' : 'step-label'}>{step === 'info' ? "Ma'lumotlar" : "To'lov"}</span>{index < steps.length - 1 && <div className={done ? 'step-line step-line-active' : 'step-line'} />}</div>
  })}</div>
}
function CartSummary({ items, total, compact = false }: { items: CartItem[]; total: number; compact?: boolean }) {
  return <div className="summary-card" style={compact ? { marginBottom: 18 } : undefined}><div className="summary-label">Savatingiz</div>{items.map((item, index) => <div key={index} className="summary-row"><span>{item.name}{item.size ? ` (${item.size})` : ''}{item.back_print ? ` | ${item.back_print}` : ''} x {item.qty}</span><span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{(item.price * item.qty).toLocaleString()}</span></div>)}<div className="summary-total"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Jami:</span><span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)' }}>{total.toLocaleString()} so'm</span></div></div>
}
function PaymentButton({ title, description, icon, loading, onClick }: { title: string; description: string; icon: React.ReactNode; loading: boolean; onClick: () => void }) {
  return <button disabled={loading} onClick={onClick} className="payment-option"><div className="payment-option-inner"><div className="payment-icon">{icon}</div><div className="payment-copy"><div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{description}</div></div></div></button>
}
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}
