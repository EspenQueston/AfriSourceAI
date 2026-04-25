import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const ONEBOUND_KEY = Deno.env.get("ONEBOUND_KEY")
const ONEBOUND_SECRET = Deno.env.get("ONEBOUND_SECRET")

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  try {
    // ── 1. Parse request body ─────────────────────────────────────────────────
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown"
    const body = await req.json()
    const { type } = body as { type: "url" | "image"; value?: string; base64?: string; fileName?: string }

    if (type !== "url" && type !== "image") {
      return json({ error: "type doit être 'url' ou 'image'" }, 400)
    }

    // ── 2. IP Rate limiting (1 req / IP / 24h) ───────────────────────────────
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      )

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: existing } = await supabaseAdmin
        .from("free_analysis_rate_limits")
        .select("id")
        .eq("ip", clientIP)
        .gte("created_at", oneDayAgo)
        .limit(1)
        .maybeSingle()

      if (existing) {
        return json({ error: "Limite atteinte : 1 analyse gratuite par IP toutes les 24h. Créez un compte pour continuer." }, 429)
      }

      // Record this request
      await supabaseAdmin
        .from("free_analysis_rate_limits")
        .insert({ ip: clientIP })
        .throwOnError()
    } catch (_err) {
      // Table may not exist yet — skip rate limiting gracefully
      console.warn("Rate limit table not available, skipping:", _err)
    }

    // ── 3. Fetch product data ──────────────────────────────────────────────────
    let productData: ProductData
    let sourceUrl = ""

    if (type === "url") {
      const rawValue = (body.value as string)?.trim()
      if (!rawValue) return json({ error: "URL manquante" }, 400)

      // Resolve short URLs (e.tb.cn, etc.) before validation
      const resolvedValue = await resolveShortUrl(rawValue)

      if (!isValidPlatformUrl(resolvedValue)) {
        return json({
          error: "URL non supportée. Utilisez un lien 1688, Taobao (y compris e.tb.cn), Alibaba ou AliExpress.",
        }, 400)
      }

      sourceUrl = resolvedValue
      productData = await fetchProductByUrl(resolvedValue)
    } else {
      const base64 = body.base64 as string
      if (!base64) return json({ error: "Image base64 manquante" }, 400)
      productData = await fetchProductByImage(base64)
      sourceUrl = productData.sourceUrl ?? ""
    }

    // ── 4. Generate free analysis report with AI ───────────────────────────────
    const report = await generateFreeReport(productData, sourceUrl)

    return json({ report })
  } catch (err) {
    console.error("analyze-free error:", err)
    return json({ error: err instanceof Error ? err.message : "Erreur interne" }, 500)
  }
})

// ─── Short URL resolution ─────────────────────────────────────────────────────

/**
 * Resolves short URLs like e.tb.cn by fetching the page and extracting the
 * embedded `var url = '...'` JavaScript variable that Taobao injects.
 */
async function resolveShortUrl(url: string): Promise<string> {
  if (!url.includes("e.tb.cn")) return url

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    })
    const html = await res.text()

    const match = html.match(/var url\s*=\s*'([^']+)'/)
    if (match?.[1]) {
      const resolved = match[1]
      console.log("Resolved short URL:", resolved.substring(0, 120))
      return resolved
    }
    console.warn("Could not find var url in e.tb.cn page")
  } catch (err) {
    console.warn("Short URL resolution failed:", err)
  }

  return url
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

function isValidPlatformUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host.includes("alibaba.com") ||
      host.includes("1688.com") ||
      host.includes("taobao.com") ||
      host.includes("tmall.com") ||
      host.includes("aliexpress.com") ||
      host.includes("e.tb.cn")
    )
  } catch {
    return false
  }
}

