'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react'
import type { Order } from '@/lib/types'

interface DailyStats {
  date: string
  orders: number
  commission: number
  items: number
}

export default function EstadisticasPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCommission: 0,
    totalItemsSold: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailyStats: [] as DailyStats[]
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      if (!user) return

      // Fetch profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_commission, total_items_sold')
        .eq('id', user.id)
        .single()

      // Fetch all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('gestor_id', user.id)
        .order('created_at', { ascending: false })

      // Calculate daily stats for last 7 days
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      const dailyStats = last7Days.map(date => {
        const dayOrders = orders?.filter(o => 
          o.created_at.split('T')[0] === date
        ) || []
        
        return {
          date,
          orders: dayOrders.length,
          commission: dayOrders.reduce((sum, o) => sum + Number(o.total_commission), 0),
          items: dayOrders.length // Simplified
        }
      })

      const totalOrders = orders?.length || 0
      const totalCommission = profile?.total_commission || 0

      setStats({
        totalCommission,
        totalItemsSold: profile?.total_items_sold || 0,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalCommission / totalOrders : 0,
        dailyStats
      })
      setLoading(false)
    }

    fetchStats()
  }, [user, supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'short',
      day: 'numeric'
    }).format(date)
  }

  const maxCommission = Math.max(...stats.dailyStats.map(d => d.commission), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">
          Análisis de tu rendimiento como gestor
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comisión Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalCommission)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalItemsSold}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Promedio/Pedido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Comisiones - Últimos 7 días
          </CardTitle>
          <CardDescription>
            Evolución de tus comisiones diarias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.dailyStats.map((day, index) => (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground w-20">
                    {formatShortDate(day.date)}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-lg transition-all duration-500"
                        style={{
                          width: `${(day.commission / maxCommission) * 100}%`,
                          animationDelay: `${index * 100}ms`
                        }}
                      />
                    </div>
                  </div>
                  <span className="font-medium w-24 text-right">
                    {formatCurrency(day.commission)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {stats.dailyStats.every(d => d.commission === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <p>No hay comisiones en los últimos 7 días</p>
              <p className="text-sm">¡Empieza a vender para ver tus estadísticas!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Consejos de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
              <span>Los productos con mayor comisión te generan más ganancias por venta.</span>
            </li>
            <li className="flex items-start gap-2">
              <Package className="h-4 w-4 mt-0.5 text-primary" />
              <span>Vender múltiples unidades en un solo pedido optimiza tu tiempo.</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 mt-0.5 text-primary" />
              <span>Mantén un ritmo constante de ventas para mejores resultados mensuales.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
