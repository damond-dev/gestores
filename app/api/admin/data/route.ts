import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const gestores = await sql`SELECT * FROM profiles ORDER BY created_at DESC`
    const products = await sql`SELECT * FROM products ORDER BY name`
    const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 50`

    return NextResponse.json({ gestores, products, orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}