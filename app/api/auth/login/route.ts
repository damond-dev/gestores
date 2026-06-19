import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const rows = await sql`
    SELECT * FROM profiles
    WHERE username = ${username} AND password = ${password}
    LIMIT 1
  `

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Usuario o contraseña incorrectos' },
      { status: 401 }
    )
  }

  return NextResponse.json({ success: true, profile: rows[0] })
}