import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, TrendingUp, Clock, Star, ChevronRight, Plus, Trash2,
  Crown, Zap, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ModeToggle } from '@/components/mode-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { getUserAnalyses, deleteAnalysis } from '@/lib/db'
import type { Database } from '@/lib/supabase'

type Analysis = Database['public']['Tables']['analyses']['Row']

const PLAN_COLORS = {
  free: 'bg-secondary text-secondary-foreground',
  basic: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  pro: 'bg-primary/15 text-primary',
}

const PLAN_ICONS = {
  free: null,
  basic: Zap,
  pro: Crown,
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) {
      setLoadingData(false)
      return
    }
    let cancelled = false
    setLoadingData(true)
    getUserAnalyses(user.id)
      .then(data => { if (!cancelled) setAnalyses(data) })
      .catch(err => { console.error('Dashboard load error:', err) })
      .finally(() => { if (!cancelled) setLoadingData(false) })
    return () => { cancelled = true }
  }, [user])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteAnalysis(id)
      setAnalyses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const isAdmin = profile?.is_admin === true
  const tier = (isAdmin ? 'pro' : (profile?.subscription_tier ?? 'free')) as 'free' | 'basic' | 'pro'
  const PlanIcon = PLAN_ICONS[tier]
  const initials = (profile?.name ?? profile?.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-xl">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Bonjour, {profile?.name ?? 'utilisateur'} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Analyses</span>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-serif">{analyses.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Total effectuées</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Crédits restants</span>
                  <div className="h-8 w-8 rounded-lg bg-chart-2/10 grid place-items-center">
                    <Zap className="h-4 w-4 text-chart-2" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  {isAdmin ? (
                    <>
                      <span className="text-2xl font-bold font-serif text-primary">∞</span>
                      <span className="text-xs text-muted-foreground">Illimité</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-bold font-serif">
                        {(profile?.basic_credits_remaining ?? profile?.credits_remaining ?? 0) + (profile?.payg_basic_credits ?? 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">Basic</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {(profile?.advanced_credits_remaining ?? 0) + (profile?.payg_advanced_credits ?? 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">Adv.</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAdmin ? 'Admin Pro — accès complet' :
                   (profile?.payg_basic_credits ?? 0) > 0 || (profile?.payg_advanced_credits ?? 0) > 0
                    ? `+ ${profile?.payg_basic_credits ?? 0}/${profile?.payg_advanced_credits ?? 0} PAYG`
                    : 'Abonnement mensuel'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Score moyen</span>
                  <div className="h-8 w-8 rounded-lg bg-yellow-400/10 grid place-items-center">
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-serif">
                  {analyses.length > 0
                    ? Math.round(analyses.reduce((sum, a) => sum + (a.confidence_score ?? 0), 0) / analyses.length)
                    : '—'
                  }
                </div>
                <p className="text-xs text-muted-foreground mt-1">Score de confiance /100</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Plan actuel</span>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                    {PlanIcon ? <PlanIcon className="h-4 w-4 text-primary" /> : <Zap className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <div className="mt-1">
                  <Badge className={`capitalize ${PLAN_COLORS[tier]}`}>
                    {tier === 'free' ? 'Gratuit' : tier === 'basic' ? 'Standard' : 'Pro'}
                  </Badge>
                </div>
                {tier === 'free' && (
                  <Link to="/dashboard/pricing" className="text-xs text-primary hover:underline mt-2 block">
                    Voir les offres →
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick action */}
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 transition-all cursor-pointer group">
            <Link to="/analyze">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Analyser un nouveau produit</h3>
                    <p className="text-sm text-muted-foreground">Collez l'URL Alibaba, 1688, Taobao ou Tmall</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Link>
          </Card>

          {/* Analyses list */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="font-serif text-lg">Mes analyses récentes</CardTitle>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/analyze">
                  <Plus className="h-3.5 w-3.5" />
                  Nouvelle analyse
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingData ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                  Chargement...
                </div>
              ) : analyses.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">Aucune analyse pour l'instant</p>
                  <p className="text-sm text-muted-foreground mb-4">Commencez par analyser un produit Alibaba, 1688 ou Taobao</p>
                  <Button asChild size="sm" className="rounded-full">
                    <Link to="/analyze">
                      <Search className="h-4 w-4" />
                      Analyser un produit
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {analyses.map((analysis) => {
                    const score = analysis.confidence_score ?? 0
                    const scoreColor = score >= 70 ? 'text-primary' : score >= 50 ? 'text-yellow-500' : 'text-destructive'
                    return (
                      <div key={analysis.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors group">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center flex-shrink-0">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{analysis.product_name ?? 'Produit analysé'}</p>
                          <p className="text-xs text-muted-foreground truncate">{analysis.supplier_name ?? 'Fournisseur inconnu'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`font-bold text-sm ${scoreColor}`}>{score}/100</div>
                          <div className="text-xs text-muted-foreground">
                            {analysis.price ? `$${analysis.price}` : '—'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Link to={`/analysis/${analysis.id}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:text-destructive"
                            onClick={() => handleDelete(analysis.id)}
                            disabled={deletingId === analysis.id}
                          >
                            {deletingId === analysis.id ? (
                              <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
