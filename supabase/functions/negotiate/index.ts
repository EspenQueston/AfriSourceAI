import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { analysisId, targetPrice } = await req.json()

    if (!analysisId || !targetPrice) {
      return new Response(
        JSON.stringify({ error: "analysisId et targetPrice sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Fetch analysis
    const { data: analysis, error: fetchError } = await supabaseAdmin
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !analysis) {
      return new Response(
        JSON.stringify({ error: "Analyse introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Generate negotiation strategy
    let negotiation_strategy
    try {
      negotiation_strategy = await generateStrategy(analysis, targetPrice)
    } catch (genErr) {
      console.error("AI generation failed, using mock:", genErr)
      negotiation_strategy = buildMockStrategy(analysis, targetPrice)
    }

    // Save negotiation to DB
    const { data: savedNeg, error: saveError } = await supabaseAdmin
      .from("negotiations")
      .insert({
        user_id: user.id,
        analysis_id: analysisId,
        target_price: targetPrice,
        strategy: negotiation_strategy,
        messages: { phases: negotiation_strategy.phases?.length ?? 0 },
      })
      .select()
      .single()

    if (saveError) {
      console.error("DB save error:", saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        negotiation: {
          id: savedNeg?.id ?? crypto.randomUUID(),
          negotiation_strategy,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("Negotiate error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

async function generateStrategy(
  analysis: Record<string, unknown>,
  targetPrice: number,
) {
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")
  const currentPrice = analysis.price as number ?? 0
  const productName = analysis.product_name as string ?? "produit"
  const supplierName = analysis.supplier_name as string ?? "fournisseur"
  const moq = analysis.moq as number ?? 100

  if (!openrouterKey) {
    return buildMockStrategy(analysis, targetPrice)
  }

  const prompt = `
Tu es un expert en négociation commerciale Chine-Afrique. Génère une stratégie de négociation en 4 phases.

PRODUIT : ${productName}
FOURNISSEUR : ${supplierName}
PRIX ACTUEL : $${currentPrice}/unité
PRIX CIBLE : $${targetPrice}/unité
MOQ : ${moq} unités
RÉDUCTION : ${currentPrice > 0 ? (((currentPrice - targetPrice) / currentPrice) * 100).toFixed(1) : 0}%

Génère en JSON valide UNIQUEMENT (sans markdown, sans backticks) ce format exact :
{
  "phases": [
    {
      "number": 1,
      "title": "Premier contact",
      "objective": "Établir la relation et montrer l'intérêt",
      "message": "Message en chinois mandarin pour le premier contact",
      "tip": "Conseil pratique pour cette phase"
    },
    {
      "number": 2,
      "title": "Demande de prix",
      "objective": "Obtenir le meilleur prix initial",
      "message": "Message en chinois pour demander un prix spécial",
      "tip": "Conseil pratique"
    },
    {
      "number": 3,
      "title": "Contre-offre",
      "objective": "Négocier le prix final",
      "message": "Message en chinois pour la contre-offre",
      "tip": "Conseil pratique",
      "arguments": ["argument1", "argument2", "argument3"],
      "prices": {
        "current": ${currentPrice},
        "openingOffer": number (prix d'ouverture bas),
        "targetMin": number (prix cible minimum),
        "targetMax": number (prix cible maximum)
      }
    },
    {
      "number": 4,
      "title": "Finalisation",
      "objective": "Confirmer la commande",
      "message": "Message en chinois pour finaliser",
      "tip": "Conseil pratique",
      "paymentTerms": "Conditions de paiement recommandées",
      "qualityInspection": "Recommandation d'inspection qualité"
    }
  ],
  "prediction": {
    "probability": number (0-100, chance de succès),
    "targetRange": "$X.XX – $Y.YY",
    "estimatedSavings": "$XXX sur 1000 unités",
    "negotiationTime": "X-Y jours"
  }
}
`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openrouterKey}`,
      "HTTP-Referer": "https://afrisourceai.com",
      "X-Title": "AfriSource AI",
    },
    body: JSON.stringify({
      model: "google/gemma-3-27b-it:free",
      messages: [
        {
          role: "system",
          content: "Expert en négociation commerciale internationale Chine-Afrique. Réponds en JSON valide uniquement, sans markdown, sans backticks.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    console.error("OpenRouter error:", response.status)
    return buildMockStrategy(analysis, targetPrice)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ""
  const clean = content.replace(/```json?\n?/gi, "").replace(/```/g, "").trim()

  try {
    const parsed = JSON.parse(clean)
    // Validate structure
    if (!parsed.phases || !Array.isArray(parsed.phases)) {
      return buildMockStrategy(analysis, targetPrice)
    }
    return parsed
  } catch {
    console.error("JSON parse failed for negotiate response")
    return buildMockStrategy(analysis, targetPrice)
  }
}

function buildMockStrategy(analysis: Record<string, unknown>, targetPrice: number) {
  const currentPrice = analysis.price as number ?? 0
  const productName = analysis.product_name as string ?? "produit"
  const supplierName = analysis.supplier_name as string ?? "fournisseur"
  const openingOffer = parseFloat((targetPrice * 0.88).toFixed(2))
  const targetMin = parseFloat((targetPrice * 0.95).toFixed(2))
  const targetMax = parseFloat((targetPrice * 1.05).toFixed(2))
  const reduction = currentPrice > 0 ? ((currentPrice - targetPrice) / currentPrice * 100).toFixed(1) : "15"
  const savings = currentPrice > 0 ? Math.round((currentPrice - targetPrice) * 1000) : 0

  return {
    phases: [
      {
        number: 1,
        title: "Premier contact",
        objective: "Établir une relation professionnelle et exprimer un intérêt sérieux pour une collaboration long terme",
        message: `您好 ${supplierName}，\n\n我是非洲的进口商，专门经营${productName}。我对您的产品非常感兴趣，我们在非洲法语区8个国家有广泛的分销网络。\n\n希望建立长期合作关系。请问您最低起订量是多少？大量订购有什么优惠？\n\n期待您的回复！`,
        tip: "Envoyez ce message via Alibaba Trade Manager ou WeChat pendant les heures ouvrables chinoises (9h-17h UTC+8). Montrez que vous êtes un acheteur sérieux.",
      },
      {
        number: 2,
        title: "Demande de devis",
        objective: "Obtenir un devis détaillé et identifier la marge de négociation du fournisseur",
        message: `感谢您的回复。我们计划每月订购500-1000件${productName}。\n\n请提供以下信息：\n1. 500件的单价\n2. 1000件的单价\n3. 交货时间\n4. 付款方式\n\n我们是认真的买家，希望找到可靠的长期合作伙伴。`,
        tip: "Demandez toujours les prix pour différentes quantités. Cela révèle la structure de prix du fournisseur et sa flexibilité.",
      },
      {
        number: 3,
        title: "Négociation du prix",
        objective: `Obtenir le prix de $${targetPrice}/unité (réduction de ${reduction}% par rapport au prix actuel de $${currentPrice})`,
        message: `感谢您的报价。我们已经比较了几个供应商的价格。\n\n说实话，我们的目标价格是每件$${targetPrice}。我们在非洲市场需要保持竞争力。\n\n如果您能给我们这个价格，我们可以：\n1. 立即下第一批1000件订单\n2. 每月固定下单\n3. T/T 30%定金 + 70%出货前付清\n\n这将是长期合作的开始。`,
        tip: "Si le fournisseur refuse, proposez d'augmenter la quantité minimale ou d'accepter un délai de livraison plus long.",
        arguments: [
          `Volume récurrent : 500-1000 unités/mois = stabilité pour le fournisseur`,
          `Réseau de distribution dans 8 pays africains = potentiel de croissance`,
          `Paiement T/T rapide = sécurité financière pour le fournisseur`,
          `Concurrent offre $${openingOffer}/unité = pression concurrentielle`,
          `Commandes diversifiées possibles = revenus additionnels`,
        ],
        prices: {
          current: currentPrice,
          openingOffer,
          targetMin,
          targetMax,
        },
      },
      {
        number: 4,
        title: "Finalisation",
        objective: "Confirmer les termes de la commande et sécuriser le prix négocié",
        message: `太好了！我们达成了初步协议。请确认以下订单条款：\n\n• 产品: ${productName}\n• 数量: 1000件\n• 单价: $${targetPrice}\n• 付款: T/T 30/70\n• 交货: FOB\n\n请发送正式的形式发票 (PI)。我们收到后会在3个工作日内安排定金。\n\n期待长期合作！`,
        tip: "Demandez toujours une facture proforma (PI) avant tout paiement. Utilisez Alibaba Trade Assurance si possible pour sécuriser la transaction.",
        paymentTerms: "T/T 30% à la commande + 70% avant expédition (standard pour les nouvelles relations)",
        qualityInspection: "Inspection SGS/Bureau Veritas recommandée avant expédition pour les commandes > $5,000",
      },
    ],
    prediction: {
      probability: currentPrice > 0 && (currentPrice - targetPrice) / currentPrice < 0.25 ? 75 : 55,
      targetRange: `$${targetMin} – $${targetMax}`,
      estimatedSavings: `$${savings} sur 1000 unités`,
      negotiationTime: "3-7 jours",
    },
  }
}
