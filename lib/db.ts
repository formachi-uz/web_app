import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
  sort_order: number
}

export interface Product {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number
  discount_percent: number
  photo_url: string | null
  in_stock: boolean
  final_price: number
  stocks: ProductStock[]
  avg_rating: number
  review_count: number
  category_name?: string
  category_emoji?: string
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

export interface Order {
  id: number
  status: string
  payment_type: string
  delivery_address: string
  comment: string | null
  total_price: number
  created_at: string
}

export interface Review {
  id: number
  rating: number
  text: string | null
  user_name: string
  created_at: string
  product_name?: string
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

export async function getProducts(categoryId?: number): Promise<Product[]> {
  const where = categoryId
    ? `AND p.category_id = $1 AND p.category_id != 4`
    : `AND p.category_id != 4`
  const params = categoryId ? [categoryId] : []

  const { rows } = await pool.query(
    `SELECT
      p.id, p.category_id, p.name, p.description,
      p.price, p.discount_percent, p.photo_url, p.in_stock,
      CASE WHEN p.discount_percent > 0
        THEN p.price * (1 - p.discount_percent / 100)
        ELSE p.price END AS final_price,
      c.name AS category_name, c.emoji AS category_emoji,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN reviews r ON r.product_id = p.id AND r.is_visible = true
    WHERE p.is_active = true ${where}
    GROUP BY p.id, c.name, c.emoji
    ORDER BY p.id DESC`,
    params
  )

  // Stocklarni yuklash
  const productIds = rows.map((r: any) => r.id)
  if (productIds.length === 0) return []

  const { rows: stocks } = await pool.query(
    `SELECT product_id, size, quantity, sort_order
     FROM product_stocks
     WHERE product_id = ANY($1)
     ORDER BY sort_order`,
    [productIds]
  )

  return rows.map((p: any) => ({
    ...p,
    avg_rating: parseFloat(p.avg_rating),
    review_count: parseInt(p.review_count),
    stocks: stocks.filter((s: any) => s.product_id === p.id),
  }))
}

export async function getProductById(id: number): Promise<Product | null> {
  const { rows } = await pool.query(
    `SELECT
      p.id, p.category_id, p.name, p.description,
      p.price, p.discount_percent, p.photo_url, p.in_stock,
      CASE WHEN p.discount_percent > 0
        THEN p.price * (1 - p.discount_percent / 100)
        ELSE p.price END AS final_price,
      c.name AS category_name, c.emoji AS category_emoji,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN reviews r ON r.product_id = p.id AND r.is_visible = true
    WHERE p.id = $1 AND p.is_active = true
    GROUP BY p.id, c.name, c.emoji`,
    [id]
  )
  if (!rows[0]) return null

  const { rows: stocks } = await pool.query(
    `SELECT size, quantity, sort_order FROM product_stocks
     WHERE product_id = $1 ORDER BY sort_order`,
    [id]
  )

  return {
    ...rows[0],
    avg_rating: parseFloat(rows[0].avg_rating),
    review_count: parseInt(rows[0].review_count),
    stocks,
  }
}

export async function getReviews(productId?: number): Promise<Review[]> {
  const where = productId ? 'AND r.product_id = $1' : ''
  const params = productId ? [productId] : []
  const { rows } = await pool.query(
    `SELECT r.id, r.rating, r.text, r.created_at,
            u.full_name AS user_name, p.name AS product_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN products p ON p.id = r.product_id
     WHERE r.is_visible = true ${where}
     ORDER BY r.created_at DESC
     LIMIT 20`,
    params
  )
  return rows
}

export async function createOrder(data: {
  telegram_id: number
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

    const userTelegramId =
      data.telegram_id || -Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 1000)
    const { rows: userColumnRows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`
    )
    const userColumns = new Set(userColumnRows.map((row: { column_name: string }) => row.column_name))
    const userInsertColumns = ['telegram_id', 'full_name']
    const userInsertValues: Array<string | number> = [userTelegramId, data.customer_name]

    if (userColumns.has('phone')) {
      userInsertColumns.push('phone')
      userInsertValues.push(data.customer_phone)
    } else if (userColumns.has('phone_number')) {
      userInsertColumns.push('phone_number')
      userInsertValues.push(data.customer_phone)
    }

    const placeholders = userInsertValues.map((_, index) => `$${index + 1}`).join(', ')

    // User yaratish. Saytdan kelgan har buyurtma uchun alohida vaqtinchalik telegram_id ishlatiladi.
    const userRes = await client.query(
      `INSERT INTO users (${userInsertColumns.join(', ')})
       VALUES (${placeholders})
       RETURNING id`,
      userInsertValues
    )
    const userId = userRes.rows[0].id

    // Order yaratish
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, payment_type, delivery_address, comment, total_price)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING id`,
      [userId, data.payment_type, data.address,
       `Ism: ${data.customer_name} | Tel: ${data.customer_phone}`, data.total]
    )
    const orderId = orderRes.rows[0].id

    const { rows: itemColumnRows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'`
    )
    const itemColumns = new Set(itemColumnRows.map((row: { column_name: string }) => row.column_name))

    // Order items
    for (const item of data.items) {
      const itemInsertColumns = ['order_id', 'product_id', 'quantity', 'price_at_order', 'size']
      const itemInsertValues: Array<string | number | null> = [
        orderId,
        item.product_id,
        item.qty,
        item.price,
        item.size,
      ]

      if (itemColumns.has('player_name')) {
        itemInsertColumns.push('player_name')
        itemInsertValues.push(item.back_print)
      } else if (itemColumns.has('back_print')) {
        itemInsertColumns.push('back_print')
        itemInsertValues.push(item.back_print)
      }

      const itemPlaceholders = itemInsertValues.map((_, index) => `$${index + 1}`).join(', ')

      await client.query(
        `INSERT INTO order_items (${itemInsertColumns.join(', ')})
         VALUES (${itemPlaceholders})`,
        itemInsertValues
      )
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
