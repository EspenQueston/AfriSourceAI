import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, ShoppingCart, Truck, TrendingUp, DollarSign,
  Package, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getERPClients, getERPOrders, getERPDeliveries } from '@/lib/db'
import type { ERPClient, ERPOrder, ERPDelivery } from '@/lib/supabase'
import { ERP_COUNTRY_INFO } from '@/lib/supabase'

const ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  draft:         { label: 'Brouillon',     color: 'bg-secondary text-secondary-foreground' },
  confirmed:     { label: 'Confirmée',     color: 'bg-blue-500/15 text-blue-600' },
  in_production: { label: 'En production', color: 'bg-yellow-500/15 text-yellow-700' },
  shipped:       { label: 'Expédiée',      color: 'bg-purple-500/15 text-purple-600' },
  in_transit:    { label: 'En transit',    color: 'bg-orange-500/15 text-orange-600' },
  customs:       { label: 'En douane',     color: 'bg-pink-500/15 text-pink-600' },
  delivered:     { label: 'Livrée',        color: 'bg-primary/15 text-primary' },
  cancelled:     { label: 'Annulée',       color: 'bg-destructive/15 text-destructive' },
}

export default function ERPDashboard() {
  const { user } = useAuth()
  const [clients, setClients] = useState<ERPClient[]>([])
  const [orders, setOrders] = useState<ERPOrder[]>([])
  const [deliveries, setDeliveries] = useState<ERPDelivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.allSettled([
      getERPClients(user.id),
      getERPOrders(user.id),
      getERPDeliveries(user.id),
    ]).then(([c, o, d]) => {
      if (c.status === 'fulfilled') setClients(c.value)
      if (o.status === 'fulfilled') setOrders(o.value)
      if (d.status === 'fulfilled') setDeliveries(d.value)
    }).finally(() => setLoading(false))
  }, [user])

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0)
  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'draft'].includes(o.status)).length
  const inTransit = deliveries.filter(d => ['in_transit', 'customs', 'dispatched'].includes(d.status)).length
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold">🗂 Tableau de bord ERP</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos clients, commandes et livraisons</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Clients', value: clients.length, sub: `${clients.filter(c => c.status === 'active').length} actifs`, color: 'text-blue-500', bg: 'bg-blue-500/10', to: '/erp/clients' },
          { icon: ShoppingCart, label: 'Commandes', value: orders.length, sub: `${activeOrders} en cours`, color: 'text-orange-500', bg: 'bg-orange-500/10', to: '/erp/orders' },
          { icon: Truck, label: 'En transit', value: inTransit, sub: 'livraisons actives', color: 'text-purple-500', bg: 'bg-purple-500/10', to: '/erp/delivery' },
          { icon: DollarSign, label: 'Revenus livrés', value: `$${totalRevenue.toLocaleString()}`, sub: 'commandes livrées', color: 'text-primary', bg: 'bg-primary/10', to: '/erp/orders' },
        ].map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="hover:border-primary/30 transition cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`h-8 w-8 rounded-lg ${stat.bg} grid place-items-center`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className={`text-2xl font-bold font-serif ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                <div className="text-xs text-muted-foreground/70">{stat.sub}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Orders by country */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Commandes récentes
              <Button asChild size="sm" variant="ghost" className="h-7 rounded-full text-xs">
                <Link to="/erp/orders">Voir tout →</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Chargement...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune commande</p>
                <Button asChild size="sm" className="mt-3 rounded-full">
                  <Link to="/erp/orders">Créer une commande</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.draft
                  const country = ERP_COUNTRY_INFO[order.destination_country]
                  return (
                    <div key={order.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition">
                      <div className="text-xl">{country?.flag ?? '🌍'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{order.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          #{order.order_number} · {country?.label ?? order.destination_country}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                        <div className="text-xs text-muted-foreground mt-0.5">${order.total_amount.toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery overview by country */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Pays de livraison
              <Button asChild size="sm" variant="ghost" className="h-7 rounded-full text-xs">
                <Link to="/erp/delivery">Voir tout →</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(ERP_COUNTRY_INFO).map(([key, info]) => {
              const countryOrders = orders.filter(o => o.destination_country === key)
              return (
                <div key={key} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border">
                  <span className="text-xl flex-shrink-0">{info.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{info.label}</div>
                    <div className="text-xs text-muted-foreground">⚓ {info.avgSeaDays}j mer · ✈️ {info.avgAirDays}j air · Douanes: {info.customsDuty}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold">{countryOrders.length}</div>
                    <div className="text-xs text-muted-foreground">cmd.</div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Nouveau client', to: '/erp/clients', color: 'text-blue-500' },
          { icon: ShoppingCart, label: 'Nouvelle commande', to: '/erp/orders', color: 'text-orange-500' },
          { icon: Truck, label: 'Suivi livraison', to: '/erp/delivery', color: 'text-purple-500' },
          { icon: TrendingUp, label: 'Analyser produit', to: '/analyze', color: 'text-primary' },
        ].map((action) => (
          <Button key={action.label} asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl">
            <Link to={action.to}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
