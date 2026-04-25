import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ArrowLeft, Zap, Crown, Sparkles, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ModeToggle } from '@/components/mode-toggle'
import { Footer } from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { getPlans, getExchangeRates } from '@/lib/db'
import type { Plan } from '@/lib/supabase'

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Crown, Zap, Sparkles, Package,
}

function getIcon(name?: string | null) {
  if (!name) return null
  return ICON_MAP[name] ?? null
}

export default function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'subscription' | 'payg'>('subscription')
  const [displayCurrency, setDisplayCurrency] = useState<'yuan' | 'xof' | 'usd'>('yuan')
  const [rates, setRates] = useState<Record<string, number>>({ CNY_XOF: 90, CNY_XAF: 90, CNY_USD: 0.14 })
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      getPlans(),
      getExchangeRates(),
    ]).then(([plansRes, ratesRes]) => {
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value)
      if (ratesRes.status === 'fulfilled') setRates(ratesRes.value)
    }).finally(() => setLoading(false))
  }, [])

  const subscriptionPlans = plans.filter(p => p.type === 'subscription')
  const paygPacks = plans.filter(p => p.type === 'payg')

  function convertYuan(yuan: number, target: string): number {
    return Math.round(yuan * (rates[`CNY_${target}`] ?? 90))
  }

  function formatPrice(yuan: number): string {
    if (yuan === 0) return 'Gratuit'
    if (displayCurrency === 'yuan') return `¥${yuan}`
    if (displayCurrency === 'usd') return `$${(yuan * (rates['CNY_USD'] ?? 0.14)).toFixed(2)}`
    return `${convertYuan(yuan, 'XOF').toLocaleString()} FCFA`
  }

  function handleSelectPlan(planName: string) {
    if (!user) { navigate('/login'); return }
    navigate(`/checkout?plan=${planName}`)
  }

  const meta = (plan: Plan) => (plan.metadata ?? {}) as Record<string, unknown>
  const features = (plan: Plan) => (meta(plan).features as string[] | undefined) ?? []
  const excludedFeatures = (plan: Plan) => (meta(plan).excluded_features as string[] | undefined) ?? []
  const isPopular = (plan: Plan) => (meta(plan).is_popular as boolean | undefined) ?? false
  const ctaLabel = (plan: Plan) => (meta(plan).cta_label as string | undefined) ?? 'Acheter'
  const ctaVariant = (plan: Plan) => (meta(plan).cta_variant as 'default' | 'outline' | undefined) ?? 'default'
  const description = (plan: Plan) => (meta(plan).description as string | undefined) ?? ''
  const tagColor = (plan: Plan) => (meta(plan).tag_color as string | undefined) ?? 'bg-secondary text-secondary-foreground'
  const iconName = (plan: Plan) => (meta(plan).icon_name as string | undefined) ?? null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Chargement des formules…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>
        <span className="font-semibold text-sm tracking-tight">Tarification</span>
        <ModeToggle />
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Choisissez votre formule</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Abonnement mensuel ou recharge à la carte — payez uniquement ce que vous utilisez.
          </p>
        </div>

        {/* Currency switcher */}
        <div className="flex justify-center gap-2 flex-wrap">
          {(['yuan', 'xof', 'usd'] as const).map(c => (
            <Button
              key={c}
              size="sm"
              variant={displayCurrency === c ? 'default' : 'outline'}
              onClick={() => setDisplayCurrency(c)}
              className="text-xs transition-all duration-200"
            >
              {c === 'yuan' ? '¥ Yuan (CNY)' : c === 'xof' ? 'FCFA (XOF)' : '$ USD'}
            </Button>
          ))}
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)} className="w-full">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2">
            <TabsTrigger value="subscription">Abonnement</TabsTrigger>
            <TabsTrigger value="payg">À la carte (PAYG)</TabsTrigger>
          </TabsList>

          {/* ── Subscription Plans ── */}
          {tab === 'subscription' && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {subscriptionPlans.map(plan => {
                const Icon = getIcon(iconName(plan))
                const popular = isPopular(plan)
                return (
                  <Card
                    key={plan.id}
                    className={`relative border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      popular
                        ? 'border-primary/60 shadow-xl shadow-primary/15'
                        : 'border-border'
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5 shadow animate-pulse">
                          Le plus populaire
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4 pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                        <span className="font-bold text-lg">{plan.display_name}</span>
                        {plan.duration_days && (
                          <Badge className={`ml-auto text-xs ${popular ? 'bg-primary/15 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                            {plan.duration_days}j
                          </Badge>
                        )}
                      </div>
                      <div className="text-3xl font-extrabold">
                        {formatPrice(Number(plan.price_yuan))}
                        {Number(plan.price_yuan) > 0 && <span className="text-base font-normal text-muted-foreground ml-1">/mois</span>}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span className="rounded bg-muted px-2 py-0.5">{plan.basic_credits} Basic</span>
                        <span className="rounded bg-muted px-2 py-0.5">{plan.advanced_credits} Advanced</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {features(plan).map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                        {excludedFeatures(plan).map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                            <span className="h-4 w-4 mt-0.5 shrink-0 text-center">–</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full transition-all duration-200"
                        variant={ctaVariant(plan)}
                        onClick={() => handleSelectPlan(plan.name)}
                      >
                        {ctaLabel(plan)}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ── PAYG Packs ── */}
          {tab === 'payg' && (
            <div className="mt-8 space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Achetez des crédits une fois, sans abonnement. Ils n'expirent pas.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                {paygPacks.map(pack => {
                  const Icon = getIcon(iconName(pack))
                  const popular = isPopular(pack)
                  return (
                    <Card
                      key={pack.id}
                      className={`relative border transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer ${
                        popular ? 'border-primary/30 ring-1 ring-primary/20' : ''
                      }`}
                      onClick={() => handleSelectPlan(pack.name)}
                    >
                      {popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">Populaire</Badge>
                        </div>
                      )}
                      <CardContent className="pt-5 pb-4 space-y-3">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4 text-primary" />}
                          <span className="font-semibold text-sm">{pack.display_name}</span>
                          <Badge className={`ml-auto text-xs ${tagColor(pack)}`}>PAYG</Badge>
                        </div>
                        <div className="text-2xl font-bold">{formatPrice(Number(pack.price_yuan))}</div>
                        <p className="text-xs text-muted-foreground">{description(pack)}</p>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            {pack.basic_credits} crédits Basic
                          </span>
                          {pack.advanced_credits > 0 && (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-purple-500" />
                              {pack.advanced_credits} crédits Advanced
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="w-full transition-all duration-200"
                          onClick={e => { e.stopPropagation(); handleSelectPlan(pack.name) }}
                        >
                          Acheter
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </Tabs>

        {/* Credit types */}
        <div className="max-w-3xl mx-auto border rounded-xl p-6 bg-card space-y-4">
          <h2 className="font-semibold text-base">Types de crédits</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">Basic</span>
                <span className="font-medium">Tâches rapides</span>
              </div>
              <p className="text-muted-foreground text-xs">Analyse standard, recherche d'image simple, messages de contact.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 text-xs font-medium">Advanced</span>
                <span className="font-medium">Analyse profonde</span>
              </div>
              <p className="text-muted-foreground text-xs">Rapport détaillé avec images, comparaison multi-sources, stratégie de négociation complète.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground border-t pt-3">
            Priorité de consommation : crédits d'abonnement d'abord, puis crédits PAYG.
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto space-y-4 pb-8">
          <h2 className="font-semibold text-xl text-center">Questions fréquentes sur les tarifs</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "Comment payer depuis l'Afrique ?",
                a: "Nous acceptons Orange Money, Wave, MTN Mobile Money, Moov Money et les virements bancaires locaux. Vous n'avez pas besoin d'une carte Visa ou d'un compte bancaire international. Le paiement se fait directement depuis votre téléphone, comme d'habitude.",
              },
              {
                q: "Quelle est la différence entre Basic et Advanced ?",
                a: "Les crédits Basic permettent des analyses rapides : recherche d'un fournisseur par image, rapport sommaire, messages de contact. Les crédits Advanced déclenchent une analyse approfondie avec rapport complet (images, comparaison multi-sources, calcul de rentabilité détaillé, stratégie de négociation, estimation des risques douaniers).",
              },
              {
                q: "Mobile Money est-il vraiment supporté ?",
                a: "Oui, totalement. Orange Money, Wave, MTN MoMo, Moov Money sont tous acceptés. Pour les packs PAYG, le paiement se fait en ligne sur notre plateforme sécurisée. Pour les abonnements, vous recevez un lien de paiement mobile à chaque renouvellement mensuel.",
              },
              {
                q: "Puis-je annuler mon abonnement à tout moment ?",
                a: "Oui, sans frais. Vous pouvez annuler votre abonnement Standard ou Pro depuis votre espace \"Paramètres\" à tout moment. L'annulation prend effet à la fin de la période en cours — vous continuez à bénéficier de vos crédits jusqu'à la date de renouvellement.",
              },
              {
                q: "Les crédits inutilisés expirent-ils ?",
                a: "Les crédits issus des abonnements mensuels expirent à la fin du mois de facturation (pas de report). Les crédits achetés en PAYG (packs à la carte) sont valides 12 mois à compter de la date d'achat, sans limite de report.",
              },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-border bg-card px-6 data-[state=open]:border-primary/40"
              >
                <AccordionTrigger className="text-left font-medium text-sm hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  )
}
