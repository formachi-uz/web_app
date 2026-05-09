import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

type Row = { label: string; value: string | number }
type CheckoutStats = {
  begin_checkout?: number
  orders?: number
  checks?: number
  abandoned?: number
}

const emptyCheckout: CheckoutStats = {
  begin_checkout: 0,
  orders: 0,
  checks: 0,
  abandoned: 0,
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { secret?: string } }) {
  const secret = process.env.ADMIN_PANEL_SECRET
  if (secret && searchParams.secret !== secret) {
    return <div className="container" style={{ padding: '80px 24px' }}>Ruxsat yo'q</div>
  }

  const setupError = await ensureAnalyticsTable()
  if (setupError) {
    return (
      <div className="container analytics-page">
        <div className="summary-label">Admin panel</div>
        <h1 className="analytics-title">Analytics hozircha ochilmadi</h1>
        <div className="analytics-card">
          <p>Database ulanishi yoki analytics jadvali tayyor emas. Sayt ishlashda davom etadi, faqat analytics vaqtincha ko'rinmaydi.</p>
        </div>
      </div>
    )
  }

  const [summaryRows, productRows, checkoutRows] = await Promise.all([
    safeRows<Row>(`
      SELECT event AS label, COUNT(*)::int AS value
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY event
      ORDER BY value DESC
    `),
    safeRows<Row>(`
      WITH product_events AS (
        SELECT
          payload,
          CASE
            WHEN payload->>'product_id' ~ '^[0-9]+$' THEN (payload->>'product_id')::int
            ELSE NULL
          END AS product_id
        FROM analytics_events
        WHERE event IN ('product_view', 'product_click')
          AND payload ? 'product_id'
          AND created_at > NOW() - INTERVAL '14 days'
      )
      SELECT
        COALESCE(p.name, 'Mahsulot #' || COALESCE(product_events.payload->>'product_id', 'noma\u2019lum')) AS label,
        COUNT(*)::int AS value
      FROM product_events
      LEFT JOIN products p ON p.id = product_events.product_id
      GROUP BY label
      ORDER BY value DESC
      LIMIT 10
    `),
    safeRows<CheckoutStats>(`
      SELECT
        COUNT(*) FILTER (WHERE event = 'begin_checkout')::int AS begin_checkout,
        COUNT(*) FILTER (WHERE event = 'order_submitted')::int AS orders,
        COUNT(*) FILTER (WHERE event = 'check_uploaded')::int AS checks,
        COUNT(*) FILTER (WHERE event = 'abandoned_cart_signal')::int AS abandoned
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '14 days'
    `),
  ])

  const c = checkoutRows[0] || emptyCheckout
  const conversion = Number(c.begin_checkout) > 0
    ? Math.round((Number(c.orders) / Number(c.begin_checkout)) * 100)
    : 0

  return (
    <div className="container analytics-page">
      <div className="summary-label">Oxirgi 14 kun</div>
      <h1 className="analytics-title">Analytics</h1>
      <div className="analytics-grid">
        <Metric label="Checkout" value={c.begin_checkout || 0} />
        <Metric label="Buyurtma" value={c.orders || 0} />
        <Metric label="Chek" value={c.checks || 0} />
        <Metric label="Konversiya" value={`${conversion}%`} />
      </div>
      <div className="analytics-columns">
        <Panel title="Eventlar" rows={summaryRows} />
        <Panel title="Top mahsulotlar" rows={productRows} />
      </div>
    </div>
  )
}

async function ensureAnalyticsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGSERIAL PRIMARY KEY,
        event TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        path TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    return null
  } catch (error) {
    console.error('Analytics table setup failed:', error)
    return error
  }
}

async function safeRows<T>(sql: string): Promise<T[]> {
  try {
    const result = await pool.query(sql)
    return result.rows as T[]
  } catch (error) {
    console.error('Analytics query failed:', error)
    return []
  }
}

function Metric({ label, value }: Row) {
  return <div className="analytics-card"><div className="summary-label">{label}</div><div className="analytics-value">{value}</div></div>
}

function Panel({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="analytics-card">
      <h2>{title}</h2>
      <div className="analytics-list">
        {rows.length ? rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>) : <div><span>Ma'lumot hali yo'q</span><strong>0</strong></div>}
      </div>
    </div>
  )
}
