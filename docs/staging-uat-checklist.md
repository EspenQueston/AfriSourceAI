# Staging & UAT Checklist (Niveau 2)

## 1) Environnement staging réaliste

## Objectif
Avoir un environnement proche de la production pour valider sécurité, crédits, IA et paiements avant go-live.

## Prérequis
- Projet Supabase **staging** dédié
- Variables frontend staging:
  - `VITE_SUPABASE_URL` (staging)
  - `VITE_SUPABASE_ANON_KEY` (staging)
  - `VITE_PAYMENT_PROVIDER` (sandbox provider actif)
- Secrets Edge Functions staging:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`
  - `ONEBOUND_KEY`
  - `ONEBOUND_SECRET`
  - `CINETPAY_*`, `FEDAPAY_API_KEY`, `STRIPE_SECRET_KEY` (sandbox uniquement)

## Déploiement staging
1. Appliquer migrations:
   - `supabase db push`
2. Déployer fonctions:
   - `supabase functions deploy analyze`
   - `supabase functions deploy analyze-free`
   - `supabase functions deploy compare`
   - `supabase functions deploy negotiate`
   - `supabase functions deploy payment`
3. Vérifier tables et colonnes récentes:
   - `system_events`
   - `analyses.data_source/ai_source/quality_tier/fallback_reason`
   - `profiles.credit_model_version/legacy_credits_deprecated_at`

## Données de test minimales
- 1 compte admin
- 1 compte user standard
- 1 compte free avec crédits très bas
- Plans actifs et méthodes paiement sandbox compatibles

---

## 2) UAT Scenarios (avant prod)

## A. Crédits & RPC
- [ ] Exécuter `npm run test:credits` sur user de test
- [ ] Vérifier cohérence `get_credit_balance` avant/après consommation
- [ ] Vérifier qu’aucune logique critique ne dépend de `credits_remaining` comme SoT

## B. Paiements
- [ ] Initiation sandbox réussie (pending)
- [ ] Transition vers `success` via polling
- [ ] Cas `failed` remonté proprement (message UI + statut DB)
- [ ] Timeout polling (3 min) géré avec retour utilisateur clair

## C. IA & qualité
- [ ] Analyse standard (Onebound + OpenRouter) marquée quality `high`/`medium`
- [ ] Cas fallback Onebound ou OpenRouter détecté et tagué
- [ ] Vérifier remontée des cas fallback dans `/erp-panel/ai-quality`

## D. Observabilité
- [ ] `system_events` contient événements `analyze_*` et `payment_*`
- [ ] Dashboard admin affiche fallback rate, payment failure rate, avg latency
- [ ] Alertes visuelles apparaissent au-delà des seuils définis

## E. Sécurité/RLS
- [ ] Non-admin ne peut pas accéder aux vues/admin data
- [ ] Admin peut lire métriques et événements
- [ ] Policies RLS validées sur tables ERP et system_events

---

## 3) Critères de sortie staging

Release candidate validée seulement si:
- [ ] 100% des scénarios critiques ci-dessus passent
- [ ] Aucun secret exposé côté client/repo
- [ ] Taux erreurs serveur et paiement en seuil acceptable
- [ ] Incident runbook prêt (paiement indisponible, fallback IA massif)
