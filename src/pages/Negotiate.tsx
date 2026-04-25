import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  MessageSquare, Target, Copy, CheckCheck, Info,
  Sparkles, ChevronDown, ChevronUp, TrendingDown, DollarSign,
  Clock, BarChart3, AlertTriangle, CheckCircle2, CreditCard, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { getUserAnalyses } from '@/lib/db'
import { generateNegotiation } from '@/lib/api'
import type { Database, NegotiationPhase, NegotiationStrategyResult } from '@/lib/supabase'

type Analysis = Database['public']['Tables']['analyses']['Row']

const PHASE_ICONS = [MessageSquare, Target, DollarSign, CreditCard]
const PHASE_COLORS = [
  'border-blue-500/30 bg-blue-500/5',
  'border-purple-500/30 bg-purple-500/5',
  'border-primary/30 bg-primary/5',
  'border-orange-500/30 bg-orange-500/5',
]
const PHASE_BADGE_COLORS = [
  'bg-blue-500/15 text-blue-600 border-blue-500/25',
  'bg-purple-500/15 text-purple-600 border-purple-500/25',
  'bg-primary/15 text-primary border-primary/25',
  'bg-orange-500/15 text-orange-600 border-orange-500/25',
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button size="sm" variant="outline" className="rounded-full gap-1.5 h-8 text-xs px-3 flex-shrink-0" onClick={handleCopy}>
      {copied ? <CheckCheck className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copié !' : 'Copier'}
    </Button>
  )
}

