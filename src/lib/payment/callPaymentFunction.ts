import { supabase } from '@/lib/supabase'
import type { ProviderName } from './PaymentGatewayInterface'

type PaymentFunctionAction = 'initiate' | 'status'

interface PaymentFunctionBody {
  action: PaymentFunctionAction
  provider: ProviderName
  amount?: number
  currency?: string
  transactionId?: string
  description?: string
  phoneNumber?: string
  countryCode?: string
  returnUrl?: string
  notifyUrl?: string
  metadata?: Record<string, string>
}

export async function callPaymentFunction<T>(body: PaymentFunctionBody): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Non authentifié')
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string; message?: string } | null
    throw new Error(payload?.error ?? payload?.message ?? `Paiement indisponible (${res.status})`)
  }

  return res.json() as Promise<T>
}
