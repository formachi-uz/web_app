import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/crud'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const categoryId = searchParams.get('category')
      ? Number(searchParams.get('category'))
      : undefined

    const teamParam = searchParams.get('team')
    const brandParam = searchParams.get('brand')

    const teamId = searchParams.get('teamId')
      ? Number(searchParams.get('teamId'))
      : teamParam && /^\d+$/.test(teamParam)
        ? Number(teamParam)
        : undefined

    const brandId = searchParams.get('brandId')
      ? Number(searchParams.get('brandId'))
      : brandParam && /^\d+$/.test(brandParam)
        ? Number(brandParam)
        : undefined

    const team = teamParam && !/^\d+$/.test(teamParam) ? teamParam : undefined
    const brand = brandParam && !/^\d+$/.test(brandParam) ? brandParam : undefined
    const search = searchParams.get('search') || searchParams.get('q') || undefined
    const mainCategory = searchParams.get('mainCategory') || undefined
    const productType = searchParams.get('productType') || undefined
    const season = searchParams.get('season') || undefined
    const kitType = searchParams.get('kitType') || undefined

    const products = await getProducts({
      categoryId,
      team,
      teamId,
      brand,
      brandId,
      search,
      mainCategory,
      productType,
      season,
      kitType,
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Mahsulotlarni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
