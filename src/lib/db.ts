import { supabase } from './supabase'
import type { Database, ERPClient, ERPOrder, ERPDelivery, ERPCountry, ERPOrderStatus, ERPDeliveryStatus, Plan, Subscription, PaymentTransaction, PromoCode, CreditBalance } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Analysis = Database['public']['Tables']['analyses']['Row']
type Comparison = Database['public']['Tables']['comparisons']['Row']
type Negotiation = Database['public']['Tables']['negotiations']['Row']

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.warn('getProfile error:', error.message)
    return null
  }
  return data
}

export async function updateProfile(userId: string, updates: Database['public']['Tables']['profiles']['Update']) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Analyses ─────────────────────────────────────────────────────────────────

export async function getUserAnalyses(userId: string): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('getUserAnalyses error:', error.message)
    return []
  }
  return data ?? []
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.warn('getAnalysis error:', error.message)
    return null
  }
  return data
}

export async function saveAnalysis(params: {
  userId: string
  productUrl: string
  productData: import('./supabase').ProductData
  analysis: import('./supabase').AIAnalysisResult
}): Promise<Analysis> {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: params.userId,
      product_url: params.productUrl,
      product_name: params.productData.name || null,
      supplier_name: params.productData.supplierName || null,
      price: params.productData.price || null,
      moq: params.productData.moq || null,
      confidence_score: params.analysis.confidenceScore,
      ai_analysis: params.analysis as unknown as never,
      raw_product_data: params.productData as unknown as never,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export async function decrementCredits(userId: string) {
  const { error } = await supabase.rpc('decrement_credits', { user_id: userId })
  if (error) throw error
}

// ─── Comparisons ──────────────────────────────────────────────────────────────

export async function saveComparison(params: {
  userId: string
  analysisIds: string[]
  winnerAnalysisId?: string
  aiRecommendation?: string
}): Promise<Comparison> {
  const { data, error } = await supabase
    .from('comparisons')
    .insert({
      user_id: params.userId,
      analysis_ids: params.analysisIds,
      winner_analysis_id: params.winnerAnalysisId ?? null,
      ai_recommendation: params.aiRecommendation ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserComparisons(userId: string): Promise<Comparison[]> {
  const { data, error } = await supabase
    .from('comparisons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Negotiations ─────────────────────────────────────────────────────────────

export async function saveNegotiation(params: {
  userId: string
  analysisId: string
  targetPrice: number
  strategy: object
  messages: object
}): Promise<Negotiation> {
  const { data, error } = await supabase
    .from('negotiations')
    .insert({
      user_id: params.userId,
      analysis_id: params.analysisId,
      target_price: params.targetPrice,
      strategy: params.strategy as unknown as never,
      messages: params.messages as unknown as never,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserNegotiations(userId: string): Promise<Negotiation[]> {
  const { data, error } = await supabase
    .from('negotiations')
    .select('*, analyses(product_name, product_url, price)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── ERP: Clients ─────────────────────────────────────────────────────────────

export async function getERPClients(userId: string): Promise<ERPClient[]> {
  const { data, error } = await supabase
    .from('erp_clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ERPClient[]
}

export async function createERPClient(userId: string, client: Omit<ERPClient, 'id' | 'user_id' | 'created_at'>): Promise<ERPClient> {
  const { data, error } = await supabase
    .from('erp_clients')
    .insert({ ...client, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as ERPClient
}

export async function updateERPClient(id: string, updates: Partial<Omit<ERPClient, 'id' | 'user_id' | 'created_at'>>): Promise<ERPClient> {
  const { data, error } = await supabase
    .from('erp_clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ERPClient
}

export async function deleteERPClient(id: string) {
  const { error } = await supabase.from('erp_clients').delete().eq('id', id)
  if (error) throw error
}

// ─── ERP: Orders ──────────────────────────────────────────────────────────────

export async function getERPOrders(userId: string): Promise<ERPOrder[]> {
  const { data, error } = await supabase
    .from('erp_orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ERPOrder[]
}

export async function createERPOrder(userId: string, order: Omit<ERPOrder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ERPOrder> {
  const { data, error } = await supabase
    .from('erp_orders')
    .insert({ ...order, user_id: userId, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as ERPOrder
}

export async function updateERPOrder(id: string, updates: Partial<Omit<ERPOrder, 'id' | 'user_id' | 'created_at'>>): Promise<ERPOrder> {
  const { data, error } = await supabase
    .from('erp_orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ERPOrder
}

export async function deleteERPOrder(id: string) {
  const { error } = await supabase.from('erp_orders').delete().eq('id', id)
  if (error) throw error
}

// ─── ERP: Deliveries ──────────────────────────────────────────────────────────

export async function getERPDeliveries(userId: string): Promise<ERPDelivery[]> {
  const { data, error } = await supabase
    .from('erp_deliveries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ERPDelivery[]
}

export async function createERPDelivery(userId: string, delivery: Omit<ERPDelivery, 'id' | 'user_id' | 'created_at'>): Promise<ERPDelivery> {
  const { data, error } = await supabase
    .from('erp_deliveries')
    .insert({ ...delivery, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as ERPDelivery
}

export async function updateERPDelivery(id: string, updates: Partial<Omit<ERPDelivery, 'id' | 'order_id' | 'user_id' | 'created_at'>>): Promise<ERPDelivery> {
  const { data, error } = await supabase
    .from('erp_deliveries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as ERPDelivery
}

// Suppress unused import warnings (types used in function signatures above)
export type { ERPCountry, ERPOrderStatus, ERPDeliveryStatus }

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Plan[]
}

export async function getAllPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Plan[]
}

export async function createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .insert({ ...plan, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as Plan
}

export async function updatePlan(id: string, updates: Partial<Omit<Plan, 'id' | 'created_at'>>): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Plan
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from('plans').delete().eq('id', id)
  if (error) throw error
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as Subscription | null
}

export async function createSubscription(sub: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(sub)
    .select()
    .single()
  if (error) throw error
  return data as Subscription
}

export async function updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Subscription
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, profiles(email, name), plans(display_name, type)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Subscription[]
}

// ─── Payment Transactions ─────────────────────────────────────────────────────

export async function createTransaction(tx: Omit<PaymentTransaction, 'id' | 'created_at'>): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert(tx)
    .select()
    .single()
  if (error) throw error
  return data as PaymentTransaction
}

export async function getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PaymentTransaction[]
}

export async function getAllTransactions(filters?: {
  status?: string
  gateway?: string
  country?: string
  from?: string
  to?: string
}): Promise<PaymentTransaction[]> {
  let query = supabase
    .from('payment_transactions')
    .select('*, profiles(email, name)')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.gateway) query = query.eq('gateway', filters.gateway)
  if (filters?.country) query = query.eq('country_code', filters.country)
  if (filters?.from) query = query.gte('created_at', filters.from)
  if (filters?.to) query = query.lte('created_at', filters.to)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as PaymentTransaction[]
}

export async function updateTransaction(id: string, updates: Partial<Omit<PaymentTransaction, 'id' | 'user_id' | 'created_at'>>): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PaymentTransaction
}

// ─── Credit Balance ───────────────────────────────────────────────────────────

export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const { data, error } = await supabase.rpc('get_credit_balance', { p_user_id: userId })
  if (error) throw error
  return data as CreditBalance
}

export async function consumeBasicCredit(userId: string, feature?: string): Promise<{ success: boolean; reason?: string; source?: string }> {
  const { data, error } = await supabase.rpc('consume_basic_credit', {
    p_user_id: userId,
    p_feature: feature ?? null,
  })
  if (error) throw error
  return data as { success: boolean; reason?: string; source?: string }
}

export async function consumeAdvancedCredit(userId: string, feature?: string): Promise<{ success: boolean; reason?: string; source?: string }> {
  const { data, error } = await supabase.rpc('consume_advanced_credit', {
    p_user_id: userId,
    p_feature: feature ?? null,
  })
  if (error) throw error
  return data as { success: boolean; reason?: string; source?: string }
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

export async function getPromoCode(code: string): Promise<PromoCode | null> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data as PromoCode | null
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PromoCode[]
}

export async function createPromoCode(promo: Omit<PromoCode, 'id' | 'created_at' | 'used_count'>): Promise<PromoCode> {
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({ ...promo, used_count: 0 })
    .select()
    .single()
  if (error) throw error
  return data as PromoCode
}

export async function updatePromoCode(id: string, updates: Partial<Omit<PromoCode, 'id' | 'created_at'>>): Promise<PromoCode> {
  const { data, error } = await supabase
    .from('promo_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PromoCode
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export async function getExchangeRates(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('base_currency, target_currency, rate')
  if (error) throw error
  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[`${row.base_currency}_${row.target_currency}`] = row.rate
  }
  return map
}

export async function updateExchangeRate(base: string, target: string, rate: number) {
  const { error } = await supabase
    .from('exchange_rates')
    .upsert({ base_currency: base, target_currency: target, rate, fetched_at: new Date().toISOString() }, { onConflict: 'base_currency,target_currency' })
  if (error) throw error
}

// ─── Admin: All Users ─────────────────────────────────────────────────────────

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)
  if (error) throw error
}

// ─── Admin: Analytics / MRR ──────────────────────────────────────────────────

export async function getAdminStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [txRes, subRes, usageRes] = await Promise.all([
    supabase.from('payment_transactions').select('amount_usd, status, created_at'),
    supabase.from('subscriptions').select('status, plan_id, created_at'),
    supabase.from('usage_logs').select('request_type, source, created_at').gte('created_at', startOfMonth),
  ])

  if (txRes.error) throw txRes.error
  if (subRes.error) throw subRes.error
  if (usageRes.error) throw usageRes.error

  const successTx = (txRes.data ?? []).filter(t => t.status === 'success')
  const mrr = successTx
    .filter(t => new Date(t.created_at) >= new Date(startOfMonth))
    .reduce((sum, t) => sum + (t.amount_usd ?? 0), 0)

  const totalRevenue = successTx.reduce((sum, t) => sum + (t.amount_usd ?? 0), 0)
  const activeSubs = (subRes.data ?? []).filter(s => s.status === 'active').length
  const totalRequests = (usageRes.data ?? []).length
  const basicRequests = (usageRes.data ?? []).filter(u => u.request_type === 'basic').length
  const advancedRequests = (usageRes.data ?? []).filter(u => u.request_type === 'advanced').length

  return { mrr, totalRevenue, activeSubs, totalRequests, basicRequests, advancedRequests }
}


