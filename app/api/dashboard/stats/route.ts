import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  try {
    const profileRows = await sql`
      SELECT total_commission, total_items_sold
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `

    const countRows = await sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE gestor_id = ${userId}
    `

    const recentOrders = await sql`
      SELECT * FROM orders
      WHERE gestor_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 5
    `

    return NextResponse.json({
      totalCommission: profileRows[0]?.total_commission || 0,
      totalItemsSold: profileRows[0]?.total_items_sold || 0,
      totalOrders: Number(countRows[0]?.count) || 0,
      recentOrders,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}