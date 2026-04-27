import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export default pool

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

export interface ProductFilter {
  categoryId?: number
  team?: string
  teamId?: number
  brand?: string
  brandId?: number
  search?: string
  query?: string
  mainCategory?: string
  productType?: string
  league?: string
  leagueOrGroup?: string
  season?: string
  kitType?: string
  featured?: boolean
  topForma?: boolean
  premiumBoot?: boolean
}

type Queryable = Pick<Pool | PoolClient, 'query'>
type Primitive = string | number | boolean | null

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Formlar', emoji: 'FM', description: 'Klub va milliy jamoa formalari', sort_order: 1 },
  { id: 2, name: 'Retro formalar', emoji: 'RT', description: 'Klassik va vintage formalar', sort_order: 2 },
  { id: 3, name: 'Butsiylar', emoji: 'BT', description: 'Futbol butsiylari va aksessuarlar', sort_order: 3 },
]

const columnCache = new Map<string, Promise<Set<string>>>()

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

async function getTableColumns(tableName: string, client: Queryable = pool): Promise<Set<string>> {
  if (!hasDatabase()) return new Set()

  const cacheKey = client === pool ? tableName : ''
  if (cacheKey && columnCache.has(cacheKey)) {
    return columnCache.get(cacheKey)!
  }

  const loader = client
    .query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName]
    )
    .then(({ rows }) => new Set(rows.map((row) => row.column_name)))
    .catch((error) => {
      console.error(`Schema lookup failed for ${tableName}:`, error)
      return new Set<string>()
    })

  if (cacheKey) columnCache.set(cacheKey, loader)
  return loader
}

function productField(columns: Set<string>, column: string, fallback: string, alias = column) {
  return columns.has(column) ? `p.${column} AS ${alias}` : `${fallback} AS ${alias}`
}

function categoryField(columns: Set<string>, column: string, fallback: string, alias = column) {
  return columns.has(column) ? `c.${column} AS ${alias}` : `${fallback} AS ${alias}`
}

function addParam(params: Primitive[], value: Primitive) {
  params.push(value)
  return `$${params.length}`
}

function addTextFilter(
  conditions: string[],
  params: Primitive[],
  value: string | undefined,
  fields: string[]
) {
  const trimmed = value?.trim()
  if (!trimmed || fields.length === 0) return

  const placeholder = addParam(params, `%${trimmed}%`)
  conditions.push(`(${fields.map((field) => `${field} ILIKE ${placeholder}`).join(' OR ')})`)
}

function addMainCategoryFilter(
  conditions: string[],
  params: Primitive[],
  value: string | undefined,
  productColumns: Set<string>,
  categoryColumns: Set<string>
) {
  if (!value?.trim()) return

  if (productColumns.has('main_category')) {
    conditions.push(`p.main_category = ${addParam(params, value.trim())}`)
    return
  }

  const normalized = value.toLowerCase()
  const categoryName = categoryColumns.has('name') ? 'c.name' : null
  const productName = productColumns.has('name') ? 'p.name' : null
  const brand = productColumns.has('brand') ? 'p.brand' : null
  const fields = [categoryName, productName, brand].filter(Boolean) as string[]

  if (normalized.includes('retro')) {
    addTextFilter(conditions, params, 'retro', fields)
  } else if (normalized.includes('butsi') || normalized.includes('boot')) {
    addTextFilter(conditions, params, 'but', fields)
  } else if (normalized.includes('forma') || normalized.includes('jersey')) {
    addTextFilter(conditions, params, 'forma', fields)
  }
}