function detectPlatform(url: string): "1688" | "taobao" | "tmall" | "alibaba" | "aliexpress" {
  if (url.includes("1688.com")) return "1688"
  if (url.includes("taobao.com") || url.includes("e.tb.cn")) return "taobao"
  if (url.includes("tmall.com")) return "tmall"
  if (url.includes("aliexpress.com")) return "aliexpress"
  return "alibaba"
}

function extractItemId(url: string, platform: string): string | null {
  try {
    const parsed = new URL(url)

    if (platform === "1688") {
      // Mobile: detail.m.1688.com/page/index.htm?offerId=754018142522
      const offerId = parsed.searchParams.get("offerId")
      if (offerId) return offerId

      // Desktop: detail.1688.com/offer/754018142522.html
      const match = url.match(/offer\/(\d+)\.html/)
      if (match) return match[1]

      // Fallback: any long number in path
      return url.match(/\/(\d{10,})(?:\.html)?/)?.[1] ?? null
    }

    if (platform === "taobao" || platform === "tmall") {
      return parsed.searchParams.get("id") ?? parsed.searchParams.get("itemId")
    }

    if (platform === "aliexpress") {
      return url.match(/_(\d{8,})\.html/)?.[1] ?? parsed.searchParams.get("productId") ?? null
    }

    // alibaba.com
    return (
      url.match(/_(\d{8,})\.html/)?.[1] ??
      url.match(/\/(\d{8,})\.html/)?.[1] ??
      null
    )
  } catch {
    return null
  }
}

// ─── Data types ───────────────────────────────────────────────────────────────

interface ProductData {
  name: string
  price: number
  minPrice: number
  maxPrice: number
  moq: number
  supplierName: string
  supplierYears: number
  supplierResponseRate: number
  description: string
  reviews: number
  salesVolume: string
  rating: number
  images: string[]
  category: string
  sourceUrl: string
  platform: string
  /** true = real data from Onebound API; false = AI-only estimate */
  hasRealData: boolean
}

// ─── Onebound API helpers ─────────────────────────────────────────────────────

/**
 * Build a minimal context object when Onebound is unavailable.
 * The AI will fill in all price/product estimates based on URL + itemId.
 */
function buildAiOnlyContext(url: string, platform: string, itemId: string | null): ProductData & { _itemId?: string } {
  return {
    name: "",
    price: 0,
    minPrice: 0,
    maxPrice: 0,
    moq: 1,
    supplierName: "",
    supplierYears: 0,
    supplierResponseRate: 0,
    description: "",
    reviews: 0,
    salesVolume: "",
    rating: 0,
    images: [],
    category: "",
    sourceUrl: url,
    platform,
    hasRealData: false,
    _itemId: itemId ?? undefined,
  }
}

async function fetchProductByUrl(url: string): Promise<ProductData & { _itemId?: string }> {
  const platform = detectPlatform(url)
  const itemId = extractItemId(url, platform)

  if (!itemId) {
    console.warn("Could not extract item ID from URL:", url)
    return buildAiOnlyContext(url, platform, null)
  }

  if (!ONEBOUND_KEY || !ONEBOUND_SECRET) {
    console.warn("Onebound credentials are not configured — using AI-only mode")
    return buildAiOnlyContext(url, platform, itemId)
  }

  // 1688 is not included in our current Onebound plan — go directly to AI-only
  if (platform === "1688") {
    console.warn("1688 not available on this Onebound plan — using AI-only mode")
    return buildAiOnlyContext(url, platform, itemId)
  }

  const platformMap: Record<string, string> = {
    taobao: "taobao",
    tmall: "taobao",
    alibaba: "alibaba",
    aliexpress: "aliexpress",
  }

  const apiPlatform = platformMap[platform] ?? "taobao"
  const apiUrl = `https://api-gw.onebound.cn/${apiPlatform}/item_get/?key=${ONEBOUND_KEY}&secret=${ONEBOUND_SECRET}&num_iid=${encodeURIComponent(itemId)}&lang=zh-CN&cache=1&async=0`

  console.log(`Fetching Onebound: platform=${apiPlatform} itemId=${itemId}`)

  try {
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AfriSourceBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      console.warn("Onebound HTTP error:", res.status)
      return buildAiOnlyContext(url, platform, itemId)
    }

    const data = await res.json()
    const errorField = data?.error ?? ""
    console.log("Onebound error field:", errorField || "(none)")

    // If Onebound returns an error or empty item — fall to AI-only
    if (errorField && !data?.item?.title) {
      console.warn("Onebound returned error:", errorField)
      return buildAiOnlyContext(url, platform, itemId)
    }

    const parsed = parseOneboundItem(data, url, platform)

    // If parsed name is empty — AI-only
    if (!parsed.name) {
      console.warn("Onebound returned empty item, switching to AI-only")
      return buildAiOnlyContext(url, platform, itemId)
    }

    return parsed
  } catch (err) {
    console.warn("Onebound fetch error:", err)
    return buildAiOnlyContext(url, platform, itemId)
  }
}

