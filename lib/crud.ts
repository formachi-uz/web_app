export type ProductFilter = {
  categoryId?: number
  teamId?: number
  team?: string
  brandId?: number
  search?: string
  mainCategory?: string
  productType?: string
  season?: string
  kitType?: string
}

const categories = [
  { id: 1, name: 'Formalar', slug: 'formalar' },
  { id: 2, name: 'Retro formalar', slug: 'retro-formalar' },
  { id: 3, name: 'Butsiylar', slug: 'butsiylar' },
]

const products = [
  {
    id: 1,
    slug: 'real-madrid-home-2025',
    name: 'Real Madrid Home 2025',
    team: 'Real Madrid',
    categoryId: 1,
    category: 'Formalar',
    price: 180000,
    oldPrice: 320000,
    image: '/images/products/placeholder.png',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 10,
    status: 'Sotuvda bor',
  },
  {
    id: 2,
    slug: 'barcelona-home-2025',
    name: 'Barcelona Home 2025',
    team: 'Barcelona',
    categoryId: 1,
    category: 'Formalar',
    price: 180000,
    oldPrice: 320000,
    image: '/images/products/placeholder.png',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 8,
    status: 'Sotuvda bor',
  },
  {
    id: 3,
    slug: 'nike-mercurial-premium',
    name: 'Nike Mercurial Premium',
    team: null,
    brand: 'Nike',
    categoryId: 3,
    category: 'Butsiylar',
    price: 350000,
    oldPrice: 450000,
    image: '/images/products/placeholder.png',
    sizes: ['39', '40', '41', '42', '43'],
    stock: 5,
    status: 'Sotuvda bor',
  },
]

export async function getCategories() {
  return categories
}

export async function getProducts(filters?: ProductFilter) {
  let result = [...products]

  if (filters?.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId)
  }

  if (filters?.team) {
    result = result.filter(
      (p) => p.team?.toLowerCase() === filters.team?.toLowerCase()
    )
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.team?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }

  return result
}
