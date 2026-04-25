import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getAllPlans, createPlan, updatePlan, deletePlan } from '@/lib/db'
import type { Plan } from '@/lib/supabase'
import { toast } from 'sonner'

const EMPTY_PLAN: Omit<Plan, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  display_name: '',
  type: 'subscription',
  price_yuan: 0,
  price_usd: 0,
  basic_credits: 0,
  advanced_credits: 0,
  duration_days: 30,
  is_active: true,
  is_beta: false,
  sort_order: 0,
  metadata: null,
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Plan | null>(null)
  const [form, setForm] = useState(EMPTY_PLAN)

  useEffect(() => {
    getAllPlans().then(setPlans).catch(console.error).finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setForm(EMPTY_PLAN)
    setEditTarget(null)
    setDialog('create')
  }

  function openEdit(plan: Plan) {
    setForm({
      name: plan.name,
      display_name: plan.display_name,
      type: plan.type,
      price_yuan: plan.price_yuan,
      price_usd: plan.price_usd,
      basic_credits: plan.basic_credits,
      advanced_credits: plan.advanced_credits,
      duration_days: plan.duration_days,
      is_active: plan.is_active,
      is_beta: plan.is_beta,
      sort_order: plan.sort_order,
      metadata: plan.metadata,
    })
    setEditTarget(plan)
    setDialog('edit')
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (dialog === 'create') {
        const created = await createPlan(form)
        setPlans(p => [...p, created])
        toast.success('Formule créée')
      } else if (editTarget) {
        const updated = await updatePlan(editTarget.id, form)
        setPlans(p => p.map(x => x.id === updated.id ? updated : x))
        toast.success('Formule mise à jour')
      }
      setDialog(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette formule ? Les abonnements actifs ne seront pas affectés.')) return
    try {
      await deletePlan(id)
      setPlans(p => p.filter(x => x.id !== id))
      toast.success('Formule supprimée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Formules</h1>
          <p className="text-muted-foreground text-sm">Gérez les plans d'abonnement et packs PAYG</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle formule
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3">
          {plans.map(plan => (
            <Card key={plan.id} className="border">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{plan.display_name}</span>
                      <Badge variant="outline" className="text-xs">{plan.type === 'payg' ? 'PAYG' : 'Abonnement'}</Badge>
                      {!plan.is_active && <Badge variant="secondary" className="text-xs">Inactif</Badge>}
                      {plan.is_beta && <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Bêta</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ¥{plan.price_yuan} · {plan.basic_credits} Basic · {plan.advanced_credits} Advanced
                      {plan.duration_days && ` · ${plan.duration_days}j`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Nouvelle formule' : 'Modifier la formule'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Identifiant (name)</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="payg_starter" disabled={dialog === 'edit'} />
              </div>
              <div className="space-y-1">
                <Label>Nom affiché</Label>
                <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Starter" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prix (¥ Yuan)</Label>
                <Input type="number" value={form.price_yuan} onChange={e => setForm(f => ({ ...f, price_yuan: +e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Prix (USD)</Label>
                <Input type="number" value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: +e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Crédits Basic</Label>
                <Input type="number" value={form.basic_credits} onChange={e => setForm(f => ({ ...f, basic_credits: +e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Crédits Advanced</Label>
                <Input type="number" value={form.advanced_credits} onChange={e => setForm(f => ({ ...f, advanced_credits: +e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Durée (jours)</Label>
                <Input type="number" value={form.duration_days ?? ''} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value ? +e.target.value : null }))} placeholder="null = PAYG" />
              </div>
              <div className="space-y-1">
                <Label>Ordre</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as Plan['type'] }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="subscription">Abonnement</option>
                  <option value="payg">PAYG</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                Actif
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_beta} onChange={e => setForm(f => ({ ...f, is_beta: e.target.checked }))} />
                Bêta
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.display_name}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {dialog === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