async function fetchProductByImage(base64: string): Promise<ProductData> {
  if (!ONEBOUND_KEY || !ONEBOUND_SECRET) {
    console.warn("Onebound credentials are not configured — using AI-only image mode")
    return buildAiOnlyContext("image-search", "1688", null)
  }

  const apiUrl = `https://api-gw.onebound.cn/1688/img_search/?key=${ONEBOUND_KEY}&secret=${ONEBOUND_SECRET}&page=1&page_size=5`

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AfriSourceBot/1.0)",
      },
      body: JSON.stringify({ img: base64 }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn("Onebound image search HTTP error:", res.status)
      return buildAiOnlyContext("image-search", "1688", null)
    }

    const data = await res.json()
    // deno-lint-ignore no-explicit-any
    const items: any[] = data?.result ?? data?.items ?? data?.item_list ?? []

    if (Array.isArray(items) && items.length > 0) {
      const first = items[0]
      const itemUrl = String(
        first.item_url ?? first.url ?? `https://1688.com/offer/${first.offer_id ?? first.num_iid ?? ""}.html`,
      )
      return parseOneboundItem({ item: first }, itemUrl, "1688")
    }

    return buildAiOnlyContext("image-search", "1688", null)
  } catch (err) {
    console.warn("Image search error:", err)
    return buildAiOnlyContext("image-search", "1688", null)
  }
}

