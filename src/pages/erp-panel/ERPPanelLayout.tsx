import { useState } from 'react'
import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Tag, Webhook,
  BarChart3, LogOut, Settings, ShoppingCart, Truck,
  Home, Menu, X, ChevronDown, Search
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const NAV_SECTIONS = [
  {
    title: 'Administration',
    items: [
      { icon: LayoutDashboard, label: "Vue d'ensemble",   to: '/erp-panel',              end: true },
      { icon: BarChart3,       label: 'Analytiques',       to: '/erp-panel/analytics'           },
    ],
  },
  {
    title: 'Commercial',
    items: [
      { icon: Settings, label: 'Formules & Plans', to: '/erp-panel/plans'     },
      { icon: CreditCard, label: 'Transactions',   to: '/erp-panel/transactions' },
      { icon: Tag,        label: 'Codes Promo',    to: '/erp-panel/promo'        },
      { icon: Webhook,    label: 'Webhooks',        to: '/erp-panel/webhooks'     },
    ],
  },
  {
    title: 'Gestion ERP',
    items: [
      { icon: Users,        label: 'Clients',    to: '/erp-panel/clients'  },
      { icon: ShoppingCart,  label: 'Commandes',  to: '/erp-panel/orders'   },
      { icon: Truck,         label: 'Livraisons', to: '/erp-panel/delivery' },
    ],
  },
  {
    title: 'Système',
    items: [
      { icon: Users, label: 'Utilisateurs', to: '/erp-panel/users' },
    ],
  },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const initials = (profile?.name ?? profile?.email ?? 'A').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut()
    navigate('/')
    onClose?.()
  }

  function toggleSection(title: string) {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }))
  }

  // Filter nav items by search
  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center font-black text-sm shadow-lg shadow-primary/30">
              A
            </div>
            <div>
              <span className="font-semibold text-sm block leading-tight">ERP Panel</span>
              <span className="text-xs text-muted-foreground">AfriSource AI</span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Admin badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{profile?.name ?? profile?.email ?? 'Admin'}</div>
            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">Admin</Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-3 space-y-1">
        {filteredSections.map(section => {
          const isCollapsed = collapsedSections[section.title]
          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider hover:text-muted-foreground transition"
              >
                {section.title}
                <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5">
                  {section.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-border space-y-0.5">
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Home className="h-4 w-4" />
          Accueil
        </NavLink>
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          App principale
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default function ERPPanelLayout() {
  const { user, profile, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // Admin guard
  if (!user || !profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  // Find current page title
  const currentItem = NAV_SECTIONS.flatMap(s => s.items).find(item =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card fixed top-0 left-0 h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-card border-r border-border z-50 shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              <span className="text-muted-foreground">ERP Panel</span>
              {currentItem && (
                <span className="text-foreground font-semibold"> — {currentItem.label}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex gap-1.5 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              En ligne
            </Badge>
            <ModeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
