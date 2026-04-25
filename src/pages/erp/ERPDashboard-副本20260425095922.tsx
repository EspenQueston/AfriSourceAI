import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, ShoppingCart, Truck, TrendingUp, DollarSign,
  Package, Activity, BarChart2
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getERPClients, getERPOrders, getERPDeliveries } from '@/lib/db'
import type { ERPClient, ERPOrder, ERPDelivery } from '@/lib/supabase'
import { ERP_COUNTRY_INFO } from '@/lib/supabase'

const ORDER_STATUS_META: Record<string, { label: string; color: string; chartColor: string }> = {
  draft:         { label: 'Brouillon',     color: 'bg-secondary text-secondary-foreground',  chartColor: '#94a3b8' },
  confirmed:     { label: 'Confirmée',     color: 'bg-blue-500/15 text-blue-600',             chartColor: '#3b82f6' },
  in_production: { label: 'En production', color: 'bg-yellow-500/15 text-yellow-700',         chartColor: '#eab308' },
  shipped:       { label: 'Expédiée',      color: 'bg-purple-500/15 text-purple-600',         chartColor: '#a855f7' },
  in_transit:    { label: 'En transit',    color: 'bg-orange-500/15 text-orange-600',         chartColor: '#f97316' },
  customs:       { label: 'En douane',     color: 'bg-pink-500/15 text-pink-600',             chartColor: '#ec4899' },
  delivered:     { label: 'Livrée',        color: 'bg-primary/15 text-primary',               chartColor: '#22c55e' },
  cancelled:     { label: 'Annulée',       color: 'bg-destructive/15 text-destructive',       chartColor: '#ef4444' },
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function StatCard({ icon: Icon, label, value, sub, color, bg, to, trend }: {
  icon: React.FC<{ className?: string }>
  label: string
  value: string | number
  sub: string
  color: string
  bg: string
  to: string
  trend?: number
}) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/30 transition cursor-pointer group h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`h-10 w-10 rounded-xl ${bg} grid place-items-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            {trend !== undefined && trend !== 0 && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <div className={`text-3xl font-bold font-serif ${color}`}>{value}</div>
          <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
          <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>
        </CardContent>
      </Card>
    </Link>
  )
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
  const recentOrders = orders.slice(0, 6)

  const revenueByMonth = useMemo(() => {
    const now = new Date()
    const months: { month: string; revenu: number; commandes: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = MONTHS_FR[d.getMonth()]
      const monthOrders = orders.filter(o => {
        const od = new Date(o.created_at)
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear()
      })
      months.push({
        month: label,
        revenu: monthOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0),
        commandes: monthOrders.length,
      })
    }
    return months
  }, [orders])

  const statusDistribution = useMemo(() => {
    const groups: Record<string, number> = {}
    orders.forEach(o => { groups[o.status] = (groups[o.status] ?? 0) + 1 })
    return Object.entries(groups).map(([status, count]) => ({
      name: ORDER_STATUS_META[status]?.label ?? status,
      value: count,
      color: ORDER_STATUS_META[status]?.chartColor ?? '#94a3b8',
    }))
  }, [orders])

  const countryDistribution = useMemo(() => {
    return Object.entries(ERP_COUNTRY_INFO).map(([key, info]) => ({
      country: info.flag + ' ' + info.label,
      commandes: orders.filter(o => o.destination_country === key).length,
    })).filter(c => c.commandes > 0).sort((a, b) => b.commandes - a.commandes)
  }, [orders])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          <div className="h-64 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Tableau de bord ERP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble · Gestion commerciale</p>
        </div>
        <Badge variant="secondary" className="rounded-full gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Temps réel
        </Badge>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Clients"          value={clients.length}                      sub={`${clients.filter(c => c.status === 'active').length} actifs`} color="text-blue-500"   bg="bg-blue-500/10"   to="/erp/clients"  trend={12} />
        <StatCard icon={ShoppingCart} label="Commandes"        value={orders.length}                       sub={`${activeOrders} en cours`}                                     color="text-orange-500" bg="bg-orange-500/10" to="/erp/orders"   trend={8}  />
        <StatCard icon={Truck}        label="En transit"       value={inTransit}                           sub="livraisons actives"                                              color="text-purple-500" bg="bg-purple-500/10" to="/erp/delivery"            />
        <StatCard icon={DollarSign}   label="Revenus livrés"   value={`$${totalRevenue.toLocaleString()}`} sub="commandes livrées"                                              color="text-primary"    bg="bg-primary/10"    to="/erp/orders"              />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Revenue area chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Évolution des revenus (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByMonth.every(m => m.revenu === 0 && m.commandes === 0) ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                <BarChart2 className="h-8 w-8" />
                <span className="text-sm">Ajoutez des commandes pour voir les tendances</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueByMonth}>
                  <defs>
                    <linearGradient id="revenuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cmdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }}
                    formatter={(v: any, name: any) => [name === 'revenu' ? `$${Number(v).toLocaleString()}` : v, name === 'revenu' ? 'Revenus' : 'Commandes']}
                  />
                  <Area type="monotone" dataKey="revenu" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenuGrad)" dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                  <Area type="monotone" dataKey="commandes" stroke="#f97316" strokeWidth={2} fill="url(#cmdGrad)" dot={{ r: 3, fill: '#f97316' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status pie chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Statuts des commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                <Package className="h-8 w-8" />
                <span className="text-sm">Aucune commande</span>
              </div>
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                      {statusDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {statusDistribution.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground truncate">{s.name}</span>
                      <span className="font-semibold ml-auto">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Country bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Commandes par pays
              </span>
              <Button asChild size="sm" variant="ghost" className="h-7 rounded-full text-xs">
                <Link to="/erp/delivery">Voir livraisons →</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryDistribution.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                <Package className="h-8 w-8" />
                <span className="text-sm">Aucune donnée par pays</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, countryDistribution.length * 36)}>
                <BarChart data={countryDistribution} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="country" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: 12 }} />
                  <Bar dataKey="commandes" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Commandes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent orders table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Commandes récentes
              </span>
              <Button asChild size="sm" variant="ghost" className="h-7 rounded-full text-xs">
                <Link to="/erp/orders">Voir tout →</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Aucune commande</p>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/erp/orders">Créer une commande</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.draft
                  const country = ERP_COUNTRY_INFO[order.destination_country]
                  return (
                    <div key={order.id} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition">
                      <span className="text-lg flex-shrink-0">{country?.flag ?? '🌍'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{order.product_name}</div>
                        <div className="text-xs text-muted-foreground">#{order.order_number} · {country?.label ?? order.destination_country}</div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <Badge className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                        <div className="text-xs text-muted-foreground">${order.total_amount.toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-dashed border-2 border-border">
        <CardContent className="p-4">
          <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">Actions rapides</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users,        label: 'Nouveau client',    to: '/erp/clients',  color: 'text-blue-500',   bg: 'bg-blue-500/10' },
              { icon: ShoppingCart, label: 'Nouvelle commande', to: '/erp/orders',   color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { icon: Truck,        label: 'Suivi livraison',   to: '/erp/delivery', color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { icon: TrendingUp,   label: 'Analyser produit',  to: '/analyze',      color: 'text-primary',    bg: 'bg-primary/10' },
            ].map((action) => (
              <Button key={action.label} asChild variant="outline" className="h-auto py-4 flex-col gap-2 rounded-xl hover:border-primary/30 transition">
                <Link to={action.to}>
                  <div className={`h-9 w-9 rounded-xl ${action.bg} grid place-items-center`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