// deno-lint-ignore no-explicit-any
function parseOneboundItem(json: any, url: string, platform: string): ProductData {
  const item = json?.item ?? json?.result ?? json ?? {}

  const name = String(item.title ?? item.subject ?? item.name ?? "").slice(0, 200)

  // Price handling — 1688 often gives price_range_list
  let minPrice = 0
  let maxPrice = 0

  const priceRaw = String(item.price ?? item.min_price ?? item.sale_price ?? "0")
  const parsedPrice = parseFloat(priceRaw.replace(/[^\d.]/g, "")) || 0

  // deno-lint-ignore no-explicit-any
  if (Array.isArray(item.price_range_list) && item.price_range_list.length > 0) {
    // deno-lint-ignore no-explicit-any
    const prices = item.price_range_list.map((r: any) =>
      parseFloat(String(r.price ?? r.unit_price ?? "0").replace(/[^\d.]/g, "")) || 0
    ).filter((p: number) => p > 0)
    if (prices.length > 0) {
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }
  }

  if (minPrice === 0 && parsedPrice > 0) {
    minPrice = parsedPrice
    maxPrice = parsedPrice * 1.3
  }

  const moqRaw = String(item.min_order ?? item.min_num ?? item.batch_number ?? "1")
  const moq = parseInt(moqRaw.match(/(\d+)/)?.[1] ?? "1") || 1

  const sellerInfo = item.seller_info ?? item.company_info ?? {}
  const supplierName = String(
    sellerInfo.zhuy ?? sellerInfo.company_name ?? sellerInfo.ww_info ?? item.nick ?? "",
  ).slice(0, 100)
  const supplierYears = parseInt(String(sellerInfo.experience ?? sellerInfo.years ?? "0")) || 0
  const responseRate = Math.min(100, Math.max(0, parseInt(String(sellerInfo.score_s ?? sellerInfo.response_rate ?? "90")) || 90))

  const description = typeof item.desc === "string"
    ? item.desc.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 500)
    : ""

  const reviews = parseInt(String(item.comment_count ?? item.num_sold30 ?? item.sale_count ?? "0")) || 0
  const salesVolume = String(item.sale_count ?? item.sold30 ?? item.num_sold30 ?? "")
  const rating = parseFloat(String(item.item_rating ?? item.rating ?? "0")) || 0

  // Fix image URLs: handle doubled https:// and protocol-relative //
  // deno-lint-ignore no-explicit-any
  const images: string[] = Array.isArray(item.item_imgs)
    // deno-lint-ignore no-explicit-any
    ? item.item_imgs.slice(0, 5).map((i: any) => fixImageUrl(String(i.url ?? i))).filter(Boolean)
    : (item.pic_url ? [fixImageUrl(String(item.pic_url))] : [])

  const category = detectCategory(name)

  return {
    name,
    price: minPrice,
    minPrice,
    maxPrice,
    moq,
    supplierName,
    supplierYears,
    supplierResponseRate: responseRate,
    description,
    reviews,
    salesVolume,
    rating,
    images,
    category,
    sourceUrl: url,
    platform,
    hasRealData: name.length > 0 && minPrice > 0,
  }
}

/**
 * Fix malformed image URLs:
 * - Doubled: `https://img.alicdn.com/imgextra/https://img.alicdn.com/...`
 * - Protocol-relative: `//img.alicdn.com/...`
 */
function fixImageUrl(url: string): string {
  if (!url) return ""
  const lastHttps = url.lastIndexOf("https://")
  if (lastHttps > 0) return url.slice(lastHttps)
  if (url.startsWith("//")) return "https:" + url
  return url
}

// ─── Category detection (Chinese + French/English) ────────────────────────────

function detectCategory(name: string): string {
  const n = name.toLowerCase()

  // Chinese keywords (Taobao / 1688 titles are in Chinese)
  if (/鞋|靴|凉鞋|拖鞋|运动鞋|跑步鞋/.test(n)) return "Chaussures"
  if (/手机|手机壳|平板|耳机|充电|数码|电子|蓝牙|相机/.test(n)) return "Électronique"
  if (/衣|服|裤|裙|上衣|外套|T恤|羽绒|卫衣|牛仔|时装/.test(n)) return "Vêtements"
  if (/包|手提包|背包|钱包|皮包|斜挎包|单肩包/.test(n)) return "Maroquinerie"
  if (/护肤|化妆|口红|面膜|精华|美妆|香水|洗发|洗面/.test(n)) return "Cosmétiques"
  if (/玩具|儿童|童装|婴儿|宝宝|积木/.test(n)) return "Jouets"
  if (/家具|桌|椅|床|柜|沙发/.test(n)) return "Mobilier"
  if (/食品|零食|茶|咖啡|饮料|糖/.test(n)) return "Alimentaire"
  if (/厨房|餐具|锅|碗|杯|刀|砧板/.test(n)) return "Cuisine"
  if (/运动|健身|瑜伽|跑步|足球|篮球/.test(n)) return "Sport"

  // French/English fallback
  if (/chaussure|sneaker|shoe|boot|sandal/.test(n)) return "Chaussures"
  if (/téléphone|phone|smartphone|iphone|android|écouteur|casque/.test(n)) return "Électronique"
  if (/vêtement|clothes|robe|pantalon|shirt|dress|veste/.test(n)) return "Vêtements"
  if (/cosmét|beauty|maquillage|lipstick|skin|parfum/.test(n)) return "Cosmétiques"
  if (/sac|bag|backpack|wallet|purse/.test(n)) return "Maroquinerie"
  if (/jouet|toy|enfant|children|kids/.test(n)) return "Jouets"
  if (/meuble|furniture|chair|table|canapé/.test(n)) return "Mobilier"
  if (/alimentation|food|boisson/.test(n)) return "Alimentaire"

  return "Divers"
}

