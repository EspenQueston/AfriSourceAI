import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Search, Info, LinkIcon, Sparkles, ShieldCheck, ArrowRight, X, Crown, Zap, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { analyzeProduct } from '@/lib/api'

const EXAMPLE_URLS = [
  'https://www.alibaba.com/product-detail/...',
  'https://detail.1688.com/offer/...',
  'https://item.taobao.com/item.htm?id=...',
  'https://e.tb.cn/h.xxx?tk=xxx',
]

const STEPS = [
  { n: '01', text: 'Trouvez un produit sur Alibaba, 1688, Taobao ou Tmall' },
  { n: '02', text: "Copiez l'URL de la page produit" },
  { n: '03', text: 'Collez-la ci-dessous et lancez l\'analyse' },
]

const PRO_FEATURES = [
  'Analyses illimitées',
  'Score de confiance IA avancé',
  'Négociation automatisée',
  'Comparaison multi-fournisseurs',
  'Export PDF des rapports',
  'Support prioritaire 24/7',
]

export default function AnalyzePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url') ?? ''
  const fromFree = searchParams.get('from') === 'free'
  const [url, setUrl] = useState(urlParam)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'analyzing'>('form')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Admin = Pro by default (no limits)
  const isAdmin = profile?.is_admin === true
  const tier = isAdmin ? 'pro' : (profile?.subscription_tier ?? 'free')
  const creditsLeft = isAdmin
    ? 999
    : (profile?.basic_credits_remaining ?? profile?.credits_remaining ?? 0) + (profile?.payg_basic_credits ?? 0)
  const canAnalyze = isAdmin || tier !== 'free' || creditsLeft > 0

  // Auto-show upgrade modal when credits are depleted (free users only)
  useEffect(() => {
    if (!isAdmin && tier === 'free' && creditsLeft === 0 && user) {
      const timer = setTimeout(() => setShowUpgradeModal(true), 600)
      return () => clearTimeout(timer)
    }
  }, [isAdmin, tier, creditsLeft, user])

  function isValidUrl(u: string) {
    try {
      const host = new URL(u).hostname
      return (
        host.includes('alibaba.com') ||
        host.includes('1688.com') ||
        host.includes('taobao.com') ||
        host.includes('tmall.com') ||
        host.includes('aliexpress.com') ||
        host.includes('e.tb.cn')
      )
    } catch {
      return false
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!user) {
      navigate('/login')
      return
    }

    if (!canAnalyze) {
      setShowUpgradeModal(true)
      return
    }

    if (!url.trim()) {
      setError("Veuillez entrer une URL")
      return
    }

    if (!isValidUrl(url)) {
      setError("URL non supportée. Utilisez Alibaba, 1688, Taobao, Tmall, AliExpress ou un lien court e.tb.cn")
      return
    }

    setLoading(true)
    setStep('analyzing')

    try {
      const result = await analyzeProduct(url.trim())
      navigate(`/analysis/${result.analysis.id}`, { state: { analysis: result.analysis } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
      setError(msg)
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════ UPGRADE MODAL ═══════════════ */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowUpgradeModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
            <div className="rounded-3xl border-2 border-primary/30 bg-card shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Top gradient banner */}
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-emerald-600 px-6 py-8 text-primary-foreground text-center overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-12 -translate-y-12" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 translate-y-8" />
                <div className="absolute top-4 right-6">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center mx-auto mb-4 shadow-lg">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h2 className="font-serif text-2xl font-bold mb-2">
                    Crédits gratuits épuisés
                  </h2>
                  <p className="text-sm opacity-90 max-w-xs mx-auto leading-relaxed">
                    Vous avez utilisé vos 3 analyses gratuites. Passez à Pro pour des analyses illimitées et des outils avancés.
                  </p>
                </div>
              </div>

              {/* Features list */}
              <div className="px-6 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">Plan Pro — Tout inclus</span>
                  <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-xs rounded-full">
                    Populaire
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {PRO_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground text-xs">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price highlight */}
                <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/15 p-4 mb-5 text-center">
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-3xl font-bold font-serif text-primary">$9.90</span>
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Soit moins de <span className="font-semibold text-foreground">$0.33/jour</span> pour sécuriser vos imports
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="space-y-2.5">
                  <Button
                    asChild
                    className="w-full h-12 rounded-full text-base shadow-lg shadow-primary/20 gap-2"
                  >
                    <Link to="/dashboard/pricing">
                      <Zap className="h-5 w-5" />
                      Passer à Pro maintenant
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-10 rounded-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setShowUpgradeModal(false)}
                  >
                    Peut-être plus tard
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
                  🔒 Paiement sécurisé • Annulation à tout moment • Garantie 30 jours
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="rounded-full mb-4 px-4 py-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Analyse IA en temps réel
          </Badge>
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-3">
            Analyser un produit
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Collez l'URL d'un produit Alibaba, 1688, Taobao, Tmall ou un lien court e.tb.cn et obtenez une analyse complète
            avec score de confiance, analyse de prix et stratégie de négociation.
          </p>

          {fromFree && (
            <div className="mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/25 text-left">
              <div className="h-8 w-8 rounded-full bg-primary/15 grid place-items-center shrink-0">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Continuez depuis votre analyse gratuite</p>
                <p className="text-xs text-muted-foreground">L'URL a été préremplie. Lancez l'analyse complète pour un rapport détaillé.</p>
              </div>
            </div>
          )}

          {/* Admin Pro badge */}
          {isAdmin && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-primary/10 border border-yellow-500/20 text-sm">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">Admin Pro</span>
              <span className="text-muted-foreground">— Analyses illimitées</span>
            </div>
          )}

          {/* Free tier credits indicator */}
          {!isAdmin && tier === 'free' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{creditsLeft} crédit{creditsLeft !== 1 ? 's' : ''} restant{creditsLeft !== 1 ? 's' : ''}</span>
              {creditsLeft === 0 && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-primary font-medium hover:underline"
                >
                  — Passer à Pro
                </button>
              )}
            </div>
          )}

          {/* Paid tier badge */}
          {!isAdmin && tier !== 'free' && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-primary capitalize">Plan {tier}</span>
              <span className="text-muted-foreground">— Analyses illimitées</span>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold mx-auto mb-2">
                {s.n}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <Card className="border-2 border-border shadow-xl shadow-primary/5">
          <CardContent className="p-6">
            {step === 'analyzing' ? (
              <div className="py-12 text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto">
                    <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2">Analyse en cours…</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p>🔍 Extraction des données du produit</p>
                  <p>🤖 Analyse IA en cours</p>
                  <p>📊 Génération du rapport</p>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Cela peut prendre 15-30 secondes</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    URL du produit
                  </label>
                  <Input
                    type="url"
                    placeholder="https://e.tb.cn/... ou https://www.alibaba.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 font-mono text-sm"
                    disabled={loading}
                  />
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>Supporté : alibaba.com, 1688.com, taobao.com, tmall.com, aliexpress.com, e.tb.cn (liens courts Taobao)</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full text-base shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {!canAnalyze ? (
                    <>
                      <Lock className="h-5 w-5" />
                      Débloquer l'analyse — Passer à Pro
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Lancer l'analyse IA
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">Exemples d'URLs valides :</p>
                  <div className="space-y-2">
                    {EXAMPLE_URLS.map((u) => (
                      <div
                        key={u}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 text-xs font-mono text-muted-foreground cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => setUrl(u)}
                      >
                        <LinkIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Analyse sécurisée
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Propulsé par GPT-4o Mini
          </div>
        </div>
      </div>
    </div>
  )
}
