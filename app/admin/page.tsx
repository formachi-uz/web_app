import Link from 'next/link'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

type Metric = {
  label: string
  value: string | number
  hint: string
}

type OrderRow = {
  id: number
  created_at: string
  status: string
  payment_type: string
  customer_name: string
  customer_phone: string
  address: string
  total: number
}

type DashboardData = {
  metrics: Metric[]
  orders: OrderRow[]
  error?: string
}

export default async function AdminPage({ searchParams }: { searchParams: { secret?: string } }) {
  const secret = process.env.ADMIN_PANEL_SECRET
  if (secret && searchParams.secret !== secret) {
    return <div className="container admin-shell"><div className="admin-card">Ruxsat yo'q</div></div>
  }

  const data = await getDashboardData()
  const secretQuery = secret ? `?secret=${encodeURIComponent(secret)}` : ''

  return (
    <div className="container admin-shell">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">FORMACHI ADMIN</span>
          <h1>Admin panel</h1>
          <p>Bugungi buyurtmalar, to'lov holati va tezkor boshqaruv uchun web panel.</p>
        </div>
        <div className="admin-hero-actions">
          <Link href={`/admin/analytics${secretQuery}`} className="btn btn-primary">Analytics</Link>
          <a href="https://t.me/formachi_admin" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Telegram admin</a>
        </div>
      </div>

      {data.error && <div className="admin-alert">{data.error}</div>}

      <div className="admin-metric-grid">
        {data.metrics.map((metric) => (
          <div className="admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.hint}</small>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-orders-card">
          <div className="admin-card-head">
            <div>
              <span className="summary-label">Oxirgi buyurtmalar</span>
              <h2>Buyurtmalar</h2>
            </div>
            <Link href={`/admin/analytics${secretQuery}`}>Hisobotni ko'rish</Link>
          </div>

          <div className="admin-order-list">
            {data.orders.length ? data.orders.map((order) => (
              <div className="admin-order-item" key={order.id}>
                <div className="admin-order-top">
                  <strong>#{order.id} - {order.customer_name}</strong>
                  <StatusPill status={order.status} />
                </div>
                <div className="admin-order-meta">
                  <span>{formatDate(order.created_at)}</span>
                  <span>{order.customer_phone || 'Telefon yoq'}</span>
                  <span>{order.payment_type || 'To\u2019lov usuli yoq'}</span>
                </div>
                <div className="admin-order-address">{order.address || 'Manzil kiritilmagan'}</div>
                <div className="admin-order-total">{Number(order.total || 0).toLocaleString()} so'm</div>
              </div>
            )) : (
              <div className="admin-empty">Hozircha buyurtma ko'rinmayapti.</div>
            )}
          </div>
        </section>

        <aside className="admin-card admin-actions-card">
          <span className="summary-label">Tezkor linklar</span>
          <h2>Boshqaruv</h2>
          <div className="admin-action-list">
            <Link href={`/admin/analytics${secretQuery}`}>Analytics va top mahsulotlar</Link>
            <Link href="/catalog">Saytdagi katalogni ko'rish</Link>
            <a href="https://t.me/formachi_admin" target="_blank" rel="noopener noreferrer">Telegram admin bilan ochish</a>
          </div>
          <div className="admin-note">
            Mahsulot qo'shish, stock va statuslarni hozircha Telegram bot orqali boshqaramiz. Bu panel buyurtmalarni tez ko'rish va analytics uchun.
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = String(status || '').toLowerCase()
  const tone = normalized.includes('bekor') || normalized.includes('cancel')
    ? 'danger'
    : normalized.includes('tasdiq') || normalized.includes('yetkazildi') || normalized.includes('confirmed')
      ? 'success'
      : normalized.includes('chek') || normalized.includes('tolov') || normalized.includes('payment')
        ? 'warning'
        : 'neutral'

  return <span className={`admin-status admin-status-${tone}`}>{status || 'YANGI'}</span>
}

async function getDashboardData(): Promise<DashboardData> {
  if (!process.env.DATABASE_URL) {
    return fallbackData('DATABASE_URL topilmadi. Panel demo holatda ochildi.')
  }

  try {
    const columns = await getTableColumns('orders')
    if (!columns.has('id')) return fallbackData('orders jadvali topilmadi yoki hali tayyor emas.')

    const createdCol = pickColumn(columns, ['created_at', 'createdAt', 'date'])
    const totalCol = pickColumn(columns, ['total_price', 'total_amount', 'total'])
    const statusCol = pickColumn(columns, ['status'])
    const paymentCol = pickColumn(columns, ['payment_type', 'payment_method'])
    const nameCol = pickColumn(columns, ['customer_name', 'full_name', 'name'])
    const phoneCol = pickColumn(columns, ['customer_phone', 'phone', 'phone_number'])
    const addressCol = pickColumn(columns, ['delivery_address', 'address'])

    const createdExpr = createdCol ? `o.${createdCol}` : 'NOW()'
    const totalExpr = totalCol ? `COALESCE(o.${totalCol}, 0)` : '0'
    const statusExpr = statusCol ? `COALESCE(o.${statusCol}::text, 'YANGI')` : `'YANGI'`
    const paymentExpr = paymentCol ? `COALESCE(o.${paymentCol}::text, '')` : `''`
    const nameExpr = nameCol ? `COALESCE(o.${nameCol}::text, 'Mijoz')` : `'Mijoz'`
    const phoneExpr = phoneCol ? `COALESCE(o.${phoneCol}::text, '')` : `''`
    const addressExpr = addressCol ? `COALESCE(o.${addressCol}::text, '')` : `''`
    const todayCondition = createdCol ? `${createdExpr}::date = CURRENT_DATE` : 'TRUE'
    const weekCondition = createdCol ? `${createdExpr} > NOW() - INTERVAL '7 days'` : 'TRUE'

    const summary = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE ${todayCondition})::int AS today_orders,
        COUNT(*) FILTER (WHERE ${weekCondition})::int AS week_orders,
        COUNT(*) FILTER (WHERE (${statusExpr}) ILIKE ANY(ARRAY['%TOLOV%', '%CHEK%', '%PAYMENT%', '%PENDING%', '%YANGI%']))::int AS payment_waiting,
        COALESCE(SUM(${totalExpr}) FILTER (WHERE ${weekCondition}), 0)::float AS week_revenue
      FROM orders o
    `)

    const latest = await pool.query(`
      SELECT
        o.id,
        ${createdExpr} AS created_at,
        ${statusExpr} AS status,
        ${paymentExpr} AS payment_type,
        ${nameExpr} AS customer_name,
        ${phoneExpr} AS customer_phone,
        ${addressExpr} AS address,
        ${totalExpr} AS total
      FROM orders o
      ORDER BY ${createdExpr} DESC, o.id DESC
      LIMIT 12
    `)

    const s = summary.rows[0] || {}
    return {
      metrics: [
        { label: 'Bugungi zakazlar', value: Number(s.today_orders || 0), hint: 'Bugun kelgan buyurtmalar' },
        { label: '7 kunlik zakazlar', value: Number(s.week_orders || 0), hint: 'Oxirgi hafta bo\u2019yicha' },
        { label: 'To\u2019lov kutilmoqda', value: Number(s.payment_waiting || 0), hint: 'Chek yoki tasdiq kutayotganlar' },
        { label: '7 kunlik tushum', value: `${Number(s.week_revenue || 0).toLocaleString()} so'm`, hint: 'Buyurtmalar summasi' },
      ],
      orders: latest.rows.map((row) => ({
        id: Number(row.id),
        created_at: String(row.created_at),
        status: String(row.status || 'YANGI'),
        payment_type: String(row.payment_type || ''),
        customer_name: String(row.customer_name || 'Mijoz'),
        customer_phone: String(row.customer_phone || ''),
        address: String(row.address || ''),
        total: Number(row.total || 0),
      })),
    }
  } catch (error) {
    console.error('Admin dashboard failed:', error)
    return fallbackData('Admin ma\u2019lumotlarini olishda xatolik bo\u2019ldi. Bot va sayt ishlashda davom etadi.')
  }
}

async function getTableColumns(tableName: string) {
  const { rows } = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  )
  return new Set(rows.map((row) => row.column_name))
}

function pickColumn(columns: Set<string>, candidates: string[]) {
  return candidates.find((column) => columns.has(column)) || null
}

function fallbackData(error: string): DashboardData {
  return {
    error,
    metrics: [
      { label: 'Bugungi zakazlar', value: 0, hint: 'Database tayyor bo\u2019lsa chiqadi' },
      { label: '7 kunlik zakazlar', value: 0, hint: 'Database tayyor bo\u2019lsa chiqadi' },
      { label: 'To\u2019lov kutilmoqda', value: 0, hint: 'Database tayyor bo\u2019lsa chiqadi' },
      { label: '7 kunlik tushum', value: "0 so'm", hint: 'Database tayyor bo\u2019lsa chiqadi' },
    ],
    orders: [],
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}