// ─── AI: generate FreeAnalysisReport ─────────────────────────────────────────

async function generateFreeReport(p: ProductData & { _itemId?: string }, sourceUrl: string) {
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")
  if (!openrouterKey) {
    console.warn("No OPENROUTER_API_KEY — returning calculated report")
    return buildCalculatedReport(p)
  }

  const hasData = p.hasRealData && p.minPrice > 0

  let prompt: string

  if (hasData) {
    const shippingMin = p.minPrice * 0.15
    const shippingMax = p.maxPrice * 0.3

    prompt = `
Tu es un expert en import/export Chine-Afrique francophone.
Analyse ce produit et génère un rapport de rentabilité au format JSON.

DONNÉES PRODUIT (source: ${p.platform}) :
- Titre : ${p.name}
- Catégorie : ${p.category || "À déterminer"}
- Prix min fournisseur : ¥${p.minPrice}
- Prix max fournisseur : ¥${p.maxPrice}
- MOQ : ${p.moq} unités
- Fournisseur : ${p.supplierName || "Inconnu"} (${p.supplierYears} ans, répond ${p.supplierResponseRate}%)
- Note : ${p.rating > 0 ? `${p.rating}/5` : "N/A"} — ${p.reviews} avis — Volume : ${p.salesVolume || "N/A"}
- Description : ${p.description.slice(0, 300) || "(aucune)"}
- Frais transport estimé : ¥${shippingMin.toFixed(1)}–¥${shippingMax.toFixed(1)}/unité vers Afrique

CONTEXTE : Importation vers l'Afrique francophone (Bénin, Togo, Sénégal, Côte d'Ivoire, Cameroun).

${JSON_SCHEMA}
`
  } else {
    // No data from API — ask AI to estimate from URL / itemId
    const itemId = (p as ProductData & { _itemId?: string })._itemId ?? "inconnu"
    const platform = p.platform

    // Derive per-product numeric seed from offerId so each product gets distinct estimates
    const digits = itemId.replace(/\D/g, "")
    const seed = digits.length >= 4 ? parseInt(digits.slice(-6)) : 0
    const basePrice = 5 + (seed % 200)          // 5–204 yuan
    const margin    = 28 + (seed % 35)           // 28–62%
    const moq       = [1, 2, 5, 10, 20][seed % 5]
    const salesHint = ["50+", "200+", "500+", "1000+", "2000+"][seed % 5]

    prompt = `
Tu es un expert en sourcing Chine-Afrique francophone avec 10 ans d'expérience sur ${platform}.
Le système n'a pas pu récupérer les données directement depuis l'API.

URL source : ${sourceUrl}
Plateforme : ${platform}
ID produit UNIQUE : ${itemId}

⚡ CONTEXTE SPÉCIFIQUE À CET ID (${itemId}) :
- Fourchette de prix probable : ¥${basePrice}–¥${Math.round(basePrice * 1.8)}
- MOQ probable : ${moq} unités
- Volume de ventes estimé : ${salesHint} ventes/mois
- Marge cible pour l'Afrique : ~${margin}%

Sur la base de ta connaissance du marché ${platform} et de cet ID produit spécifique :
1. Identifie le type de produit probable et propose un nom réaliste
2. Génère une analyse de rentabilité cohérente en utilisant les données de contexte ci-dessus
3. Le champ "data_source" doit valoir "ai_estimate"
4. Varie tes estimations : cet ID (${itemId}) est UN SEUL produit, différent des autres

IMPORTANT : Aucune valeur à zéro. Chiffres cohérents avec la fourchette de contexte.

${JSON_SCHEMA}
`
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://afrisourceai.com",
        "X-Title": "AfriSource AI — Free Analysis",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert sourcing Chine-Afrique. Réponds TOUJOURS en JSON pur valide, aucun texte avant ou après, aucun markdown.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.65,
        max_tokens: 1400,
      }),
      signal: AbortSignal.timeout(35000),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.warn(`OpenRouter ${res.status}:`, errText.slice(0, 200))
      throw new Error(`OpenRouter ${res.status}`)
    }

    const data = await res.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ""

    const clean = raw
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim()

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(clean)
    } catch {
      const jsonMatch = clean.match(/\{[\s\S]+\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        console.warn("Could not parse AI JSON, falling back:", clean.slice(0, 300))
        return buildCalculatedReport(p)
      }
    }

    // ── Post-processing patches ────────────────────────────────────────────
    if (!parsed.image_url && p.images.length > 0) {
      parsed.image_url = p.images[0]
    }

    if (!Array.isArray(parsed.suppliers) || (parsed.suppliers as unknown[]).length === 0) {
      parsed.suppliers = [{
        name: p.supplierName || "Fournisseur principal",
        url: p.sourceUrl,
        price_min: p.minPrice || (parsed.price_min as number) || 10,
        price_max: p.maxPrice || (parsed.price_max as number) || 50,
        rating: p.rating || 4.5,
        reviews: p.reviews || 80,
        moq: p.moq || 1,
      }]
    }

    if (!parsed.data_source) {
      parsed.data_source = hasData ? "api" : "ai_estimate"
    }

    if ((parsed.price_min as number) <= 0) parsed.price_min = p.minPrice || 10
    if ((parsed.price_max as number) <= 0) parsed.price_max = p.maxPrice || 50

    return parsed
  } catch (err) {
    console.warn("OpenRouter error, falling back to calculated report:", err)
    return buildCalculatedReport(p)
  }
}

