'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function CarritoPage() {
  const { user } = useAuth()
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount, totalCommission } = useCart()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleCheckout = async () => {
    if (!user || items.length === 0) return

    setLoading(true)

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          gestor_id: user.id,
          gestor_username: user.username,
          total_amount: totalAmount,
          total_commission: totalCommission
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        unit_commission: item.product.commission
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update product stock
      for (const item of items) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id)
      }

      // Update user stats
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
      await supabase
        .from('profiles')
        .update({
          total_commission: user.total_commission + totalCommission,
          total_items_sold: user.total_items_sold + totalItems
        })
        .eq('id', user.id)

      clearCart()
      toast.success('Pedido realizado con éxito')
      router.push('/pedidos')
    } catch {
      toast.error('Error al procesar el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Carrito</h1>
          <p className="text-muted-foreground">
            Revisa y confirma tus productos
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">Tu carrito está vacío</h3>
            <p className="mt-2 text-muted-foreground">
              Visita la tienda para añadir productos
            </p>
            <Button className="mt-6" asChild>
              <Link href="/tienda">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ir a la tienda
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carrito</h1>
          <p className="text-muted-foreground">
            {items.length} producto{items.length !== 1 ? 's' : ''} en tu carrito
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/tienda">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Seguir comprando
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Precio: {formatCurrency(item.product.price)}</span>
                      <span className="text-primary">
                        Comisión: {formatCurrency(item.product.commission)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <p className="font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                    <p className="text-sm text-primary">
                      +{formatCurrency(item.product.commission * item.quantity)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      removeFromCart(item.product.id)
                      toast.info(`${item.product.name} eliminado del carrito`)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-primary">
                <span>Tu comisión</span>
                <span className="font-medium">+{formatCurrency(totalCommission)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Pedido
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  clearCart()
                  toast.info('Carrito vaciado')
                }}
              >
                Vaciar carrito
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
