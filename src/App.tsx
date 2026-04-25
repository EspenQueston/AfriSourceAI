import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'

// Pages
import LandingPage from '@/pages/Landing'
import AboutPage from '@/pages/About'
import ServicesPage from '@/pages/Services'
import ContactPage from '@/pages/Contact'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import DashboardLayout from '@/pages/DashboardLayout'
import AnalyzePage from '@/pages/Analyze'
import AnalysisResultPage from '@/pages/AnalysisResult'
import PricingPage from '@/pages/Pricing'
import ComparePage from '@/pages/Compare'
import NegotiatePage from '@/pages/Negotiate'
import ProfilePage from '@/pages/Profile'
import SettingsPage from '@/pages/Settings'
import CheckoutPage from '@/pages/Checkout'
import DashboardPricingPage from '@/pages/DashboardPricing'

// Unified ERP Panel
import ERPPanelLayout from '@/pages/erp-panel/ERPPanelLayout'
import ERPPanelDashboard from '@/pages/erp-panel/ERPPanelDashboard'

// Re-use existing admin pages (they work standalone)
import AdminPlans from '@/pages/admin/AdminPlans'
import AdminTransactions from '@/pages/admin/AdminTransactions'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminPromoCodes from '@/pages/admin/AdminPromoCodes'
import AdminWebhooks from '@/pages/admin/AdminWebhooks'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminAIQuality from '@/pages/admin/AdminAIQuality'

// Re-use existing ERP pages
import ClientsPage from '@/pages/erp/Clients'
import OrdersPage from '@/pages/erp/Orders'
import DeliveryPage from '@/pages/erp/Delivery'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [loading])

  if (loading && !timedOut) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
  if (timedOut && !user) return <Navigate to="/login" replace />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [loading])

  if (loading && !timedOut) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      {/* Dashboard — all pages share the sidebar layout */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/analysis/:id" element={<AnalysisResultPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/negotiate" element={<NegotiatePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/dashboard/pricing" element={<DashboardPricingPage />} />
      </Route>
      {/* Unified ERP Panel — Admin + ERP + Users */}
      <Route path="/erp-panel" element={<AdminRoute><ERPPanelLayout /></AdminRoute>}>
        <Route index element={<ERPPanelDashboard />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="promo" element={<AdminPromoCodes />} />
        <Route path="webhooks" element={<AdminWebhooks />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="ai-quality" element={<AdminAIQuality />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="delivery" element={<DeliveryPage />} />
      </Route>
      {/* Legacy redirects — old /admin and /erp routes redirect to unified panel */}
      <Route path="/admin" element={<Navigate to="/erp-panel" replace />} />
      <Route path="/admin/*" element={<Navigate to="/erp-panel" replace />} />
      <Route path="/erp" element={<Navigate to="/erp-panel" replace />} />
      <Route path="/erp/*" element={<Navigate to="/erp-panel" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="afrisource-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