function addProductTypeFilter(
  conditions: string[],
  params: Primitive[],
  value: string | undefined,
  productColumns: Set<string>,
  categoryColumns: Set<string>
) {
  if (!value?.trim()) return

  if (productColumns.has('product_type')) {
    conditions.push(`p.product_type = ${addParam(params, value.trim())}`)
    return
  }

  const normalized = value.toLowerCase()
  if (normalized.includes('boot') || normalized.includes('sock') || normalized.includes('accessory')) {
    addMainCategoryFilter(conditions, params, 'BUTSIYLAR', productColumns, categoryColumns)
  } else if (normalized.includes('retro')) {
    addMainCategoryFilter(conditions, params, 'RETRO_FORMALAR', productColumns, categoryColumns)
  } else if (normalized.includes('jersey') || normalized.includes('forma')) {
    addMainCategoryFilter(conditions, params, 'FORMLAR', productColumns, categoryColumns)
  }
}

async function buildProductQuery(filter: ProductFilter = {}, productId?: number) {
  const productColumns = await getTableColumns('products')
  const categoryColumns = await getTableColumns('categories')
  const reviewColumns = await getTableColumns('reviews')
  const params: Primitive[] = []
  const conditions: string[] = ['1 = 1']

  const hasCategories = categoryColumns.size > 0 && productColumns.has('category_id')
  const hasReviews = reviewColumns.has('product_id') && reviewColumns.has('rating')

  if (productColumns.has('is_active')) conditions.push('p.is_active = true')
  if (productColumns.has('category_id')) conditions.push('p.category_id != 4')
  if (productId !== undefined) conditions.push(`p.id = ${addParam(params, productId)}`)

  if (filter.categoryId && productColumns.has('category_id')) {
    conditions.push(`p.category_id = ${addParam(params, filter.categoryId)}`)
  }

  const search = filter.search ?? filter.query
  const searchFields = [
    productColumns.has('name') ? 'p.name' : null,
    productColumns.has('description') ? 'p.description' : null,
    productColumns.has('team') ? 'p.team' : null,
    productColumns.has('brand') ? 'p.brand' : null,
    productColumns.has('model') ? 'p.model' : null,
    hasCategories && categoryColumns.has('name') ? 'c.name' : null,
  ].filter(Boolean) as string[]
  addTextFilter(conditions, params, search, searchFields)

  if (filter.teamId && productColumns.has('team_id')) {
    conditions.push(`p.team_id = ${addParam(params, filter.teamId)}`)
  }
  addTextFilter(
    conditions,
    params,
    filter.team,
    [productColumns.has('team') ? 'p.team' : null, productColumns.has('name') ? 'p.name' : null].filter(Boolean) as string[]
  )

  if (filter.brandId && productColumns.has('brand_id')) {
    conditions.push(`p.brand_id = ${addParam(params, filter.brandId)}`)
  }
  addTextFilter(
    conditions,
    params,
    filter.brand,
    [productColumns.has('brand') ? 'p.brand' : null, productColumns.has('name') ? 'p.name' : null].filter(Boolean) as string[]
  )

  addTextFilter(
    conditions,
    params,
    filter.league ?? filter.leagueOrGroup,
    [productColumns.has('league') ? 'p.league' : null, hasCategories && categoryColumns.has('name') ? 'c.name' : null].filter(Boolean) as string[]
  )
  addTextFilter(conditions, params, filter.season, [productColumns.has('season') ? 'p.season' : null].filter(Boolean) as string[])
  addTextFilter(conditions, params, filter.kitType, [productColumns.has('kit_type') ? 'p.kit_type' : null].filter(Boolean) as string[])

  addMainCategoryFilter(conditions, params, filter.mainCategory, productColumns, categoryColumns)
  addProductTypeFilter(conditions, params, filter.productType, productColumns, categoryColumns)

  if (filter.featured && productColumns.has('is_featured')) conditions.push('p.is_featured = true')
  if (filter.topForma && productColumns.has('is_top_forma')) conditions.push('p.is_top_forma = true')
  if (filter.premiumBoot && productColumns.has('is_premium_boot')) conditions.push('p.is_premium_boot = true')

  const categoryJoin = hasCategories ? 'LEFT JOIN categories c ON c.id = p.category_id' : ''
  const reviewJoin = hasReviews
    ? `LEFT JOIN (
         SELECT product_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS review_count
         FROM reviews
         ${reviewColumns.has('is_visible') ? 'WHERE is_visible = true' : ''}
         GROUP BY product_id
       ) rv ON rv.product_id = p.id`
    : ''

  const select = `
    SELECT
      ${productField(productColumns, 'id', '0')},
      ${productField(productColumns, 'category_id', '0')},
      ${productField(productColumns, 'name', `'FORMACHI mahsuloti'`)},
      ${productField(productColumns, 'description', 'NULL::text')},
      ${productField(productColumns, 'price', '0')},
      ${productField(productColumns, 'discount_percent', '0')},
      ${productField(productColumns, 'photo_url', 'NULL::text')},
      ${productField(productColumns, 'in_stock', 'true')},
      ${productField(productColumns, 'team', 'NULL::text')},
      ${productField(productColumns, 'season', 'NULL::text')},
      ${productField(productColumns, 'kit_type', 'NULL::text')},
      ${productField(productColumns, 'league', 'NULL::text')},
      ${productField(productColumns, 'brand', 'NULL::text')},
      ${productField(productColumns, 'model', 'NULL::text')},
      ${productColumns.has('customization_status') ? `COALESCE(p.customization_status, 'not_available')` : `'not_available'`} AS customization_status,
      ${productColumns.has('customization_price') ? `COALESCE(p.customization_price, 50000)` : '50000'} AS customization_price,
      ${productColumns.has('is_customizable') ? `COALESCE(p.is_customizable, false)` : 'false'} AS is_customizable,
      ${productColumns.has('is_featured') ? `COALESCE(p.is_featured, false)` : 'false'} AS is_featured,
      ${productColumns.has('is_top_forma') ? `COALESCE(p.is_top_forma, false)` : 'false'} AS is_top_forma,
      ${productColumns.has('is_premium_boot') ? `COALESCE(p.is_premium_boot, false)` : 'false'} AS is_premium_boot,
      CASE
        WHEN ${productColumns.has('discount_percent') ? 'COALESCE(p.discount_percent, 0)' : '0'} > 0
        THEN ROUND((${productColumns.has('price') ? 'COALESCE(p.price, 0)' : '0'} * (1 - ${productColumns.has('discount_percent') ? 'COALESCE(p.discount_percent, 0)' : '0'} / 100))::numeric, 0)
        ELSE ${productColumns.has('price') ? 'COALESCE(p.price, 0)' : '0'}
      END AS final_price,
      ${hasCategories ? categoryField(categoryColumns, 'name', `'Katalog'`, 'category_name') : `'Katalog' AS category_name`},
      ${hasCategories ? categoryField(categoryColumns, 'emoji', `'FM'`, 'category_emoji') : `'FM' AS category_emoji`},
      ${hasReviews ? 'COALESCE(rv.avg_rating, 0)::float' : '0::float'} AS avg_rating,
      ${hasReviews ? 'COALESCE(rv.review_count, 0)::int' : '0::int'} AS review_count
    FROM products p
    ${categoryJoin}
    ${reviewJoin}
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.id DESC
  `

  return { sql: select, params }
}

