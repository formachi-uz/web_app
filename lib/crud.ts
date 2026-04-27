export type ProductFilter = {
  categoryId?: number
  teamId?: number
  brandId?: number
  search?: string
  mainCategory?: string
  productType?: string
  season?: string
  kitType?: string
}

export async function getProducts(filters?: ProductFilter) {
  console.log('Product filters:', filters)

  // TODO: Keyingi bosqichda bu joy PostgreSQL / Prisma bilan ulanadi.
  // Hozircha build o‘tishi uchun bo‘sh array qaytaramiz.
  return []
}
