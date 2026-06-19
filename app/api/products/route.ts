import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const products = await sql`
      SELECT * FROM products
      WHERE status = 'disponible' AND stock > 0
      ORDER BY name
    `
    return NextResponse.json({ products })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}