function normalizeProduct(row: any, stocks: any[]): Product {
  const price = Number(row.price ?? 0)
  const discount = Number(row.discount_percent ?? 0)
  const finalPrice = Number(row.final_price ?? (discount > 0 ? Math.round(price * (1 - discount / 100)) : price))
  const customizationStatus = ['available_paid', 'included_bonus', 'not_available'].includes(row.customization_status)
    ? row.customization_status
    : 'not_available'

  return {
    id: Number(row.id),
    category_id: Number(row.category_id ?? 0),
    category_name: row.category_name ?? 'Katalog',
    category_emoji: row.category_emoji ?? 'FM',
    name: row.name ?? 'FORMACHI mahsuloti',
    description: row.description ?? null,
    price,
    discount_percent: discount,
    final_price: finalPrice,
    photo_url: row.photo_url ?? null,
    in_stock: row.in_stock ?? true,
    team: row.team ?? null,
    season: row.season ?? null,
    kit_type: row.kit_type ?? null,
    league: row.league ?? null,
    brand: row.brand ?? null,
    model: row.model ?? null,
    customization_status: customizationStatus,
    customization_price: Number(row.customization_price ?? 50000),
    is_customizable: Boolean(row.is_customizable || customizationStatus !== 'not_available'),
    is_featured: Boolean(row.is_featured),
    is_top_forma: Boolean(row.is_top_forma),
    is_premium_boot: Boolean(row.is_premium_boot),
    avg_rating: Number(row.avg_rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    stocks: stocks
      .filter((stock) => Number(stock.product_id) === Number(row.id))
      .map((stock) => {
        const quantity = Number(stock.quantity ?? 0)
        const reserved = Number(stock.reserved ?? 0)
        return {
          size: String(stock.size),
          quantity,
          reserved,
          available: Math.max(0, quantity - reserved),
          sort_order: Number(stock.sort_order ?? 0),
        }
      }),
  }
}

async function loadStocks(productIds: number[]) {
  if (!hasDatabase() || productIds.length === 0) return []

  const stockColumns = await getTableColumns('product_stocks')
  if (!stockColumns.has('product_id') || !stockColumns.has('size') || !stockColumns.has('quantity')) {
    return []
  }

  const sortOrderSelect = stockColumns.has('sort_order') ? 'sort_order' : '0 AS sort_order'
  const reservedSelect = stockColumns.has('reserved') ? 'reserved' : '0 AS reserved'
  const orderBy = stockColumns.has('sort_order') ? 'ORDER BY sort_order' : 'ORDER BY size'

  const { rows } = await pool.query(
    `SELECT product_id, size, quantity, ${reservedSelect}, ${sortOrderSelect}
     FROM product_stocks
     WHERE product_id = ANY($1)
     ${orderBy}`,
    [productIds]
  )

  return rows
}

export async function getCategories(): Promise<Category[]> {
  try {
    if (!hasDatabase()) return FALLBACK_CATEGORIES

    const columns = await getTableColumns('categories')
    if (!columns.has('id') || !columns.has('name')) return FALLBACK_CATEGORIES

    const where = columns.has('is_active') ? 'WHERE is_active = true AND id != 4' : 'WHERE id != 4'
    const orderBy = columns.has('sort_order') ? 'ORDER BY sort_order' : 'ORDER BY id'
    const { rows } = await pool.query(
      `SELECT
         id,
         name,
         ${columns.has('emoji') ? 'emoji' : `'FM' AS emoji`},
         ${columns.has('description') ? 'description' : 'NULL::text AS description'},
         ${columns.has('sort_order') ? 'sort_order' : 'id AS sort_order'}
       FROM categories
       ${where}
       ${orderBy}`
    )

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      emoji: row.emoji ?? 'FM',
      description: row.description ?? null,
      sort_order: Number(row.sort_order ?? row.id),
    }))
  } catch (error) {
    console.error('getCategories failed:', error)
    return FALLBACK_CATEGORIES
  }
}

