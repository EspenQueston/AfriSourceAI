import { Link, useLocation, Outlet, useNavigate, Navigate } from 'react-router-dom'
import {
  ArrowLeft, Users, ShoppingCart, Truck, BarChart3,
  Home
} from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { useAuth } from '@/contexts/AuthContext'

const ERP_NAV = [
  { icon: BarChart3, label: 'Tableau de bord ERP', to: '/erp' },
  { icon: Users,      label: 'Clients',             to: '/erp/clients' },
  { icon: ShoppingCart, label: 'Commandes',          to: '/erp/orders' },
  { icon: Truck,      label: 'Livraisons',           to: '/erp/delivery' },
]

export default function ERPLayout() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // Admin-only guard
  if (!user || !profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card p-4 gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-black text-sm shadow-md shadow-primary/30">A</div>
          <div>
            <div className="font-serif font-semibold text-sm leading-none">AfriSource AI</div>
            <div className="text-xs text-muted-foreground">Mini ERP</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition mb-1"
        >
          <Home className="h-4 w-4" />
          Accueil
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tableau de bord
        </button>

        <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-1">ERP</div>
        {ERP_NAV.map((item) => {
          const exact = item.to === '/erp'
          const active = exact ? location.pathname === '/erp' : location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}

        <div className="mt-auto pt-2 border-t border-border" />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-20 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-serif font-semibold text-sm">AfriSource <span className="text-primary">ERP</span></span>
        </div>
        <div className="flex items-center gap-2">
          {ERP_NAV.slice(1).map((item) => {
            const active = location.pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} className={`h-8 w-8 rounded-lg grid place-items-center transition ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}>
                <item.icon className="h-4 w-4" />
              </Link>
            )
          })}
          <ModeToggle />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
