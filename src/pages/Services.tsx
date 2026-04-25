import { Link } from 'react-router-dom'
import { ArrowRight, Search, BarChart3, Users, Truck, Sparkles, CheckCircle, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SiteNavbar } from '@/components/SiteNavbar'
import { SiteFooter } from '@/components/SiteFooter'

const SERVICES = [
  {
    id: '01',
    icon: ImageIcon,
    badge: 'IA — Recherche visuelle',
    title: 'Recherche de fournisseur par image',
    desc: 'Prenez en photo n\'importe quel produit ou envoyez une image depuis votre galerie. Notre IA identifie instantanément le produit sur les plateformes chinoises (1688, Taobao, Alibaba) et vous trouve les meilleurs fournisseurs avec les meilleurs prix.',
    benefits: [
      'Résultats en moins de 30 secondes',
      'TOP 3 fournisseurs recommandés',
      'Comparaison prix unitaire vs lot',
      'Note et avis des fournisseurs inclus',
    ],
    cta: 'Analyser un produit',
    href: '/',
    color: 'from-primary/10 to-primary/5',
  },
  {
    id: '02',
    icon: BarChart3,
    badge: 'IA — Analyse financière',
    title: 'Analyse de rentabilité produit',
    desc: 'Avant d\'investir, sachez exactement combien vous pouvez gagner. Notre IA calcule automatiquement le prix d\'achat, les frais de transport vers votre pays, le prix de revente conseillé et la marge estimée pour chaque produit.',
    benefits: [
      'Calcul automatique de la marge',
      'Frais de transport vers l\'Afrique',
      'Prix de revente conseillé (x2.5–x3)',
      'Verdict IA : Bon / Risque / Déconseillé',
    ],
    cta: 'Analyser la rentabilité',
    href: '/',
    color: 'from-chart-2/10 to-chart-2/5',
  },
  {
    id: '03',
    icon: Users,
    badge: 'Service premium',
    title: 'Sourcing à la demande (agent humain)',
    desc: 'Pour les commandes complexes ou les gros volumes, notre équipe d\'agents basés en Chine prend en charge votre recherche de fournisseur de A à Z. Négociation de prix, vérification du fournisseur, échantillons, contrôle qualité — tout est géré pour vous.',
    benefits: [
      'Agent dédié basé en Chine',
      'Visite physique du fournisseur',
      'Négociation en mandarin pour vous',
      'Contrôle qualité avant expédition',
    ],
    cta: 'Contacter un agent',
    href: '/contact',
    color: 'from-chart-3/10 to-chart-3/5',
  },
  {
    id: '04',
    icon: Truck,
    badge: 'Logistique',
    title: 'Suivi logistique Chine → Afrique',
    desc: 'Votre commande est passée ? On s\'occupe de tout. Dédouanement, fret maritime ou aérien, dernière livraison en Afrique. Vous recevez des notifications à chaque étape et un numéro de tracking international.',
    benefits: [
      'Suivi temps réel disponible',
      'Fret maritime et aérien',
      'Livraison dans 8 pays africains',
      'Gestion douanière incluse',
    ],
    cta: 'En savoir plus',
    href: '/contact',
    color: 'from-chart-4/10 to-chart-4/5',
    comingSoon: false,
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <Badge variant="secondary" className="rounded-full mb-6">
              <Search className="h-3.5 w-3.5 text-primary mr-1" />
              Nos services
            </Badge>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Tout ce dont vous avez besoin pour{' '}
              <span className="text-primary">importer depuis la Chine</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              De la recherche du produit jusqu'à la livraison à votre porte — AfriSource AI couvre toute la chaîne du commerce Chine-Afrique.
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="py-10 pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {SERVICES.map((service, i) => (
              <Card
                key={i}
                className="border-border overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <CardContent className="p-0">
                  <div className={`grid md:grid-cols-5 gap-0`}>
                    {/* Icon panel */}
                    <div className={`md:col-span-1 bg-gradient-to-br ${service.color} flex items-center justify-center p-8`}>
                      <div className="h-16 w-16 rounded-2xl bg-background/80 border border-border grid place-items-center shadow-lg">
                        <service.icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-4 p-7">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{service.id}</span>
                            <Badge variant="outline" className="rounded-full text-xs border-primary/30 text-primary">
                              {service.badge}
                            </Badge>
                          </div>
                          <h2 className="font-serif text-xl sm:text-2xl font-bold">{service.title}</h2>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed text-sm mb-5">{service.desc}</p>

                      <ul className="grid sm:grid-cols-2 gap-2 mb-5">
                        {service.benefits.map((b, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      <Button asChild className="rounded-full gap-2" size="sm">
                        <Link to={service.href}>
                          {service.cta}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/5 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl font-bold mb-4">Commencez dès maintenant — c'est gratuit</h2>
            <p className="text-muted-foreground mb-8">3 analyses gratuites sans inscription requise. Testez la puissance d'AfriSource AI.</p>
            <Button asChild size="lg" className="rounded-full gap-2 shadow-xl shadow-primary/25">
              <Link to="/">
                <Sparkles className="h-5 w-5" />
                Analyser un produit gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
