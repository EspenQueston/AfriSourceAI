import { useEffect, useState } from 'react'
import { TrendingUp, Users, CreditCard, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminStats } from '@/lib/db'

interface Stats {
  mrr: number
  totalRevenue: number
  activeSubs: number
  totalRequests: number
  basicRequests: number
  advancedRequests: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats().then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const cards = [
    {
      label: 'MRR (ce mois)',
      value: stats ? `$${stats.mrr.toFixed(2)}` : '—',
      sub: 'Revenus mensuels récurrents',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-950',
    },
    {
      label: 'Revenu total',
      value: stats ? `$${stats.totalRevenue.toFixed(2)}` : '—',
      sub: 'Toutes transactions réussies',
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      label: 'Abonnements actifs',
      value: stats?.activeSubs ?? '—',
      sub: 'Utilisateurs payants actifs',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Requêtes (mois)',
      value: stats?.totalRequests ?? '—',
      sub: `${stats?.basicRequests ?? 0} Basic · ${stats?.advancedRequests ?? 0} Advanced`,
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-950',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
        <p className="text-muted-foreground text-sm">Statistiques du mois en cours</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className={`h-8 w-8 rounded-lg ${card.bg} grid place-items-center`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilisation des crédits ce mois</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm w-24 text-muted-foreground">Basic</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: stats.totalRequests > 0 ? `${(stats.basicRequests / stats.totalRequests) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm font-mono w-12 text-right">{stats.basicRequests}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm w-24 text-muted-foreground">Advanced</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: stats.totalRequests > 0 ? `${(stats.advancedRequests / stats.totalRequests) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm font-mono w-12 text-right">{stats.advancedRequests}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
