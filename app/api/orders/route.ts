import { NextRequest, NextResponse } from 'next/server'
import { Pool } from '@neondatabase/serverless'

export async function POST(req: NextRequest) {
  const { userId, username, totalAmount, totalCommission, currentCommission, currentItemsSold, items } = await req.json()

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Crear el pedido
    const orderResult = await client.query(
      `INSERT INTO orders (gestor_id, gestor_username, total_amount, total_commission)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, username, totalAmount, totalCommission]
    )
    const order = orderResult.rows[0]

    // Crear los items del pedido y actualizar stock
    let totalItems = 0
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_commission)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.productId, item.productName, item.quantity, item.unitPrice, item.unitCommission]
      )

      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.productId]
      )

      totalItems += item.quantity
    }

    // Actualizar estadísticas del gestor
    await client.query(
      `UPDATE profiles SET total_commission = $1, total_items_sold = $2 WHERE id = $3`,
      [currentCommission + totalCommission, currentItemsSold + totalItems, userId]
    )

    await client.query('COMMIT')

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    await client.query('ROLLBACK')
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    client.release()
    await pool.end()
  }
}