import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GitCompare, TrendingUp, CheckCircle2, Info,
  Plus, X, Sparkles, ChevronRight, Clock, ArrowRight, Trophy, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { getUserAnalyses } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { compareAnalyses } from '@/lib/api'
import type { Database, AIAnalysisResult } from '@/lib/supabase'

type Analysis = Database['public']['Tables']['analyses']['Row']
type Comparison = Database['public']['Tables']['comparisons']['Row']

export default function ComparePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<{
    winnerId: string
    recommendation: string
    allAnalyses: Analysis[]
  } | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<(Comparison & { winner_name?: string })[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([
      getUserAnalyses(user.id).then(setAnalyses),
      loadHistory(user.id),
    ]).finally(() => setLoading(false))
  }, [user, navigate])

  async function loadHistory(userId: string) {
    const { data } = await supabase
      .from('comparisons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setHistory(data)
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  async function handleCompare() {
    if (selected.length < 2) return
    setComparing(true)
    setError('')
    setResult(null)

    try {
      const res = await compareAnalyses(selected)
      const selectedAnalyses = analyses.filter((a) => selected.includes(a.id))
      setResult({
        winnerId: res.comparison.winner_analysis_id,
        recommendation: res.comparison.ai_recommendation,
        allAnalyses: selectedAnalyses,
      })
      // Refresh history
      if (user) loadHistory(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la comparaison')
    } finally {
      setComparing(false)
    }
  }

  const selectedAnalyses = analyses.filter((a) => selected.includes(a.id))
  const winner = result ? analyses.find((a) => a.id === result.winnerId) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="secondary" className="rounded-full mb-3 px-4">
              <GitCompare className="h-3 w-3 text-primary" />
              Comparaison IA
            </Badge>
            <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Comparer des produits</h1>
            <p className="text-muted-foreground">
              Sélectionnez 2 à 5 analyses pour que l'IA détermine la meilleure option pour votre marché.
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="h-3.5 w-3.5" />
              Historique ({history.length})
            </Button>
          )}
        </div>

        {/* ═══════ HISTORY ═══════ */}
        {showHistory && history.length > 0 && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Historique des comparaisons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {history.map((comp) => {
                const winnerAnalysis = analyses.find(a => a.id === comp.winner_analysis_id)
                return (
                  <div key={comp.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/50 transition">
                    <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {winnerAnalysis?.product_name ?? 'Produit recommandé'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {comp.analysis_ids?.length ?? 0} produits comparés — {new Date(comp.created_at).toLocaleDateString('fr', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {comp.winner_analysis_id && (
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Link to={`/analysis/${comp.winner_analysis_id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Link>
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* ═══════ SELECTION SUMMARY ═══════ */}
        {selected.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{selected.length} produit{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</span>
                  {selectedAnalyses.map((a) => (
                    <Badge key={a.id} variant="secondary" className="rounded-full text-xs flex items-center gap-1">
                      {(a.product_name ?? 'Produit').slice(0, 20)}
                      <button onClick={() => toggleSelect(a.id)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={handleCompare}
                  disabled={selected.length < 2 || comparing}
                  size="sm"
                  className="rounded-full"
                >
                  {comparing ? (
                    <>
                      <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full" />
                      Comparaison...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Comparer avec l'IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════ COMPARISON RESULT ═══════ */}
        {result && (
          <div className="space-y-6">
            {/* Winner card */}
            {winner && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-lg shadow-primary/10 overflow-hidden">
                <div className="bg-primary/10 px-5 py-3 border-b border-primary/15 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">🏆 Produit recommandé</span>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary grid place-items-center shadow-md shadow-primary/30 flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{winner.product_name ?? 'Produit'}</p>
                      <p className="text-sm text-muted-foreground">
                        {winner.supplier_name ?? 'Fournisseur'} — Score: {winner.confidence_score}/100 — {winner.price ? `$${winner.price}/unité` : '—'}
                      </p>
                    </div>
                    <Button asChild size="sm" className="rounded-full gap-1.5">
                      <Link to={`/analysis/${winner.id}`}>
                        Voir l'analyse
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed comparison table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary" />
                  Tableau comparatif détaillé
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 text-xs uppercase text-muted-foreground font-semibold">Critère</th>
                      {result.allAnalyses.map(a => (
                        <th key={a.id} className={`text-center py-3 px-3 text-xs uppercase font-semibold ${a.id === result.winnerId ? 'text-primary bg-primary/5 rounded-t-lg' : 'text-muted-foreground'}`}>
                          {a.id === result.winnerId && <Trophy className="h-3 w-3 inline mr-1 text-yellow-500" />}
                          {(a.product_name ?? 'Produit').slice(0, 18)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Prix unitaire', key: 'price', format: (v: number | null) => v ? `$${v}` : '—' },
                      { label: 'Score de confiance', key: 'confidence_score', format: (v: number | null) => v ? `${v}/100` : '—' },
                      { label: 'MOQ', key: 'moq', format: (v: number | null) => v ? `${v} unités` : '—' },
                      { label: 'Fournisseur', key: 'supplier_name', format: (v: string | null) => v ?? '—' },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-border/50">
                        <td className="py-3 px-3 font-medium text-muted-foreground">{row.label}</td>
                        {result.allAnalyses.map(a => {
                          const val = a[row.key as keyof Analysis]
                          return (
                            <td key={a.id} className={`text-center py-3 px-3 ${a.id === result.winnerId ? 'bg-primary/5 font-semibold' : ''}`}>
                              {row.format(val as any)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium text-muted-foreground">Rapport qualité/prix</td>
                      {result.allAnalyses.map(a => {
                        const ratio = a.price && a.confidence_score ? (a.confidence_score / a.price).toFixed(1) : '—'
                        return (
                          <td key={a.id} className={`text-center py-3 px-3 ${a.id === result.winnerId ? 'bg-primary/5 font-semibold text-primary' : ''}`}>
                            {ratio}
                          </td>
                        )
                      })}
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-medium text-muted-foreground">Action</td>
                      {result.allAnalyses.map(a => (
                        <td key={a.id} className={`text-center py-3 px-3 ${a.id === result.winnerId ? 'bg-primary/5' : ''}`}>
                          <Button asChild size="sm" variant={a.id === result.winnerId ? 'default' : 'outline'} className="rounded-full text-xs h-7 px-3">
                            <Link to={`/analysis/${a.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              Détails
                            </Link>
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* AI Recommendation */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Conclusion & Recommandation IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {result.recommendation}
                  </div>
                </div>
                {winner && (
                  <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Verdict : {winner.product_name}</p>
                      <p className="text-xs text-muted-foreground">Le meilleur choix basé sur le score de confiance, le prix et la fiabilité du fournisseur.</p>
                    </div>
                    <Button asChild size="sm" className="rounded-full gap-1">
                      <Link to={`/negotiate?analysisId=${winner.id}`}>
                        Négocier ce produit
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* ═══════ ANALYSES LIST ═══════ */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
            Chargement des analyses...
          </div>
        ) : analyses.length < 2 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center mx-auto mb-4">
                <GitCompare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">Pas assez d'analyses</p>
              <p className="text-sm text-muted-foreground mb-4">
                Vous avez besoin d'au moins 2 analyses pour comparer. Actuellement : {analyses.length}.
              </p>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/analyze">
                  <Plus className="h-4 w-4" />
                  Analyser un produit
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
              Vos analyses ({analyses.length})
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {analyses.map((analysis) => {
                const isSelected = selected.includes(analysis.id)
                const score = analysis.confidence_score ?? 0
                const scoreColor = score >= 70 ? 'text-primary' : score >= 50 ? 'text-yellow-500' : 'text-destructive'
                const ai = analysis.ai_analysis as AIAnalysisResult | null

                return (
                  <Card
                    key={analysis.id}
                    className={`cursor-pointer border-2 transition-all hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                    onClick={() => toggleSelect(analysis.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-primary bg-primary' : 'border-border bg-secondary'
                        }`}>
                          {isSelected
                            ? <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                            : <Plus className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{analysis.product_name ?? 'Produit'}</p>
                          <p className="text-xs text-muted-foreground truncate mb-2">{analysis.supplier_name ?? '—'}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${scoreColor} border-current rounded-full`}>
                              {score}/100
                            </Badge>
                            {analysis.price && (
                              <Badge variant="secondary" className="text-xs rounded-full">
                                ${analysis.price}
                              </Badge>
                            )}
                            {analysis.moq && (
                              <Badge variant="secondary" className="text-xs rounded-full">
                                MOQ: {analysis.moq}
                              </Badge>
                            )}
                          </div>
                          {ai?.priceAnalysis && (
                            <div className="flex items-center gap-1 mt-2">
                              <TrendingUp className="h-3 w-3 text-primary" />
                              <span className="text-xs text-muted-foreground">
                                Cible: ${ai.priceAnalysis.targetPrice}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {selected.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Cliquez sur les produits pour les sélectionner (min. 2, max. 5)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
