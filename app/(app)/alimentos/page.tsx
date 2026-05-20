"use client"

import { Apple, Plus, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { FoodFormSheet } from "@/components/foods/food-form-sheet"
import { FoodRow } from "@/components/foods/food-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCreateFood,
  useDeleteFood,
  useFoods,
} from "@/lib/queries/foods"
import { haptic } from "@/lib/haptic"
import type { Food } from "@/types/database"

export default function AlimentosPage() {
  const { data: foods, isLoading } = useFoods()
  const create = useCreateFood()
  const del = useDeleteFood()
  const [query, setQuery] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Food | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = (foods ?? []).filter((f) =>
      q ? f.name.toLowerCase().includes(q) : true,
    )
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  }, [foods, query])

  const openNew = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const openEdit = (f: Food) => {
    setEditing(f)
    setSheetOpen(true)
  }

  const duplicate = async (f: Food) => {
    haptic(8)
    await create.mutateAsync({
      name: `${f.name} (cópia)`,
      measure_type: f.measure_type,
      reference_quantity: f.reference_quantity,
      kcal: f.kcal,
      carb_g: f.carb_g,
      protein_g: f.protein_g,
      fat_g: f.fat_g,
    })
  }

  const remove = async (f: Food) => {
    if (!window.confirm(`Excluir "${f.name}"? Todas as refeições que usam serão atualizadas.`))
      return
    haptic(10)
    await del.mutateAsync(f.id)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Alimentos</h1>
        <span className="text-muted-foreground text-xs tabular-nums">
          {(foods ?? []).length} cadastrados
        </span>
      </header>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="pl-9"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFoods={(foods ?? []).length > 0} onAdd={openNew} />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((f) => (
            <li key={f.id}>
              <FoodRow
                food={f}
                onEdit={() => openEdit(f)}
                onDuplicate={() => duplicate(f)}
                onDelete={() => remove(f)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      <Button
        size="icon-lg"
        onClick={openNew}
        className="bottom-fab fixed right-4 z-30 size-14 rounded-full shadow-lg"
        aria-label="Novo alimento"
      >
        <Plus />
      </Button>

      <FoodFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initial={editing}
      />
    </main>
  )
}

function EmptyState({ hasFoods, onAdd }: { hasFoods: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="bg-card flex h-14 w-14 items-center justify-center rounded-full border border-border">
        <Apple className="text-muted-foreground size-6" />
      </div>
      <p className="text-muted-foreground text-sm">
        {hasFoods ? "Nada encontrado." : "Banco vazio. Cadastra os primeiros alimentos."}
      </p>
      {!hasFoods && (
        <Button onClick={onAdd}>
          <Plus />
          Novo alimento
        </Button>
      )}
    </div>
  )
}
