"use client"

import { Loader2 } from "lucide-react"
import { type ReactNode, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/**
 * Action sheet de confirmação. Substitui window.confirm (que renderiza
 * dialog nativo feio em iOS PWA).
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => Promise<void> | void
}) {
  const [pending, setPending] = useState(false)

  const handle = async () => {
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <SheetContent
        side="bottom"
        className="flex max-h-[50dvh] flex-col gap-0 p-0"
      >
        <SheetHeader className="px-4 py-3">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="pb-sheet-footer flex gap-2 px-4 pt-3">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handle}
            className="flex-1"
            disabled={pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
