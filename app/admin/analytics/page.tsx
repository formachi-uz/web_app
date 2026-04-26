import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

type Row = { label: string; value: string | number }

export default async function AnalyticsPage({ searchParams }: { searchParams: { secret?: string } }) {
  const secret = process.env.ADMIN_PANEL_SECRET
  if (secret && searchParams.secret !== secret) {
    return <div className="container" style={{ padding: '80px 24px' }}>Ruxsat yo'q</div>
  }

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

  const [summary, products, checkout] = await Promise.all([
    pool.query(`
      SELECT event AS label, COUNT(*)::int AS value
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '14 days'
      GROUP BY event
      ORDER BY value DESC
    `),
    pool.query(`
      SELECT COALESCE(p.name, 'Mahsulot #' || (payload->>'product_id')) AS label, COUNT(*)::int AS value
      FROM analytics_events a
      LEFT JOIN products p ON p.id = NULLIF(payload->>'product_id', '')::int
      WHERE event IN ('product_view', 'product_click')
        AND payload ? 'product_id'
        AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY label
      ORDER BY value DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event = 'begin_checkout')::int AS begin_checkout,
        COUNT(*) FILTER (WHERE event = 'order_submitted')::int AS orders,
        COUNT(*) FILTER (WHERE event = 'check_uploaded')::int AS checks,
        COUNT(*) FILTER (WHERE event = 'abandoned_cart_signal')::int AS abandoned
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '14 days'
    `),
  ])

  const c = checkout.rows[0] || {}
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
        <Panel title="Eventlar" rows={summary.rows} />
        <Panel title="Top mahsulotlar" rows={products.rows} />
      </div>
    </div>
  )
}

function Metric({ label, value }: Row) {
  return <div className="analytics-card"><div className="summary-label">{label}</div><div className="analytics-value">{value}</div></div>
}

function Panel({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="analytics-card">
      <h2>{title}</h2>
      <div className="analytics-list">
        {rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}
      </div>
    </div>
  )
}
