"use client"

import { Loader2, Settings2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { computeReminderTimes } from "@/lib/calculations/reminders"
import { useUpdateProfile } from "@/lib/queries/profiles"
import type { Profile } from "@/types/database"

const PRESET_COLORS = [
  "#a78bfa", // violet (você)
  "#f472b6", // pink (ela)
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fb923c", // orange
  "#facc15", // yellow
]

// Usa key={profile.id} na chamada pra resetar o form ao trocar de perfil
// (em vez de useEffect setting state em mudança de prop).
export function ProfileSettingsCard({ profile }: { profile: Profile }) {
  const update = useUpdateProfile()
  const [form, setForm] = useState<Profile>(profile)

  const dirty = JSON.stringify(form) !== JSON.stringify(profile)

  const onSave = async () => {
    const { id, created_at: _ca, ...patch } = form
    void _ca
    await update.mutateAsync({ id, patch })
  }

  const onReset = () => setForm(profile)

  const reminders = form.water_reminder_enabled
    ? computeReminderTimes(
        form.water_reminder_start_time,
        form.water_reminder_end_time,
        form.water_reminder_count,
      )
    : []

  return (
    <section
      aria-label="Configurações do perfil"
      className="bg-card flex flex-col gap-4 rounded-2xl border border-zinc-800 p-4"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="text-muted-foreground size-4" />
          <h3 className="text-sm font-semibold">Configurações de {profile.name}</h3>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-2">
          <Label htmlFor="ps-name">Nome</Label>
          <Input
            id="ps-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="col-span-2 flex flex-col gap-2">
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className="size-8 rounded-full ring-offset-2 ring-offset-card transition-all"
                style={{
                  backgroundColor: c,
                  boxShadow: form.color === c ? `0 0 0 2px ${c}` : undefined,
                }}
                aria-label={`Cor ${c}`}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="size-8 cursor-pointer rounded-full border-0 bg-transparent"
              aria-label="Cor custom"
            />
          </div>
        </div>

        <NumField
          label="Kcal/dia"
          value={form.daily_kcal_goal}
          onChange={(v) => setForm({ ...form, daily_kcal_goal: v })}
        />
        <NumField
          label="Água (ml)"
          value={form.daily_water_ml_goal}
          onChange={(v) => setForm({ ...form, daily_water_ml_goal: v })}
        />
        <NumField
          label="Carb (g)"
          value={form.daily_carb_g_goal}
          onChange={(v) => setForm({ ...form, daily_carb_g_goal: v })}
        />
        <NumField
          label="Prot (g)"
          value={form.daily_protein_g_goal}
          onChange={(v) => setForm({ ...form, daily_protein_g_goal: v })}
        />
        <NumField
          label="Gord (g)"
          value={form.daily_fat_g_goal}
          onChange={(v) => setForm({ ...form, daily_fat_g_goal: v })}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Lembretes de água</p>
            <p className="text-muted-foreground text-xs">
              Notificação real é v2. Os horários já aparecem na aba Hoje.
            </p>
          </div>
          <Switch
            checked={form.water_reminder_enabled}
            onCheckedChange={(v) => setForm({ ...form, water_reminder_enabled: v })}
          />
        </div>
        {form.water_reminder_enabled && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <NumField
                label="Qtd"
                value={form.water_reminder_count}
                onChange={(v) => setForm({ ...form, water_reminder_count: v })}
              />
              <TimeField
                label="Início"
                value={form.water_reminder_start_time.slice(0, 5)}
                onChange={(v) =>
                  setForm({ ...form, water_reminder_start_time: `${v}:00` })
                }
              />
              <TimeField
                label="Fim"
                value={form.water_reminder_end_time.slice(0, 5)}
                onChange={(v) =>
                  setForm({ ...form, water_reminder_end_time: `${v}:00` })
                }
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reminders.map((t) => (
                <span
                  key={t}
                  className="bg-muted text-muted-foreground tabular-nums rounded-full px-2 py-0.5 text-[10px]"
                >
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {dirty && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReset} className="flex-1">
            Reverter
          </Button>
          <Button onClick={onSave} disabled={update.isPending} className="flex-1">
            {update.isPending && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </div>
      )}
    </section>
  )
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n) && n >= 0) onChange(n)
        }}
        className="text-sm tabular-nums"
      />
    </div>
  )
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm tabular-nums"
      />
    </div>
  )
}