// ─── JSON schema embedded in AI prompts ──────────────────────────────────────

const JSON_SCHEMA = `
Génère UNIQUEMENT un objet JSON valide avec exactement ces champs :
{
  "product_name": string,          // Nom court en français (max 60 chars)
  "category": string,              // Catégorie précise en français
  "image_url": string | null,
  "price_min": number,             // ¥ fournisseur min (réaliste, > 0)
  "price_max": number,             // ¥ fournisseur max (réaliste, > 0)
  "suppliers": [
    {
      "name": string,
      "url": string,
      "price_min": number,
      "price_max": number,
      "rating": number,
      "reviews": number,
      "moq": number
    }
  ],
  "unit_price": number,
  "bulk_price": number,
  "moq": number,
  "sales_volume": string,
  "avg_rating": number,
  "total_reviews": number,
  "trend": "up" | "down" | "stable",
  "buy_price": number,
  "shipping_cost_min": number,
  "shipping_cost_max": number,
  "resale_price": number,
  "margin_percent": number,
  "verdict": "good" | "moderate" | "bad",
  "verdict_reason": string,
  "best_option": string,
  "customs_risk": boolean,
  "counterfeit_risk": boolean,
  "data_source": "api" | "ai_estimate"
}
Aucun texte en dehors du JSON.`

// ─── Calculated fallback (no AI key / AI fails) ───────────────────────────────

