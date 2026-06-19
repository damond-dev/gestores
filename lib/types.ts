export interface Profile {
  id: string
  username: string
  access_code: string
  role: string
  total_commission: number
  total_items_sold: number
  created_at?: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  commission: number
  image_url: string | null
  status: 'disponible' | 'agotado'
  stock: number
  created_at: string
}

export interface Order {
  id: string
  gestor_id: string
  gestor_username: string
  total_amount: number
  total_commission: number
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  unit_commission: number
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}
