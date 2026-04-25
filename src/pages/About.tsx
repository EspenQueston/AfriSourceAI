import { Link } from 'react-router-dom'
import { ArrowRight, Target, Zap, ShieldCheck, Sparkles, Globe2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SiteNavbar } from '@/components/SiteNavbar'
import { SiteFooter } from '@/components/SiteFooter'

const STATS = [
  { value: '+300', label: 'Commandes livrées' },
  { value: '8 pays', label: 'Afrique francophone' },
  { value: '2024', label: 'Opérationnel depuis' },
  { value: '100%', label: 'Paiements Mobile Money' },
]

const VALUES = [
  { icon: ShieldCheck, title: 'Transparence', desc: 'Devis détaillés, photos avant expédition, suivi temps réel. Aucune surprise.' },
  { icon: Target, title: 'Accessibilité', desc: 'Mobile Money accepté, petites quantités possibles. Pour tous les entrepreneurs.' },
  { icon: Zap, title: 'Innovation', desc: 'Intelligence artificielle pour trouver les meilleurs fournisseurs en secondes.' },
  { icon: TrendingUp, title: 'Fiabilité', desc: 'Fournisseurs vérifiés, contrôle qualité, remboursement garanti en cas de problème.' },
]

const TEAM = [
  { initials: 'CL', name: 'Cluivert', role: 'Fondateur & CEO', location: 'Beijing' },
  { initials: 'AD', name: 'Agent Dev', role: 'Responsable Sourcing', location: 'Abidjan' },
  { initials: 'SA', name: 'Support Agent', role: 'Service Client', location: 'Dakar' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <Badge variant="secondary" className="rounded-full mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary mr-1" />
              Notre histoire
            </Badge>
            <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              À propos de{' '}
              <span className="text-primary">AfriSource AI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Rendre le commerce Chine-Afrique accessible à tous les entrepreneurs africains, quelle que soit leur taille ou leur capital.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 border-y border-border bg-card/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="secondary" className="rounded-full mb-4">Notre mission</Badge>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-5">
                  Démocratiser l'accès aux produits chinois pour l'Afrique
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Des millions d'entrepreneurs africains souhaitent importer des produits depuis la Chine mais se heurtent à des barrières : la langue, le manque de confiance dans les fournisseurs, l'absence de moyens de paiement internationaux, et la complexité logistique.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  AfriSource AI est né pour briser ces barrières. Grâce à l'intelligence artificielle et à notre réseau de partenaires en Chine et en Afrique, nous rendons le commerce Chine-Afrique aussi simple que d'envoyer un message WhatsApp.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-border bg-card text-center hover:border-primary/40 transition-colors">
                    <div className="font-serif text-3xl font-bold text-primary mb-1">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="rounded-full mb-6">Notre histoire</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-8">
              De l'idée à la plateforme
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                AfriSource AI a été fondé en 2024 à Beijing par des entrepreneurs passionnés par le potentiel du commerce Chine-Afrique. L'idée est née d'une frustration simple : trop d'entrepreneurs africains perdaient de l'argent dans des escroqueries sur Alibaba ou ne savaient pas comment démarrer.
              </p>
              <p>
                En combinant notre présence physique en Chine et l'intelligence artificielle de pointe, nous avons développé une plateforme qui permet à n'importe quel entrepreneur africain de trouver le bon fournisseur, d'obtenir un devis transparent, et de payer avec les outils qu'il utilise déjà — Mobile Money, Wave, Orange Money.
              </p>
              <p>
                Aujourd'hui, nous avons accompagné plus de 300 commandes réussies dans 8 pays d'Afrique francophone. Notre objectif est d'en faire 10 000 d'ici 2026, en aidant chaque entrepreneur africain à accéder aux meilleurs produits chinois sans risque et sans barrières.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-secondary/40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="rounded-full bg-card mb-4">Nos valeurs</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">Ce qui nous guide</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {VALUES.map((v, i) => (
                <Card key={i} className="border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif font-semibold text-base mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="rounded-full mb-4">Notre équipe</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">Des experts à votre service</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {TEAM.map((m, i) => (
                <Card key={i} className="border-border text-center hover:border-primary/40 transition-colors">
                  <CardContent className="p-8">
                    <Avatar className="h-16 w-16 mx-auto mb-4 ring-4 ring-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {m.initials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-base">{m.name}</h3>
                    <p className="text-sm text-primary">{m.role}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                      <Globe2 className="h-3 w-3" /> {m.location}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/5 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl font-bold mb-4">Prêt à commander depuis la Chine ?</h2>
            <p className="text-muted-foreground mb-8">Testez gratuitement — 3 analyses offertes, sans compte requis.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full gap-2">
                <Link to="/">
                  <Sparkles className="h-5 w-5" />
                  Analyser un produit
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
