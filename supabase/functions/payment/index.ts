import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RequestBody {
  action: 'initiate' | 'status'
  provider: 'cinetpay' | 'fedapay' | 'stripe'
  // initiate fields
  amount?: number
  currency?: string
  transactionId?: string
  description?: string
  phoneNumber?: string
  countryCode?: string
  returnUrl?: string
  notifyUrl?: string
  metadata?: Record<string, string>
  // status fields — also uses transactionId above
}

// ── CinetPay helpers ───────────────────────────────────────────────────────────

async function cinetpayInitiate(body: RequestBody, siteId: string, apiKey: string) {
  const transactionId = body.transactionId ?? crypto.randomUUID()
  const payload = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: transactionId,
    amount: body.amount,
    currency: body.currency ?? 'XOF',
    description: body.description ?? 'AfriSourceAI',
    notify_url: body.notifyUrl ?? '',
    return_url: body.returnUrl ?? '',
    customer_phone_number: body.phoneNumber ?? '',
    channels: 'MOBILE_MONEY',
    metadata: JSON.stringify({ source: 'afrisourceai', ...body.metadata }),
    lang: 'FR',
  }
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  const paymentUrl = data?.data?.payment_url
  const ussdCode = data?.data?.ussd_code
  const success = res.ok && (Boolean(paymentUrl) || Boolean(ussdCode) || data?.code === '201' || data?.code === '00')

  return {
    success,
    transactionId,
    paymentUrl,
    ussdCode,
    message: data?.message ?? data?.description,
    rawResponse: data,
  }
}

async function cinetpayStatus(transactionId: string, siteId: string, apiKey: string) {
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
  })
  const data = await res.json()
  // CinetPay: status 00 = success, others = failed/pending
  const s = data?.data?.status
  const mapped = s === '00' ? 'success' : s === 'PENDING' ? 'pending' : 'failed'
  return { transactionId, status: mapped, rawResponse: data }
}

// ── FedaPay helpers ────────────────────────────────────────────────────────────

async function fedapayInitiate(body: RequestBody, apiKey: string) {
  const res = await fetch('https://api.fedapay.com/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      description: body.description ?? 'AfriSourceAI',
      amount: body.amount,
      currency: { iso: body.currency ?? 'XOF' },
      callback_url: body.returnUrl ?? '',
      customer: { phone_number: { number: body.phoneNumber, country: body.countryCode ?? 'bj' } },
    }),
  })
  const data = await res.json()
  const id = data?.v1_transaction?.id
  if (!id) return { success: false, transactionId: body.transactionId ?? null, message: 'No transaction id from FedaPay', rawResponse: data }

  // request token
  const tokenRes = await fetch(`https://api.fedapay.com/v1/transactions/${id}/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const tokenData = await tokenRes.json()
  return {
    success: Boolean(tokenData?.url),
    transactionId: String(id),
    paymentUrl: tokenData?.url,
    rawResponse: tokenData,
  }
}

async function fedapayStatus(transactionId: string, apiKey: string) {
  const res = await fetch(`https://api.fedapay.com/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const data = await res.json()
  const s = data?.v1_transaction?.status
  const mapped = s === 'approved' ? 'success' : s === 'declined' || s === 'cancelled' ? 'failed' : 'pending'
  return { transactionId, status: mapped, rawResponse: data }
}

// ── Stripe helpers ─────────────────────────────────────────────────────────────

async function stripeInitiate(body: RequestBody, secretKey: string) {
  const params = new URLSearchParams()
  params.append('payment_method_types[]', 'card')
  params.append('line_items[0][price_data][currency]', (body.currency ?? 'usd').toLowerCase())
  params.append('line_items[0][price_data][product_data][name]', body.description ?? 'AfriSourceAI')
  params.append('line_items[0][price_data][unit_amount]', String(Math.round((body.amount ?? 0) * 100)))
  params.append('line_items[0][quantity]', '1')
  params.append('mode', 'payment')
  params.append('success_url', body.returnUrl ?? 'https://localhost:5173/checkout?done=1')
  params.append('cancel_url', body.returnUrl ?? 'https://localhost:5173/checkout?cancelled=1')
  params.append('metadata[transaction_id]', body.transactionId ?? '')

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const data = await res.json()
  return {
    success: Boolean(data?.url),
    transactionId: data?.id ?? body.transactionId ?? null,
    paymentUrl: data?.url,
    message: data?.error?.message,
    rawResponse: data,
  }
}

async function stripeStatus(sessionId: string, secretKey: string) {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const data = await res.json()
  const s = data?.payment_status
  const mapped = s === 'paid' ? 'success' : s === 'no_payment_required' ? 'success' : 'pending'
  return { transactionId: sessionId, status: mapped, rawResponse: data }
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body: RequestBody = await req.json()

    // Authenticate request via Supabase JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const provider = body.provider ?? 'cinetpay'
    let result: Record<string, unknown>

    if (body.action === 'initiate') {
      if (provider === 'cinetpay') {
        const siteId = Deno.env.get('CINETPAY_SITE_ID')!
        const apiKey = Deno.env.get('CINETPAY_API_KEY')!
        result = await cinetpayInitiate(body, siteId, apiKey)
      } else if (provider === 'fedapay') {
        const apiKey = Deno.env.get('FEDAPAY_API_KEY')!
        result = await fedapayInitiate(body, apiKey)
      } else if (provider === 'stripe') {
        const secretKey = Deno.env.get('STRIPE_SECRET_KEY')!
        result = await stripeInitiate(body, secretKey)
      } else {
        return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    } else if (body.action === 'status') {
      if (!body.transactionId) return new Response(JSON.stringify({ error: 'transactionId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      if (provider === 'cinetpay') {
        const siteId = Deno.env.get('CINETPAY_SITE_ID')!
        const apiKey = Deno.env.get('CINETPAY_API_KEY')!
        result = await cinetpayStatus(body.transactionId, siteId, apiKey)
      } else if (provider === 'fedapay') {
        const apiKey = Deno.env.get('FEDAPAY_API_KEY')!
        result = await fedapayStatus(body.transactionId, apiKey)
      } else if (provider === 'stripe') {
        const secretKey = Deno.env.get('STRIPE_SECRET_KEY')!
        result = await stripeStatus(body.transactionId, secretKey)
      } else {
        return new Response(JSON.stringify({ error: 'Unknown provider' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
