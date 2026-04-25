import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, LogIn, UserPlus, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const COUNTRIES = [
  'Bénin', 'Togo', 'Sénégal', "Côte d'Ivoire", 'Cameroun', 'Mali', 'Guinée',
  'RD Congo', 'Niger', 'Burkina Faso', 'Autre',
]

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', country: '' })
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur Google')
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        navigate('/dashboard')
      } else {
        if (!form.name.trim()) { toast.error('Le prénom est requis'); return }
        if (form.password.length < 6) { toast.error('Minimum 6 caractères pour le mot de passe'); return }
        await signUp(form.email, form.password, form.name, form.country || undefined)
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      if (msg.includes('Invalid login credentials')) toast.error('Email ou mot de passe incorrect')
      else if (msg.includes('already registered')) toast.error('Cet email est déjà utilisé')
      else toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center font-black shadow-lg shadow-primary/30 text-lg">
              A
            </div>
            <span className="font-serif text-xl font-semibold">
              AfriSource<span className="text-primary"> AI</span>
            </span>
          </div>
          <Badge variant="secondary" className="rounded-full px-4 py-1">
            <Sparkles className="h-3 w-3 text-primary mr-1" />
            Plateforme d'analyse import/export
          </Badge>
        </div>

        <Card className="border-2 border-border shadow-2xl shadow-primary/5">
          <CardHeader className="pb-4">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn className="h-4 w-4 inline mr-2" />
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'register' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Créer un compte
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Prénom</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre prénom"
                    value={form.name}
                    onChange={update('name')}
                    required
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'register' ? 'Minimum 6 caractères' : '••••••••'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="country">Pays</Label>
                  <select
                    id="country"
                    value={form.country}
                    onChange={update('country')}
                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Sélectionner votre pays</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full h-11 rounded-full mt-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'login' ? (
                  <><LogIn className="h-4 w-4 mr-2" />Se connecter</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" />Créer mon compte</>
                )}
              </Button>

              {mode === 'register' && (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  En créant un compte, vous acceptez nos{' '}
                  <a href="#" className="underline hover:text-foreground">Conditions d'utilisation</a>
                  {' '}et notre{' '}
                  <a href="#" className="underline hover:text-foreground">Politique de confidentialité</a>
                </p>
              )}
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>Nouveau sur AfriSource AI ?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline font-medium">
                    Créez votre compte gratuit
                  </button>
                </>
              ) : (
                <>Déjà un compte ?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                    Se connecter
                  </button>
                </>
              )}
            </p>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p className="font-medium text-foreground">✨ Plan Gratuit inclus</p>
                <p>3 analyses gratuites · Pas de carte bancaire requise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
