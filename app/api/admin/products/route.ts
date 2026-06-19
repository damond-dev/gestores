import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, description, price, commission, stock, status, image_url } = await req.json()

  try {
    const rows = await sql`
      INSERT INTO products (name, description, price, commission, stock, status, image_url)
      VALUES (${name}, ${description}, ${price}, ${commission}, ${stock}, ${status}, ${image_url})
      RETURNING *
    `
    return NextResponse.json({ success: true, product: rows[0] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}