export async function getProducts(filter: ProductFilter = {}): Promise<Product[]> {
  try {
    if (!hasDatabase()) return []

    const productColumns = await getTableColumns('products')
    if (!productColumns.has('id')) return []

    const { sql, params } = await buildProductQuery(filter)
    const { rows } = await pool.query(sql, params)
    const stocks = await loadStocks(rows.map((row) => Number(row.id)).filter(Boolean))

    return rows.map((row) => normalizeProduct(row, stocks))
  } catch (error) {
    console.error('getProducts failed:', error)
    return []
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    if (!hasDatabase() || !Number.isFinite(id)) return null

    const productColumns = await getTableColumns('products')
    if (!productColumns.has('id')) return null

    const { sql, params } = await buildProductQuery({}, id)
    const { rows } = await pool.query(sql, params)
    if (!rows[0]) return null

    const stocks = await loadStocks([id])
    return normalizeProduct(rows[0], stocks)
  } catch (error) {
    console.error('getProductById failed:', error)
    return null
  }
}

export async function getReviews(productId?: number): Promise<Review[]> {
  try {
    if (!hasDatabase()) return []

    const reviewColumns = await getTableColumns('reviews')
    if (!reviewColumns.has('id') || !reviewColumns.has('rating')) return []

    const userColumns = await getTableColumns('users')
    const productColumns = await getTableColumns('products')
    const params: Primitive[] = []
    const conditions: string[] = ['1 = 1']

    if (reviewColumns.has('is_visible')) conditions.push('r.is_visible = true')
    if (productId && reviewColumns.has('product_id')) {
      conditions.push(`r.product_id = ${addParam(params, productId)}`)
    }

    const userJoin = reviewColumns.has('user_id') && userColumns.has('id')
      ? 'LEFT JOIN users u ON u.id = r.user_id'
      : ''
    const productJoin = reviewColumns.has('product_id') && productColumns.has('id')
      ? 'LEFT JOIN products p ON p.id = r.product_id'
      : ''
    const userName = userJoin && userColumns.has('full_name')
      ? `COALESCE(u.full_name, 'FORMACHI mijoz') AS user_name`
      : `'FORMACHI mijoz' AS user_name`
    const productName = productJoin && productColumns.has('name')
      ? 'p.name AS product_name'
      : 'NULL::text AS product_name'
    const textField = reviewColumns.has('text') ? 'r.text' : 'NULL::text AS text'
    const createdAt = reviewColumns.has('created_at') ? 'r.created_at' : 'NOW() AS created_at'
    const orderBy = reviewColumns.has('created_at') ? 'r.created_at DESC' : 'r.id DESC'

    const { rows } = await pool.query(
      `SELECT r.id, r.rating, ${textField}, ${createdAt}, ${userName}, ${productName}
       FROM reviews r
       ${userJoin}
       ${productJoin}
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT 20`,
      params
    )

    return rows.map((row) => ({
      id: Number(row.id),
      rating: Number(row.rating ?? 0),
      text: row.text ?? null,
      user_name: row.user_name ?? 'FORMACHI mijoz',
      created_at: String(row.created_at),
      product_name: row.product_name ?? undefined,
    }))
  } catch (error) {
    console.error('getReviews failed:', error)
    return []
  }
}

