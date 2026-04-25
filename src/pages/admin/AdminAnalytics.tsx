import { useEffect, useState } from 'react'
import { AlertTriangle, BarChart3, TrendingUp, Users, Zap, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminStats } from '@/lib/db'
import { supabase } from '@/lib/supabase'

interface MonthlyRevenue {
  month: string
  amount: number
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [s, txRes] = await Promise.all([
          getAdminStats(),
          supabase
            .from('payment_transactions')
            .select('amount_usd, created_at')
            .eq('status', 'success')
            .order('created_at', { ascending: true }),
        ])
        setStats(s)

        // Group by month
        const map: Record<string, number> = {}
        for (const tx of txRes.data ?? []) {
          const key = new Date(tx.created_at).toLocaleDateString('fr', { month: 'short', year: 'numeric' })
          map[key] = (map[key] ?? 0) + (tx.amount_usd ?? 0)
        }
        setMonthlyRevenue(Object.entries(map).map(([month, amount]) => ({ month, amount })).slice(-6))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const maxRevenue = Math.max(...monthlyRevenue.map(r => r.amount), 1)
  const alerts = stats?.highSeverityAlerts ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytiques</h1>
        <p className="text-muted-foreground text-sm">Revenus et utilisation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">MRR (mois en cours)</span>
            </div>
            <div className="text-2xl font-bold">${stats?.mrr.toFixed(2) ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Abonnements actifs</span>
            </div>
            <div className="text-2xl font-bold">{stats?.activeSubs ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Requêtes (mois)</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalRequests ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.basicRequests ?? 0} Basic · {stats?.advancedRequests ?? 0} Advanced
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Taux fallback IA</p>
            <p className="text-2xl font-bold mt-2">{stats?.fallbackRate ?? 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Échec paiements</p>
            <p className="text-2xl font-bold mt-2">{stats?.paymentFailureRate ?? 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Latence moyenne</p>
            <p className="text-2xl font-bold mt-2">{stats?.avgLatencyMs ?? 0} ms</p>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alertes opérationnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <p key={alert} className="text-sm text-amber-700 dark:text-amber-300">• {alert}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart (simple bar) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Revenus mensuels (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Pas encore de données</p>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {monthlyRevenue.map(r => (
                <div key={r.month} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-muted-foreground">${r.amount.toFixed(0)}</span>
                  <div
                    className="w-full bg-primary/20 rounded-t-sm transition-all"
                    style={{ height: `${(r.amount / maxRevenue) * 80}px`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{r.month}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
