import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export default pool

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: number
  name: string
  emoji: string
  description: string | null
  sort_order: number
}

export interface ProductStock {
  size: string
  quantity: number
  reserved: number
  available: number
  sort_order: number
}

export interface Product {
  id: number
  category_id: number
  category_name: string
  category_emoji: string
  name: string
  description: string | null
  price: number
  discount_percent: number
  final_price: number
  photo_url: string | null
  in_stock: boolean
  team: string | null
  season: string | null
  kit_type: string | null
  league: string | null
  brand: string | null
  model: string | null
  customization_status: 'available_paid' | 'included_bonus' | 'not_available'
  customization_price: number
  is_customizable: boolean
  is_featured: boolean
  is_top_forma: boolean
  is_premium_boot: boolean
  stocks: ProductStock[]
  avg_rating: number
  review_count: number
}

export interface CartItem {
  product_id: number
  name: string
  price: number
  qty: number
  size: string | null
  back_print: string | null
  photo_url: string | null
}

export interface Review {
  id: number
  rating: number
  text: string | null
  user_name: string
  created_at: string
  product_name?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRODUCT_SELECT = `
  SELECT
    p.id,
    p.category_id,
    p.name,
    p.description,
    p.price,
    p.discount_percent,
    p.photo_url,
    p.in_stock,
    p.team,
    p.season,
    p.kit_type,
    p.league,
    p.brand,
    p.model,
    COALESCE(p.customization_status, 'not_available')  AS customization_status,
    COALESCE(p.customization_price, 50000)              AS customization_price,
    COALESCE(p.is_customizable, false)                  AS is_customizable,
    COALESCE(p.is_featured, false)                      AS is_featured,
    COALESCE(p.is_top_forma, false)                     AS is_top_forma,
    COALESCE(p.is_premium_boot, false)                  AS is_premium_boot,
    CASE
      WHEN p.discount_percent > 0
      THEN ROUND((p.price * (1 - p.discount_percent / 100))::numeric, 0)
      ELSE p.price
    END AS final_price,
    c.name  AS category_name,
    c.emoji AS category_emoji,
    COALESCE(AVG(r.rating), 0)::float AS avg_rating,
    COUNT(r.id)::int                  AS review_count
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN reviews r ON r.product_id = p.id AND r.is_visible = true
  WHERE p.is_active = true
`

function attachStocks(products: any[], stocks: any[]): Product[] {
  return products.map((p) => ({
    ...p,
    avg_rating: parseFloat(p.avg_rating),
    review_count: parseInt(p.review_count),
    stocks: stocks
      .filter((s) => s.product_id === p.id)
      .map((s) => ({
        size: s.size,
        quantity: s.quantity,
        reserved: s.reserved ?? 0,
        available: Math.max(0, s.quantity - (s.reserved ?? 0)),
        sort_order: s.sort_order,
      })),
  }))
}

async function loadStocks(productIds: number[]) {
  if (productIds.length === 0) return []
  const { rows } = await pool.query(
    `SELECT product_id, size, quantity, reserved, sort_order
     FROM product_stocks
     WHERE product_id = ANY($1)
     ORDER BY sort_order`,
    [productIds]
  )
  return rows
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query(
    `SELECT id, name, emoji, description, sort_order
     FROM categories
     WHERE is_active = true AND id != 4
     ORDER BY sort_order`
  )
  return rows
}

export interface ProductFilter {
  categoryId?: number
  query?: string
  team?: string
  brand?: string
  league?: string
  season?: string
  kitType?: string
  featured?: boolean
  topForma?: boolean
  premiumBoot?: boolean
}

export async function getProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const conditions: string[] = ['p.category_id != 4']
  const params: any[] = []
  let i = 1

  const add = (cond: string, val: any) => {
    conditions.push(cond.replace('?', `$${i++}`))
    params.push(val)
  }