function PhaseCard({ phase, index }: { phase: NegotiationPhase; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const Icon = PHASE_ICONS[index] ?? MessageSquare

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${PHASE_COLORS[index]}`}>
      {/* Phase header */}
      <button
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-sm flex-shrink-0 ${PHASE_BADGE_COLORS[index]}`}>
            {phase.number}
          </div>
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-left">
            <div className="font-semibold text-sm">Phase {phase.number} : {phase.title}</div>
            {!expanded && (
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{phase.objective}</div>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-current/10">
          {/* Objective */}
          <div className="flex items-start gap-2.5 pt-4">
            <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">├─</span>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objectif : </span>
              <span className="text-sm">{phase.objective}</span>
            </div>
          </div>

          {/* Prices (Phase 3) */}
          {phase.prices && (
            <div className="flex items-start gap-2.5">
              <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">├─</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Fourchette de prix</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-background/70 border border-border text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">Prix actuel</div>
                    <div className="font-bold font-serif">${phase.prices.current}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">Offre d'ouverture</div>
                    <div className="font-bold font-serif text-orange-600">${phase.prices.openingOffer}</div>
                    <div className="text-xs text-orange-600/70">
                      -{Math.round(((phase.prices.current - phase.prices.openingOffer) / phase.prices.current) * 100)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">Cible acceptable</div>
                    <div className="font-bold font-serif text-primary">
                      ${phase.prices.targetMin}–${phase.prices.targetMax}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background/70 border border-border text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">Économie/1000</div>
                    <div className="font-bold font-serif text-primary">
                      ${Math.round((phase.prices.current - phase.prices.targetMin) * 1000)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Arguments (Phase 3) */}
          {phase.arguments && phase.arguments.length > 0 && (
            <div className="flex items-start gap-2.5">
              <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">├─</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Arguments : "Je commande {phase.prices ? `${phase.prices.current ? Math.round(1000 / phase.prices.current) * 100 : 1000} unités régulièrement` : 'régulièrement'}, cherche partenaire long terme"
                </p>
                <div className="space-y-1.5">
                  {phase.arguments.map((arg, i, arr) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground/40 font-mono text-xs flex-shrink-0 mt-0.5 w-5 select-none">
                        {i === arr.length - 1 ? '└─' : '├─'}
                      </span>
                      <span className="text-muted-foreground">{arg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment terms (Phase 4) */}
          {phase.paymentTerms && (
            <div className="flex items-start gap-2.5">
              <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">├─</span>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paiement : </span>
                <span className="text-sm">{phase.paymentTerms}</span>
              </div>
            </div>
          )}

          {/* Quality inspection (Phase 4) */}
          {phase.qualityInspection && (
            <div className="flex items-start gap-2.5">
              <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">├─</span>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inspection qualité : </span>
                <span className="text-sm">{phase.qualityInspection}</span>
              </div>
            </div>
          )}

          {/* Message */}
          {phase.message && (
            <div className="flex items-start gap-2.5">
              <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">
                {phase.tip || phase.arguments || phase.paymentTerms ? '└─' : '└─'}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message (chinois)</span>
                  <CopyButton text={phase.message} />
                </div>
                <div className="p-3.5 rounded-xl bg-background/70 border border-border">
                  <p className="text-sm leading-loose font-serif">{phase.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          {phase.tip && (
            <div className="flex items-start gap-2.5">
              <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">└─</span>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex-1">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  <span className="font-semibold">Astuce : </span>{phase.tip}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PredictionCard({ prediction }: {
  prediction: NegotiationStrategyResult['prediction']
}) {
  const stars = prediction.probability >= 80 ? 4 : prediction.probability >= 65 ? 3 : prediction.probability >= 50 ? 2 : 1
  return (
    <Card className="border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          📊 PRÉDICTION
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-2">
        {[
          {
            prefix: '├─',
            icon: <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />,
            label: `Probabilité d'obtenir ${prediction.targetRange}`,
            value: (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden max-w-24">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${prediction.probability}%` }} />
                </div>
                <span className="font-bold text-primary">{prediction.probability}%</span>
                <span className="text-yellow-400">{Array.from({ length: stars }).map(() => '⭐').join('')}</span>
              </div>
            ),
          },
          {
            prefix: '├─',
            icon: <TrendingDown className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />,
            label: `Économie estimée`,
            value: <span className="font-semibold text-primary">{prediction.estimatedSavings}</span>,
          },
          {
            prefix: '└─',
            icon: <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />,
            label: 'Temps de négociation',
            value: <span className="font-medium">{prediction.negotiationTime}</span>,
          },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-muted-foreground/40 font-mono text-sm select-none w-6 flex-shrink-0">{row.prefix}</span>
            {row.icon}
            <span className="text-sm text-muted-foreground flex-1">{row.label}</span>
            <div className="flex items-center">{row.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function NegotiatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('analysisId')

  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [selectedId, setSelectedId] = useState(preselectedId ?? '')
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<NegotiationStrategyResult | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getUserAnalyses(user.id)
      .then((list) => {
        setAnalyses(list)
        const pre = list.find((a) => a.id === preselectedId)
        if (pre) {
          setSelectedAnalysis(pre)
          if (pre.price) setTargetPrice((pre.price * 0.78).toFixed(2))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, navigate, preselectedId])

  function handleSelectChange(id: string) {
    setSelectedId(id)
    const a = analyses.find((x) => x.id === id)
    setSelectedAnalysis(a ?? null)
    if (a?.price) setTargetPrice((a.price * 0.78).toFixed(2))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !targetPrice) return
    const price = parseFloat(targetPrice)
    if (isNaN(price) || price <= 0) { setError('Entrez un prix cible valide'); return }

    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const res = await generateNegotiation(selectedId, price)
      setResult(res.negotiation.negotiation_strategy)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* ══════ TITLE ══════ */}
        <div>
          <Badge variant="secondary" className="rounded-full mb-3 px-4 gap-1.5">
            <MessageSquare className="h-3 w-3 text-primary" />
            Stratégie de négociation IA
          </Badge>
          <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">
            🎯 Négocier avec le fournisseur
          </h1>
          <p className="text-muted-foreground text-sm">
            Générez une stratégie de négociation en 4 phases avec messages en chinois mandarin, adaptée à votre produit et prix cible.
          </p>
        </div>

        {/* ══════ FORM ══════ */}
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-6">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                Chargement...
              </div>
            ) : analyses.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm mb-4">Aucune analyse disponible. Analysez d'abord un produit.</p>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/analyze">Analyser un produit</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <Label>Produit à négocier</Label>
                  <select
                    value={selectedId}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="">Sélectionnez un produit analysé…</option>
                    {analyses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.product_name ?? 'Produit'} — {a.price ? `$${a.price}` : '—'} | Score: {a.confidence_score ?? '?'}/100
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAnalysis && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Prix actuel</div>
                      <div className="font-bold">{selectedAnalysis.price ? `$${selectedAnalysis.price}` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">MOQ</div>
                      <div className="font-bold">{selectedAnalysis.moq ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Score</div>
                      <div className="font-bold">{selectedAnalysis.confidence_score ?? '—'}/100</div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="targetPrice" className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Prix cible ($/unité)
                  </Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ex: 2.10"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="h-11"
                    required
                  />
                  {selectedAnalysis?.price && targetPrice && (
                    <p className="text-xs text-muted-foreground">
                      Réduction souhaitée : <span className="font-medium">{(((selectedAnalysis.price - parseFloat(targetPrice)) / selectedAnalysis.price) * 100).toFixed(1)}%</span>
                      {parseFloat(targetPrice) < selectedAnalysis.price * 0.5 && (
                        <span className="text-yellow-500 ml-2">⚠ Réduction très agressive</span>
                      )}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 rounded-full" disabled={generating || !selectedId || !targetPrice}>
                  {generating ? (
                    <><span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full" />Génération en cours…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Générer la stratégie de négociation</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* ══════ RESULTS ══════ */}
        {result && selectedAnalysis && (
          <div className="space-y-5">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold px-2">
                🎯 Stratégie de négociation
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Product summary bar */}
            <div className="p-4 rounded-2xl bg-card border border-border flex flex-wrap gap-4 items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Produit</div>
                <div className="font-semibold text-sm">{selectedAnalysis.product_name ?? 'Produit'}</div>
              </div>
              <div className="flex gap-5 text-sm">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Prix initial</div>
                  <div className="font-bold">${selectedAnalysis.price ?? '—'}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Prix cible</div>
                  <div className="font-bold text-primary">${targetPrice}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Économie/1000</div>
                  <div className="font-bold text-primary">
                    ${selectedAnalysis.price ? Math.round((selectedAnalysis.price - parseFloat(targetPrice)) * 1000) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Phase cards */}
            <div className="space-y-3">
              {result.phases?.map((phase, i) => (
                <PhaseCard key={phase.number} phase={phase} index={i} />
              ))}
            </div>

            {/* Prediction */}
            {result.prediction && (
              <PredictionCard prediction={result.prediction} />
            )}

            {/* Footer tip */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
                <span>
                  Cliquez sur chaque phase pour révéler les messages. Utilisez les boutons "Copier" pour envoyer directement via
                  <span className="font-medium"> Alibaba Trade Manager</span>,
                  <span className="font-medium"> WeChat</span> ou l'application
                  <span className="font-medium"> 1688</span>.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