export async function createOrder(data: {
  telegram_id?: number
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

    const userColumns = await getTableColumns('users', client)
    const orderColumns = await getTableColumns('orders', client)
    const itemColumns = await getTableColumns('order_items', client)

    if (!userColumns.has('id') || !orderColumns.has('id') || !itemColumns.has('order_id')) {
      throw new Error('Order database tables are not ready')
    }

    const phone = data.customer_phone.replace(/\s+/g, '').trim()
    const fakeTelegramId =
      data.telegram_id || -(Math.abs(hashCode(phone || `${Date.now()}`)) % 1_000_000_000 + 1_000_000_000)
    let userId: number | null = null

    if (userColumns.has('telegram_id')) {
      const existing = await client.query('SELECT id FROM users WHERE telegram_id = $1 LIMIT 1', [fakeTelegramId])
      userId = existing.rows[0]?.id ?? null
    }

    if (userId) {
      if (userColumns.has('full_name')) {
        await client.query('UPDATE users SET full_name = $1 WHERE id = $2', [data.customer_name, userId])
      }
    } else {
      const userInsertColumns: string[] = []
      const userInsertValues: Primitive[] = []
      const addUserValue = (column: string, value: Primitive) => {
        if (userColumns.has(column)) {
          userInsertColumns.push(column)
          userInsertValues.push(value)
        }
      }

      addUserValue('telegram_id', fakeTelegramId)
      addUserValue('full_name', data.customer_name)
      addUserValue('phone', phone)
      addUserValue('phone_number', phone)

      const placeholders = userInsertValues.map((_, index) => `$${index + 1}`).join(', ')
      const userRes = await client.query(
        `INSERT INTO users (${userInsertColumns.join(', ')})
         VALUES (${placeholders})
         RETURNING id`,
        userInsertValues
      )
      userId = Number(userRes.rows[0].id)
    }

    const statusValue = await getEnumCompatibleValue(client, 'orders', 'status', 'pending')
    const paymentValue = await getEnumCompatibleValue(client, 'orders', 'payment_type', data.payment_type)
    const orderInsertColumns: string[] = []
    const orderInsertValues: Primitive[] = []
    const addOrderValue = (column: string, value: Primitive) => {
      if (orderColumns.has(column)) {
        orderInsertColumns.push(column)
        orderInsertValues.push(value)
      }
    }

    addOrderValue('user_id', userId)
    addOrderValue('status', statusValue)
    addOrderValue('payment_type', paymentValue)
    addOrderValue('payment_method', data.payment_type)
    addOrderValue('delivery_address', data.address)
    addOrderValue('address', data.address)
    addOrderValue('comment', `Saytdan buyurtma | ${data.customer_name} | ${phone}`)
    addOrderValue('customer_name', data.customer_name)
    addOrderValue('customer_phone', phone)
    addOrderValue('phone', phone)
    addOrderValue('total_price', data.total)
    addOrderValue('total', data.total)
    addOrderValue('total_amount', data.total)

    const orderPlaceholders = orderInsertValues.map((_, index) => `$${index + 1}`).join(', ')
    const orderRes = await client.query(
      `INSERT INTO orders (${orderInsertColumns.join(', ')})
       VALUES (${orderPlaceholders})
       RETURNING id`,
      orderInsertValues
    )
    const orderId = Number(orderRes.rows[0].id)

    for (const item of data.items) {
      const itemInsertColumns: string[] = []
      const itemInsertValues: Primitive[] = []
      const addItemValue = (column: string, value: Primitive) => {
        if (itemColumns.has(column)) {
          itemInsertColumns.push(column)
          itemInsertValues.push(value)
        }
      }

      addItemValue('order_id', orderId)
      addItemValue('product_id', item.product_id)
      addItemValue('quantity', item.qty)
      addItemValue('price_at_order', item.price)
      addItemValue('price', item.price)
      addItemValue('unit_price', item.price)
      addItemValue('size', item.size)
      addItemValue('player_name', item.back_print)
      addItemValue('back_print', item.back_print)

      const itemPlaceholders = itemInsertValues.map((_, index) => `$${index + 1}`).join(', ')
      await client.query(
        `INSERT INTO order_items (${itemInsertColumns.join(', ')})
         VALUES (${itemPlaceholders})`,
        itemInsertValues
      )

      const stockColumns = await getTableColumns('product_stocks', client)
      if (item.size && stockColumns.has('reserved') && stockColumns.has('product_id') && stockColumns.has('size')) {
        await client.query(
          `UPDATE product_stocks
           SET reserved = LEAST(quantity, COALESCE(reserved, 0) + $1)
           WHERE product_id = $2 AND size = $3`,
          [item.qty, item.product_id, item.size]
        )
      }
    }

    await client.query('COMMIT')
    return orderId
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function getEnumCompatibleValue(
  client: Queryable,
  tableName: string,
  columnName: string,
  value: string
): Promise<string> {
  const { rows } = await client.query<{ enumlabel: string }>(
    `SELECT e.enumlabel
     FROM pg_attribute a
     JOIN pg_class c ON c.oid = a.attrelid
     JOIN pg_type t ON t.oid = a.atttypid
     JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE c.relname = $1 AND a.attname = $2
     ORDER BY e.enumsortorder`,
    [tableName, columnName]
  )

  const labels = rows.map((row) => row.enumlabel)
  if (labels.length === 0) return value
  if (labels.includes(value)) return value
  if (labels.includes(value.toUpperCase())) return value.toUpperCase()
  if (labels.includes('YANGI')) return 'YANGI'
  if (labels.includes('pending')) return 'pending'

  return labels[0]
}

function hashCode(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0
  }
  return hash
}
