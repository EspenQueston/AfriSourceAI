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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { analysisIds } = await req.json()

    if (!analysisIds || analysisIds.length < 2) {
      return new Response(
        JSON.stringify({ error: "Minimum 2 analyses requises pour une comparaison" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // Fetch analyses
    const { data: analyses, error: fetchError } = await supabaseAdmin
      .from("analyses")
      .select("*")
      .in("id", analysisIds)
      .eq("user_id", user.id)

    if (fetchError || !analyses || analyses.length < 2) {
      return new Response(
        JSON.stringify({ error: "Analyses introuvables" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // AI comparison
    let recommendation: string
    try {
      recommendation = await compareWithAI(analyses)
    } catch (err) {
      console.error("AI comparison failed:", err)
      recommendation = buildMockRecommendation(analyses)
    }

    // Find best (highest confidence score)
    const winner = analyses.reduce((best: typeof analyses[0], curr: typeof analyses[0]) =>
      (curr.confidence_score ?? 0) > (best.confidence_score ?? 0) ? curr : best
    )

    // Save comparison
    const { data: comparison, error: saveError } = await supabaseAdmin
      .from("comparisons")
      .insert({
        user_id: user.id,
        analysis_ids: analysisIds,
        winner_analysis_id: winner.id,
        ai_recommendation: recommendation,
      })
      .select()
      .single()

    if (saveError) {
      console.error("DB save error:", saveError)
      throw saveError
    }

    return new Response(
      JSON.stringify({
        success: true,
        comparison: {
          ...comparison,
          analyses,
          winner,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("Compare error:", err)
    const errMsg = err instanceof Error ? err.message : "Erreur interne du serveur"
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

async function compareWithAI(analyses: Array<Record<string, unknown>>) {
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")

  const summaries = analyses.map((a, i) => {
    return `Produit ${i + 1}: ${a.product_name || "N/A"} — Prix: $${a.price ?? "?"} — Score confiance: ${a.confidence_score ?? "?"}% — MOQ: ${a.moq ?? "?"} — Fournisseur: ${a.supplier_name || "N/A"}`
  }).join("\n")

  if (!openrouterKey) {
    return buildMockRecommendation(analyses)
  }

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
          content: "Tu es un expert en import/export Chine-Afrique. Sois détaillé et structuré dans ta réponse. Réponds en texte structuré (pas de JSON).",
        },
        {
          role: "user",
          content: `Compare ces produits et recommande le meilleur pour un importateur africain :\n${summaries}\n\nFais une analyse comparative détaillée avec :\n1. Un résumé des avantages/inconvénients de chaque produit\n2. Une recommandation claire avec justification\n3. Les points de vigilance spécifiques`,
        },
      ],
      temperature: 0.5,
    }),
  })

  if (!response.ok) {
    console.error("OpenRouter error:", response.status)
    return buildMockRecommendation(analyses)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? buildMockRecommendation(analyses)
}

function buildMockRecommendation(analyses: Array<Record<string, unknown>>) {
  const sorted = [...analyses].sort((a, b) => ((b.confidence_score as number) ?? 0) - ((a.confidence_score as number) ?? 0))
  const best = sorted[0]
  const others = sorted.slice(1)

  let rec = `## Recommandation\n\n`
  rec += `**${best.product_name || "Produit recommandé"}** (Score: ${best.confidence_score ?? 0}/100) offre le meilleur rapport qualité/prix.\n\n`
  rec += `### Avantages du produit recommandé\n`
  rec += `- Score de confiance le plus élevé (${best.confidence_score ?? 0}/100)\n`
  rec += `- Prix compétitif : $${best.price ?? "?"}/unité\n`
  rec += `- MOQ accessible : ${best.moq ?? "?"} unités\n\n`

  if (others.length > 0) {
    rec += `### Alternatives\n`
    others.forEach((a, i) => {
      rec += `- **${a.product_name || `Produit ${i + 2}`}** : Score ${a.confidence_score ?? 0}/100, $${a.price ?? "?"}/unité\n`
    })
  }

  rec += `\n### Points de vigilance\n`
  rec += `- Vérifiez les certifications avant toute commande\n`
  rec += `- Demandez des échantillons aux deux fournisseurs\n`
  rec += `- Comparez les délais de livraison et conditions de paiement\n`

  return rec
}
