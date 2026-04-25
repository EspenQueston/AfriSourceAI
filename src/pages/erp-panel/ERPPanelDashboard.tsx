import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Users, CreditCard, Zap, ShoppingCart, Truck,
  Tag, Settings, BarChart3, Activity, Package, DollarSign, Loader2, ArrowUpRight, Webhook
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAdminStats, getAllPlans, getAllUsers, getAllTransactions,
  getAllPromoCodes, getERPClients, getERPOrders, getERPDeliveries
} from '@/lib/db'
import type { Plan, PaymentTransaction, PromoCode } from '@/lib/supabase'
import type { ERPClient, ERPOrder, ERPDelivery } from '@/lib/supabase'

interface QuickStat {
  label: string
  value: string | number
  sub: string
  icon: React.FC<{ className?: string }>
  color: string
  bg: string
  to: string
}

export default function ERPPanelDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [adminStats, setAdminStats] = useState<{
    mrr: number; totalRevenue: number; activeSubs: number;
    totalRequests: number; basicRequests: number; advancedRequests: number
  } | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [users, setUsers] = useState<{ id: string; email: string; name: string | null; is_admin: boolean; created_at: string }[]>([])
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [clients, setClients] = useState<ERPClient[]>([])
  const [orders, setOrders] = useState<ERPOrder[]>([])
  const [deliveries, setDeliveries] = useState<ERPDelivery[]>([])

  useEffect(() => {
    if (!user) return
    Promise.allSettled([
      getAdminStats(),
      getAllPlans(),
      getAllUsers(),
      getAllTransactions(),
      getAllPromoCodes(),
      getERPClients(user.id),
      getERPOrders(user.id),
      getERPDeliveries(user.id),
    ]).then(([stats, p, u, tx, promo, c, o, d]) => {
      if (stats.status === 'fulfilled') setAdminStats(stats.value)
      if (p.status === 'fulfilled') setPlans(p.value)
      if (u.status === 'fulfilled') setUsers(u.value as typeof users)
      if (tx.status === 'fulfilled') setTransactions(tx.value)
      if (promo.status === 'fulfilled') setPromos(promo.value)
      if (c.status === 'fulfilled') setClients(c.value)
      if (o.status === 'fulfilled') setOrders(o.value)
      if (d.status === 'fulfilled') setDeliveries(d.value)
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'draft'].includes(o.status)).length
  const inTransit = deliveries.filter(d => ['in_transit', 'customs', 'dispatched'].includes(d.status)).length
  const pendingTx = transactions.filter(t => t.status === 'pending').length
  const successTx = transactions.filter(t => t.status === 'success').length

  const quickStats: QuickStat[] = [
    {
      label: 'MRR',
      value: `$${(adminStats?.mrr ?? 0).toFixed(2)}`,
      sub: 'Revenus mensuels récurrents',
      icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950', to: '/erp-panel/analytics',
    },
    {
      label: 'Revenu total',
      value: `$${(adminStats?.totalRevenue ?? 0).toFixed(2)}`,
      sub: `${successTx} transactions réussies`,
      icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950', to: '/erp-panel/transactions',
    },
    {
      label: 'Utilisateurs',
      value: users.length,
      sub: `${users.filter(u => u.is_admin).length} admins`,
      icon: Users, color: 'text-primary', bg: 'bg-primary/10', to: '/erp-panel/users',
    },
    {
      label: 'Requêtes (mois)',
      value: adminStats?.totalRequests ?? 0,
      sub: `${adminStats?.basicRequests ?? 0} B · ${adminStats?.advancedRequests ?? 0} A`,
      icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-950', to: '/erp-panel/analytics',
    },
    {
      label: 'Formules',
      value: plans.filter(p => p.is_active).length,
      sub: `${plans.filter(p => p.type === 'subscription').length} abo · ${plans.filter(p => p.type === 'payg').length} PAYG`,
      icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950', to: '/erp-panel/plans',
    },
    {
      label: 'Codes Promo',
      value: promos.filter(p => p.is_active).length,
      sub: `${promos.length} total`,
      icon: Tag, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-950', to: '/erp-panel/promo',
    },
    {
      label: 'Commandes ERP',
      value: orders.length,
      sub: `${activeOrders} en cours`,
      icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950', to: '/erp-panel/orders',
    },
    {
      label: 'Livraisons',
      value: deliveries.length,
      sub: `${inTransit} en transit`,
      icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-950', to: '/erp-panel/delivery',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Vue d'ensemble
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Données en temps réel depuis la base de données
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Temps réel
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map(stat => (
          <Link key={stat.label} to={stat.to}>
            <Card className="hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  <div className={`h-8 w-8 rounded-lg ${stat.bg} grid place-items-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Usage bars + recent transactions */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Credit usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Utilisation des crédits (mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adminStats && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Basic</span>
                    <span className="font-semibold">{adminStats.basicRequests}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: adminStats.totalRequests > 0 ? `${(adminStats.basicRequests / adminStats.totalRequests) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advanced</span>
                    <span className="font-semibold">{adminStats.advancedRequests}</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: adminStats.totalRequests > 0 ? `${(adminStats.advancedRequests / adminStats.totalRequests) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Transactions récentes
              </span>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs rounded-full">
                <Link to="/erp-panel/transactions">Voir tout <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Aucune transaction</div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">{tx.id.slice(0, 8)}…</span>
                      <Badge className={`ml-2 text-xs ${
                        tx.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                        'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>{tx.status}</Badge>
                    </div>
                    <span className="font-semibold text-xs">{tx.amount_local.toLocaleString()} {tx.currency}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-dashed border-2 border-border">
        <CardContent className="p-4">
          <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">Actions rapides</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { icon: Settings, label: 'Gérer les plans', to: '/erp-panel/plans', color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { icon: Users, label: 'Utilisateurs', to: '/erp-panel/users', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Tag, label: 'Codes Promo', to: '/erp-panel/promo', color: 'text-pink-500', bg: 'bg-pink-500/10' },
              { icon: ShoppingCart, label: 'Commandes', to: '/erp-panel/orders', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { icon: Truck, label: 'Livraisons', to: '/erp-panel/delivery', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
              { icon: BarChart3, label: 'Analytiques', to: '/erp-panel/analytics', color: 'text-green-500', bg: 'bg-green-500/10' },
            ].map(action => (
              <Button key={action.label} asChild variant="outline" className="h-auto py-3 flex-col gap-1.5 rounded-xl hover:border-primary/30 transition text-xs">
                <Link to={action.to}>
                  <div className={`h-8 w-8 rounded-lg ${action.bg} grid place-items-center`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="font-medium">{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status indicators */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className={`${pendingTx > 0 ? 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/10' : ''}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-100 dark:bg-yellow-950 grid place-items-center">
              <Webhook className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{pendingTx}</div>
              <div className="text-xs text-muted-foreground">Webhooks en attente</div>
            </div>
            {pendingTx > 0 && (
              <Button asChild size="sm" variant="outline" className="ml-auto rounded-full text-xs">
                <Link to="/erp-panel/webhooks">Voir</Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-950 grid place-items-center">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold">{clients.length}</div>
              <div className="text-xs text-muted-foreground">Clients ERP</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">{adminStats?.activeSubs ?? 0}</div>
              <div className="text-xs text-muted-foreground">Abonnements actifs</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
