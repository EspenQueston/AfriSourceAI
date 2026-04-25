import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Search, GitCompare, MessageSquare, Settings,
  LogOut, Crown, User, Home, Menu, X, ShieldCheck
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Tableau de bord', to: '/dashboard', exact: true },
  { icon: Search, label: 'Analyser un produit', to: '/analyze' },
  { icon: GitCompare, label: 'Comparer', to: '/compare' },
  { icon: MessageSquare, label: 'Négociation', to: '/negotiate' },
]

const ACCOUNT_ITEMS = [
  { icon: Crown, label: 'Paiement & plans', to: '/dashboard/pricing' },
  { icon: User, label: 'Mon profil', to: '/profile' },
  { icon: Settings, label: 'Paramètres', to: '/settings' },
]

const PLAN_COLORS = {
  free: 'bg-secondary text-secondary-foreground',
  basic: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  pro: 'bg-primary/15 text-primary',
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const tier = (profile?.subscription_tier ?? 'free') as 'free' | 'basic' | 'pro'
  const initials = (profile?.name ?? profile?.email ?? 'U').slice(0, 2).toUpperCase()
  const basicCredits = (profile?.basic_credits_remaining ?? profile?.credits_remaining ?? 0) + (profile?.payg_basic_credits ?? 0)
  const advancedCredits = (profile?.advanced_credits_remaining ?? 0) + (profile?.payg_advanced_credits ?? 0)

  function isActive(to: string, exact = false) {
    if (exact) return location.pathname === to
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
    onClose?.()
  }

  function navClass(to: string, exact = false) {
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive(to, exact)
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`
  }

  return (
    <div className="flex flex-col h-full py-4 px-3 gap-1 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-black text-sm shadow-md shadow-primary/30">
            A
          </div>
          <span className="font-serif font-semibold">AfriSource<span className="text-primary"> AI</span></span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* User badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 mb-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{profile?.name ?? profile?.email ?? 'Utilisateur'}</div>
          <Badge className={`text-[10px] py-0 px-1.5 h-4 ${PLAN_COLORS[tier]}`}>
            {tier === 'free' ? 'Gratuit' : tier === 'basic' ? 'Standard' : 'Pro'}
          </Badge>
        </div>
      </div>

      {/* Main nav */}
      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className={navClass(item.to, item.exact)} onClick={onClose}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Account */}
      <div className="pt-3">
        <div className="text-xs font-semibold text-muted-foreground/50 px-3 py-1 uppercase tracking-wider">Compte</div>
        <div className="space-y-0.5">
          {ACCOUNT_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className={navClass(item.to)} onClick={onClose}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Admin section — visible only for admins */}
      {profile?.is_admin && (
        <div className="pt-3">
          <div className="text-xs font-semibold text-muted-foreground/50 px-3 py-1 uppercase tracking-wider">Administration</div>
          <div className="space-y-0.5">
            <Link to="/erp-panel" className={navClass('/erp-panel')} onClick={onClose}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              ERP Panel
            </Link>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-1 pt-3">
        {/* Credits */}
        <div className="px-3 py-2.5 rounded-xl bg-muted/50 space-y-1.5 mb-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Crédits Basic</span>
            <span className="font-bold text-foreground">{basicCredits}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Advanced</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{advancedCredits}</span>
          </div>
          {tier === 'free' && (
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.round((basicCredits / 3) * 100)}%` }}
              />
            </div>
          )}
        </div>

        <Link
          to="/dashboard/pricing"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 text-primary hover:from-primary/20 transition-all"
          onClick={onClose}
        >
          <Crown className="h-4 w-4" />
          Recharger / Upgrader
        </Link>

        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          onClick={onClose}
        >
          <Home className="h-4 w-4" />
          Accueil
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar — fixed */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed top-0 left-0 h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border z-50">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center font-black text-xs">A</div>
            <span className="font-serif font-semibold text-sm">AfriSource<span className="text-primary"> AI</span></span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      {/* Main content — offset for sidebar on desktop, offset for top bar on mobile */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
