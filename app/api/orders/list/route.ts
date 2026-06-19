import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  try {
    const orders = await sql`
      SELECT * FROM orders
      WHERE gestor_id = ${userId}
      ORDER BY created_at DESC
    `

    const orderItems = await sql`
      SELECT oi.* FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.gestor_id = ${userId}
    `

    const ordersWithItems = orders.map(order => ({
      ...order,
      order_items: orderItems.filter(item => item.order_id === order.id)
    }))

    return NextResponse.json({ orders: ordersWithItems })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}