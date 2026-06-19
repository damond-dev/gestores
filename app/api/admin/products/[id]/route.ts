import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, description, price, commission, stock, status, image_url } = await req.json()

  try {
    const rows = await sql`
      UPDATE products
      SET name = ${name}, description = ${description}, price = ${price},
          commission = ${commission}, stock = ${stock}, status = ${status},
          image_url = ${image_url}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json({ success: true, product: rows[0] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await sql`DELETE FROM products WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}