import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, UserPlus, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/dashboard')
      } else {
        if (!name.trim()) {
          setError('Le nom est requis')
          return
        }
        if (password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères')
          return
        }
        await signUp(email, password, name)
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre compte.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      if (msg.includes('Invalid login credentials')) setError('Email ou mot de passe incorrect')
      else if (msg.includes('already registered')) setError('Cet email est déjà utilisé')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="w-full max-w-md relative">
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
            <Sparkles className="h-3 w-3 text-primary" />
            Plateforme d'analyse import/export
          </Badge>
        </div>

        <Card className="border-2 border-border shadow-2xl shadow-primary/5">
          <CardHeader className="pb-4">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-card shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn className="h-4 w-4 inline mr-2" />
                Connexion
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-card shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Créer un compte
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                  {success}
                </div>
              )}

              <Button type="submit" className="w-full h-11 rounded-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    {mode === 'login' ? 'Connexion...' : 'Création...'}
                  </span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Créer mon compte
                  </>
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

            {mode === 'login' && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Nouveau sur AfriSource AI ?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-primary hover:underline font-medium"
                  >
                    Créez votre compte gratuit
                  </button>
                </p>
              </div>
            )}

            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
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
