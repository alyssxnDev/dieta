import { cn } from "@/lib/utils"

// Shimmer animado (gradiente deslizando) em vez do pulse estático.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted relative overflow-hidden rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent",
        "before:animate-shimmer",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
