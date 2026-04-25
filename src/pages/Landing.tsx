import { Link } from "react-router-dom"
import { ArrowRight, ShoppingBag, Clock, Globe as Globe2, Wallet, Search, CreditCard, PackageCheck, MessageCircle, ShieldCheck, Camera, CircleCheck as CheckCircle2, Truck, Star, Send, Sparkles, Quote, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SiteNavbar } from "@/components/SiteNavbar"
import { SiteFooter } from "@/components/SiteFooter"
import { FreeAnalysisTool } from "@/components/FreeAnalysisTool"

const WHATSAPP_URL = "https://wa.me/?text=Bonjour%20AfriSource%20AI%2C%20voici%20ma%20demande%20produit"

function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-secondary text-secondary-foreground px-4 py-1.5 mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Agent d'achat Chine — Afrique francophone
            </Badge>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-foreground">
              Commande n'importe quel{" "}
              <span className="relative inline-block">
                <span className="relative z-10">produit</span>
                <span className="absolute left-0 bottom-1 h-3 w-full bg-primary/30 -z-0" />
              </span>{" "}
              depuis la Chine.{" "}
              <span className="text-primary">Sans parler chinois.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              AfriSource AI est ton agent d'achat basé en Chine. Tu envoies la photo du produit que tu veux, on trouve le meilleur fournisseur, on gère le paiement et la livraison jusqu'à toi — en toute transparence, même avec Mobile Money.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full text-base h-14 px-8 shadow-xl shadow-primary/25 group"
              >
                <Link to="/login">
                  <Sparkles className="h-5 w-5" />
                  Analyser un produit gratuitement
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full text-base h-14 px-8 group"
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <Camera className="h-5 w-5" />
                  WhatsApp
                </a>
              </Button>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground px-4">
                <Clock className="h-4 w-4 text-primary" />
                Réponse sous 24h — Sans engagement
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {["MK", "FD", "IB", "AS"].map((i) => (
                  <Avatar key={i} className="h-10 w-10 border-2 border-background ring-2 ring-primary/20">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                      {i}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                  <span className="ml-2 text-sm font-semibold">4.9/5</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  +300 commerçants nous font confiance
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <FreeAnalysisTool />
          </div>
        </div>
      </div>
    </section>
  )
}

function Credibility() {
  const items = [
    { icon: ShoppingBag, value: "+300", label: "commandes livrées en Afrique francophone" },
    { icon: Clock, value: "Depuis 2024", label: "Agent d'achat actif entre la Chine et l'Afrique" },
    { icon: Globe2, value: "8 pays desservis", label: "Sénégal, Côte d'Ivoire, Cameroun, Guinée, Mali, Togo, RDC, Bénin" },
    { icon: Wallet, value: "Mobile Money", label: "Orange Money, Wave, MTN, Moov acceptés" },
  ]
  return (
    <section className="py-16 border-y border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold font-serif">{item.value}</div>
              <div className="text-sm text-muted-foreground mt-1 leading-snug">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueProps() {
  const blocs = [
    {
      icon: Search,
      title: "Tu trouves le produit. On trouve le meilleur prix.",
      text: "Tu n'as plus besoin de naviguer sur 1688 ou Taobao sans rien comprendre. Tu envoies juste une photo ou une description, et on te revient avec le prix du fournisseur, les frais de livraison, et le total à payer — en FCFA ou dans ta devise locale. Zéro surprise, zéro mauvaise traduction.",
      tag: "Transparence totale",
    },
    {
      icon: CreditCard,
      title: "Pas de carte Visa ? Aucun problème.",
      text: "On accepte les paiements via Mobile Money (Orange Money, Wave, MTN, Moov) et les virements locaux. C'est nous qui gérons le paiement au fournisseur chinois. Tu n'as pas besoin de compte bancaire international, ni de carte Visa. Tu paies comme tu paies d'habitude.",
      tag: "Paiement local",
    },
    {
      icon: PackageCheck,
      title: "Ta commande arrive chez toi, sans stress.",
      text: "On gère la vérification du fournisseur, l'expédition depuis la Chine, le suivi en temps réel, et la livraison jusqu'à ton adresse ou ton pays. Tu reçois des photos et vidéos à chaque étape. Plus besoin de te demander \"où est ma commande ?\" — on te tient informé jusqu'à la livraison.",
      tag: "Livraison suivie",
    },
  ]
  return (
    <section id="valeur" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">Pourquoi AfriSource AI</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Trois problèmes résolus, <span className="text-primary">zéro galère.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {blocs.map((b, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden border-border hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-chart-2 to-chart-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-muted rounded-full px-3 py-1">
                    0{i + 1}
                  </span>
                </div>
                <Badge variant="outline" className="mb-3 rounded-full text-primary border-primary/30">
                  {b.tag}
                </Badge>
                <h3 className="font-serif text-xl font-semibold tracking-tight mb-3 leading-snug">
                  {b.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{b.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Send,
      title: "Envoie ta demande",
      text: "Tu nous envoies la photo ou la description du produit que tu veux sur WhatsApp. On analyse ta demande et on te revient sous 24h avec le prix exact, le délai de livraison, et les détails de la commande.",
    },
    {
      n: "02",
      icon: CheckCircle2,
      title: "Tu confirmes et tu paies",
      text: "Tu valides le devis. Tu paies via Mobile Money ou virement — en toute sécurité. Dès réception du paiement, on passe la commande au fournisseur et on te confirme le démarrage.",
    },
    {
      n: "03",
      icon: PackageCheck,
      title: "Tu reçois ta commande",
      text: "On gère tout : achat, contrôle qualité, expédition, suivi et livraison jusqu'à toi. Tu reçois des updates réguliers et ta commande arrive à ton adresse en Afrique.",
    },
  ]
  return (
    <section id="process" className="py-24 bg-secondary/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-2xl mb-16">
          <Badge variant="secondary" className="rounded-full bg-card mb-4">Comment ça marche</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Trois étapes. <span className="text-primary">C'est tout.</span>
          </h2>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 relative">
            {steps.map((s, i) => (
              <div
                key={i}
                className="relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 group"
              >
                <div className="absolute -top-5 left-8">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 font-serif font-bold text-lg">
                    {s.n}
                  </div>
                </div>
                <div className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-secondary text-primary grid place-items-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold tracking-tight mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{s.text}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <div className="h-8 w-8 rounded-full bg-card border border-border grid place-items-center">
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const items = [
    {
      text: "J'avais essayé de commander sur Alibaba tout seul et j'ai perdu 80 000 FCFA dans une arnaque. Avec AfriSource AI, j'ai commandé 50 paires de sneakers pour ma boutique. J'ai tout reçu en 3 semaines, exactement comme sur les photos. Je recommande les yeux fermés.",
      name: "Moussa K.",
      role: "Revendeur de chaussures, Abidjan",
      initials: "MK",
    },
    {
      text: "Ce qui m'a convaincu c'est qu'ils m'ont envoyé des photos du produit avant l'expédition. Je savais exactement ce que j'allais recevoir. J'ai commandé des téléphones reconditionnés et j'ai pu tripler ma mise en les revendant ici à Dakar. Le processus est simple et transparent.",
      name: "Fatou D.",
      role: "Vendeuse en ligne, Dakar",
      initials: "FD",
    },
    {
      text: "Je n'avais pas de carte Visa, je pensais que c'était impossible de commander depuis la Chine. Ils acceptent Wave — j'ai payé depuis mon téléphone comme d'habitude. Ma commande de cosmétiques est arrivée en moins d'un mois. Je travaille avec eux chaque mois maintenant.",
      name: "Ismaël B.",
      role: "Entrepreneur, Douala",
      initials: "IB",
    },
  ]
  return (
    <section id="avis" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">Ils nous font confiance</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Des commerçants <span className="text-primary">qui cartonnent</span> grâce à la Chine.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <Card
              key={i}
              className="relative border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed text-sm italic mb-6">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const items = [
    {
      q: "Est-ce que c'est fiable ? Comment je sais que ce n'est pas une arnaque ?",
      a: "On travaille en totale transparence : tu reçois le nom du fournisseur, des photos du produit avant expédition, et un numéro de suivi dès que ta commande part de Chine. On ne demande jamais d'argent avant de t'avoir fourni un devis détaillé et validé ensemble.",
    },
    {
      q: "Combien ça coûte pour utiliser votre service ?",
      a: "On prend une commission de 5 à 10% sur le montant total de ta commande (produit + livraison). Il n'y a aucun frais caché. Tout est indiqué dans le devis avant que tu confirmes quoi que ce soit.",
    },
    {
      q: "Je n'ai pas beaucoup de capital. Quel est le minimum pour commander ?",
      a: "Tu peux démarrer avec aussi peu que 30 000 à 50 000 FCFA selon le produit. On t'aide à identifier les fournisseurs qui acceptent les petites quantités pour que tu puisses tester avant de commander en gros.",
    },
    {
      q: "Combien de temps prend la livraison en Afrique ?",
      a: "En général, entre 15 et 35 jours selon le pays et la méthode d'expédition choisie. On t'informe du délai exact dans le devis et on te tient au courant à chaque étape.",
    },
  ]
  return (
    <section id="faq" className="py-24 bg-secondary/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="rounded-full bg-card mb-4">FAQ</Badge>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
            Questions <span className="text-primary">fréquentes</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {items.map((it, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-6 data-[state=open]:border-primary/40 data-[state=open]:shadow-lg data-[state=open]:shadow-primary/5"
            >
              <AccordionTrigger className="text-left font-serif text-base sm:text-lg font-semibold hover:no-underline py-5">
                {it.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
                {it.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 hero-glow" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative rounded-3xl border border-border bg-card p-10 sm:p-16 text-center overflow-hidden shadow-2xl shadow-primary/10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-chart-2/20 blur-3xl" />

          <Badge variant="secondary" className="rounded-full mb-6 relative">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Démarre aujourd'hui
          </Badge>
          <h2 className="relative font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Tu veux des produits de Chine livrés chez toi,{" "}
            <span className="text-primary">sans te compliquer la vie ?</span>
          </h2>
          <p className="relative mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Des centaines de commerçants africains commandent déjà depuis la Chine avec AfriSource AI — sans parler chinois, sans carte Visa, et sans risquer leur argent. On s'occupe de tout, de la recherche du produit jusqu'à la livraison à ton adresse. Il ne te reste qu'une chose à faire.
          </p>

          <div className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full text-base h-14 px-8 shadow-xl shadow-primary/30 group"
            >
              <Link to="/login">
                <Sparkles className="h-5 w-5" />
                Commencer — 3 analyses gratuites
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <p className="relative mt-4 text-sm text-muted-foreground">
            C'est gratuit et sans engagement
          </p>

          <div className="relative mt-10 pt-8 border-t border-border grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: ShieldCheck, label: "Paiement sécurisé" },
              { icon: Truck, label: "Livraison suivie" },
              { icon: MessageCircle, label: "Support 24h" },
            ].map((i, k) => (
              <div key={k} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <i.icon className="h-4 w-4 text-primary" />
                <span>{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground overflow-x-hidden">
      <SiteNavbar />
      <main>
        <Hero />
        <Credibility />
        <ValueProps />
        <HowItWorks />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
