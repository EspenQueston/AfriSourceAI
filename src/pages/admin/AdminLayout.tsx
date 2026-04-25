import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Tag, Webhook,
  BarChart3, LogOut, ArrowLeft, Settings
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Vue d'ensemble",   to: '/admin',              end: true },
  { icon: Settings,        label: 'Formules',          to: '/admin/plans'               },
  { icon: CreditCard,      label: 'Transactions',      to: '/admin/transactions'        },
  { icon: Users,           label: 'Utilisateurs',      to: '/admin/users'               },
  { icon: Tag,             label: 'Codes Promo',       to: '/admin/promo'               },
  { icon: Webhook,         label: 'Webhooks',          to: '/admin/webhooks'            },
  { icon: BarChart3,       label: 'Analytiques',       to: '/admin/analytics'           },
]

export default function AdminLayout() {
  const { user, profile, signOut, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // Admin guard — redirect non-admins back to dashboard
  if (!user || !profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  const initials = (profile?.name ?? profile?.email ?? 'A').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card p-4 gap-1 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-red-600 text-white grid place-items-center font-black text-sm">
            A
          </div>
          <div>
            <span className="font-semibold text-sm">Admin Panel</span>
            <Badge variant="destructive" className="ml-1 text-[10px] py-0 px-1">Admin</Badge>
          </div>
        </div>

        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        <div className="mt-auto space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </NavLink>
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            App principale
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            AfriSource AI — <span className="text-foreground font-semibold">Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-red-100 text-red-700 text-xs font-bold dark:bg-red-950 dark:text-red-300">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
