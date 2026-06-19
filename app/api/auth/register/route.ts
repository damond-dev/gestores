import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { username, password, accessCode } = await req.json()

  if (!accessCode.startsWith('GESTOR-')) {
    return NextResponse.json(
      { success: false, error: 'Código inválido. Contacta con la administración.' },
      { status: 400 }
    )
  }

  const existingCode = await sql`SELECT id FROM profiles WHERE access_code = ${accessCode}`
  if (existingCode.length > 0) {
    return NextResponse.json(
      { success: false, error: 'El código de acceso ya está en uso' },
      { status: 400 }
    )
  }

  const existingUser = await sql`SELECT id FROM profiles WHERE username = ${username}`
  if (existingUser.length > 0) {
    return NextResponse.json(
      { success: false, error: 'El nombre de usuario ya existe' },
      { status: 400 }
    )
  }

  const rows = await sql`
    INSERT INTO profiles (username, password, access_code, role, total_commission, total_items_sold)
    VALUES (${username}, ${password}, ${accessCode}, 'gestor', 0, 0)
    RETURNING *
  `

  return NextResponse.json({ success: true, profile: rows[0] })
}