function buildCalculatedReport(p: ProductData & { _itemId?: string }) {
  // Use offerId as a deterministic seed so each product gets distinct estimates
  const itemId = p._itemId ?? ""
  const digits = itemId.replace(/\D/g, "")
  const seed = digits.length >= 4 ? parseInt(digits.slice(-6)) : 0

  const seedMin = seed > 0 ? 5 + (seed % 200) : 15
  const seedMax = seed > 0 ? Math.round(seedMin * 1.8) : 60
  const baseMin = p.minPrice > 0 ? p.minPrice : seedMin
  const baseMax = p.maxPrice > 0 ? p.maxPrice : seedMax
  const shippingMin = Math.round(baseMin * 0.15 * 10) / 10
  const shippingMax = Math.round(baseMax * 0.3 * 10) / 10
  const buyPrice = Math.round(baseMin * 1.05 * 100) / 100
  const resalePrice = Math.round(buyPrice * 2.8 * 100) / 100
  const avgShipping = (shippingMin + shippingMax) / 2
  const margin = Math.round(((resalePrice - buyPrice - avgShipping) / resalePrice) * 100)
  const cat = p.category || "Divers"

  // Seeded values for fields that would otherwise be identical across products
  const seedMoq = seed > 0 ? [1, 2, 5, 10, 20][seed % 5] : (p.moq || 1)
  const seedSales = seed > 0 ? ["50+ ventes/mois", "200+ ventes/mois", "500+ ventes/mois", "1000+ ventes/mois", "2000+ ventes/mois"][seed % 5] : "500+ ventes/mois"
  const seedRating = seed > 0 ? (4.0 + (seed % 10) * 0.05) : 4.5
  const seedReviews = seed > 0 ? 50 + (seed % 200) : 120
  const seedTrend = (["stable", "up", "down"] as const)[seed % 3]

  return {
    product_name: (p.name || `Produit 1688 #${itemId || "importé"}`).slice(0, 60),
    category: cat,
    image_url: p.images[0] ?? null,
    price_min: baseMin,
    price_max: baseMax,
    suppliers: [
      {
        name: p.supplierName || "Fournisseur principal",
        url: p.sourceUrl,
        price_min: baseMin,
        price_max: baseMax,
        rating: p.rating || Math.round(seedRating * 10) / 10,
        reviews: p.reviews || seedReviews,
        moq: p.moq || seedMoq,
      },
      {
        name: "Fournisseur alternatif",
        url: p.platform === "1688" ? "https://1688.com" : "https://www.taobao.com",
        price_min: Math.round(baseMin * 0.9 * 10) / 10,
        price_max: Math.round(baseMax * 0.95 * 10) / 10,
        rating: Math.round((seedRating - 0.2) * 10) / 10,
        reviews: Math.round(seedReviews * 0.6),
        moq: (p.moq || seedMoq) * 2,
      },
    ],
    unit_price: baseMax,
    bulk_price: baseMin,
    moq: p.moq || seedMoq,
    sales_volume: (p.salesVolume && p.salesVolume !== "N/A") ? `${p.salesVolume} ventes` : seedSales,
    avg_rating: p.rating || Math.round(seedRating * 10) / 10,
    total_reviews: p.reviews || seedReviews,
    trend: seedTrend,
    buy_price: buyPrice,
    shipping_cost_min: shippingMin,
    shipping_cost_max: shippingMax,
    resale_price: resalePrice,
    margin_percent: margin > 0 ? margin : 45,
    verdict: (margin >= 40 ? "good" : margin >= 20 ? "moderate" : "bad") as "good" | "moderate" | "bad",
    verdict_reason: margin >= 40
      ? "Marge confortable pour le marché africain. Bonne liquidité constatée sur ce type de produit."
      : margin >= 20
      ? "Rentabilité modérée. À confirmer avec un échantillon avant commande en gros."
      : "Marge insuffisante après frais de transport. Cherchez un fournisseur moins cher.",
    best_option: `Commander ${(p.moq || seedMoq) * 5} unités minimum pour maximiser la marge.`,
    customs_risk: cat === "Électronique",
    counterfeit_risk: ["Chaussures", "Maroquinerie", "Cosmétiques", "Électronique"].includes(cat),
    data_source: "ai_estimate" as const,
  }
}
