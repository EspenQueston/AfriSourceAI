import { supabase } from './supabase'
import type { AIAnalysisResult, ProductData } from './supabase'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

// ─── Analyze product via Edge Function ───────────────────────────────────────

export interface AnalyzeResponse {
  success: boolean
  analysis: {
    id: string
    product_url: string
    product_name: string | null
    supplier_name: string | null
    price: number | null
    moq: number | null
    confidence_score: number | null
    ai_analysis: AIAnalysisResult
    raw_product_data: ProductData
    created_at: string
  }
}

export async function analyzeProduct(productUrl: string): Promise<AnalyzeResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')

  const response = await fetch(`${EDGE_FUNCTION_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ productUrl }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(err.error ?? `Erreur ${response.status}`)
  }

  return response.json()
}

// ─── Anonymous free analysis (no auth required) ──────────────────────────────

export interface FreeAnalysisSupplier {
  name: string
  url: string
  price_min: number
  price_max: number
  rating: number
  reviews: number
  moq: number
}

export interface FreeAnalysisReport {
  product_name: string
  category: string
  image_url: string | null
  price_min: number
  price_max: number
  suppliers: FreeAnalysisSupplier[]
  unit_price: number
  bulk_price: number
  moq: number
  sales_volume: string
  avg_rating: number
  total_reviews: number
  trend: 'up' | 'down' | 'stable'
  buy_price: number
  shipping_cost_min: number
  shipping_cost_max: number
  resale_price: number
  margin_percent: number
  verdict: 'good' | 'moderate' | 'bad'
  verdict_reason: string
  best_option: string
  customs_risk: boolean
  counterfeit_risk: boolean
  data_source?: 'api' | 'ai_estimate'
}

export async function analyzeFree(input: { type: 'url'; value: string } | { type: 'image'; base64: string; fileName: string }): Promise<FreeAnalysisReport> {
  const { data, error } = await supabase.functions.invoke<{ report: FreeAnalysisReport }>('analyze-free', {
    body: input,
  })

  if (error) {
    throw new Error(await getFunctionErrorMessage(error))
  }

  if (!data?.report) {
    throw new Error('Réponse invalide du service d\'analyse')
  }

  return data.report
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown })?.context

  if (context instanceof Response) {
    const payload = await context.clone().json().catch(() => null) as { error?: string; message?: string } | null
    return payload?.error ?? payload?.message ?? `Erreur ${context.status}`
  }

  return error instanceof Error ? error.message : 'Erreur réseau'
}

// ─── Compare analyses via Edge Function ──────────────────────────────────────

export interface CompareResponse {
  success: boolean
  comparison: {
    id: string
    winner_analysis_id: string
    ai_recommendation: string
  }
}

export async function compareAnalyses(analysisIds: string[]): Promise<CompareResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')

  const response = await fetch(`${EDGE_FUNCTION_URL}/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ analysisIds }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(err.error ?? `Erreur ${response.status}`)
  }

  return response.json()
}

// ─── Generate negotiation strategy via Edge Function ─────────────────────────

import type { NegotiationStrategyResult } from './supabase'

export interface NegotiateResponse {
  success: boolean
  negotiation: {
    id: string
    target_price: number | null
    negotiation_strategy: NegotiationStrategyResult
  }
}

export async function generateNegotiation(
  analysisId: string,
  targetPrice: number
): Promise<NegotiateResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')

  const response = await fetch(`${EDGE_FUNCTION_URL}/negotiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ analysisId, targetPrice }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erreur réseau' }))
    throw new Error(err.error ?? `Erreur ${response.status}`)
  }

  return response.json()
}
