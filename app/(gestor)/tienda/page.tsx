'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Search, ShoppingCart, Package, Plus, Minus } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function TiendaPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { addToCart, items, updateQuantity, removeFromCart } = useCart()

  useEffect(() => {
  async function fetchProducts() {
    const res = await fetch('/api/products')
    const data = await res.json()

    setProducts(data.products || [])
    setLoading(false)
  }

  fetchProducts()
}, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.product.id === productId)
    return item?.quantity || 0
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
    toast.success(`${product.name} añadido al carrito`)
  }

  const handleUpdateQuantity = (product: Product, delta: number) => {
    const currentQty = getCartQuantity(product.id)
    const newQty = currentQty + delta

    if (newQty <= 0) {
      removeFromCart(product.id)
      toast.info(`${product.name} eliminado del carrito`)
    } else if (newQty > product.stock) {
      toast.error(`Solo hay ${product.stock} unidades disponibles`)
    } else {
      updateQuantity(product.id, newQty)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tienda</h1>
          <p className="text-muted-foreground">
            Selecciona productos para vender
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <p className="mt-4 text-muted-foreground">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const cartQuantity = getCartQuantity(product.id)
            return (
              <Card key={product.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">
                      {product.name}
                    </CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {product.stock} uds
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
  {product.image_url && (
    <div className="mb-3 rounded-md overflow-hidden aspect-square bg-muted">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-full object-cover"
      />
    </div>
  )}
  {product.description && (
    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
      {product.description}
    </p>
  )}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Precio:</span>
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tu comisión:</span>
                      <span className="font-medium text-primary">{formatCurrency(product.commission)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  {cartQuantity === 0 ? (
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Añadir al carrito
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(product, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-lg px-4">
                        {cartQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(product, 1)}
                        disabled={cartQuantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