  if (filter.categoryId) add('p.category_id = ?', filter.categoryId)
  if (filter.query)      add('p.name ILIKE ?',    `%${filter.query}%`)
  if (filter.team)       add('p.team ILIKE ?',    `%${filter.team}%`)
  if (filter.brand)      add('p.brand ILIKE ?',   `%${filter.brand}%`)
  if (filter.league)     add('p.league ILIKE ?',  `%${filter.league}%`)
  if (filter.season)     add('p.season ILIKE ?',  `%${filter.season}%`)
  if (filter.kitType)    add('p.kit_type ILIKE ?', `%${filter.kitType}%`)
  if (filter.featured)   conditions.push('p.is_featured = true')
  if (filter.topForma)   conditions.push('p.is_top_forma = true')
  if (filter.premiumBoot) conditions.push('p.is_premium_boot = true')

  const where = conditions.map((c) => `AND ${c}`).join('\n  ')
  const { rows } = await pool.query(
    `${PRODUCT_SELECT} ${where} GROUP BY p.id, c.name, c.emoji ORDER BY p.id DESC`,
    params
  )

  const stocks = await loadStocks(rows.map((r: any) => r.id))
  return attachStocks(rows, stocks)
}

export async function getProductById(id: number): Promise<Product | null> {
  const { rows } = await pool.query(
    `${PRODUCT_SELECT} AND p.id = $1 GROUP BY p.id, c.name, c.emoji`,
    [id]
  )
  if (!rows[0]) return null
  const stocks = await loadStocks([id])
  return attachStocks(rows, stocks)[0]
}

export async function getReviews(productId?: number): Promise<Review[]> {
  const where = productId ? 'AND r.product_id = $1' : ''
  const params = productId ? [productId] : []
  const { rows } = await pool.query(
    `SELECT r.id, r.rating, r.text, r.created_at,
            u.full_name AS user_name,
            p.name      AS product_name
     FROM reviews r
     JOIN users u        ON u.id = r.user_id
     LEFT JOIN products p ON p.id = r.product_id
     WHERE r.is_visible = true ${where}
     ORDER BY r.created_at DESC
     LIMIT 20`,
    params
  )
  return rows
}

// ─── Order creation (clean, no reflection) ────────────────────────────────────

export async function createOrder(data: {
  customer_name: string
  customer_phone: string
  address: string
  payment_type: string
  items: CartItem[]
  total: number
}): Promise<number> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // User: telefon raqami bilan topish yoki yaratish
    const phone = data.customer_phone.replace(/\s+/g, '').trim()
    let userId: number

    // Saytdan kelgan buyurtmalar uchun telefon raqamini ID sifatida ishlatamiz
    const fakeId = -(Math.abs(hashCode(phone)) % 1_000_000_000 + 1_000_000_000)

    const existingUser = await client.query(
      `SELECT id FROM users WHERE telegram_id = $1`,
      [fakeId]
    )

    if (existingUser.rows[0]) {
      userId = existingUser.rows[0].id
      // Ism yangilash
      await client.query(
        `UPDATE users SET full_name = $1 WHERE id = $2`,
        [data.customer_name, userId]
      )
    } else {
      const userRes = await client.query(
        `INSERT INTO users (telegram_id, full_name, phone)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [fakeId, data.customer_name, phone]
      )
      userId = userRes.rows[0].id
    }

    // Order yaratish
    const orderRes = await client.query(
      `INSERT INTO orders
         (user_id, status, payment_type, delivery_address, comment,
          customer_name, customer_phone, total_price)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userId,
        data.payment_type,
        data.address,
        `Saytdan buyurtma | ${data.customer_name} | ${phone}`,
        data.customer_name,
        phone,
        data.total,
      ]
    )
    const orderId: number = orderRes.rows[0].id

    // Order items
    for (const item of data.items) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, quantity, price_at_order, size, player_name, back_print)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [
          orderId,
          item.product_id,
          item.qty,
          item.price,
          item.size ?? null,
          item.back_print ?? null,
        ]
      )

      // Soft-reserve stock
      if (item.size) {
        await client.query(
          `UPDATE product_stocks
           SET reserved = LEAST(quantity, reserved + $1)
           WHERE product_id = $2 AND size = $3`,
          [item.qty, item.product_id, item.size]
        )
      }
    }

    await client.query('COMMIT')
    return orderId
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return hash
}
