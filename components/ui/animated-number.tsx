"use client"

import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { useEffect } from "react"

/** Número que conta animado quando o valor muda (ex.: total de água ao somar). */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const mv = useMotionValue(value)
  const rounded = useTransform(mv, (v) => Math.round(v).toString())

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.45, ease: "easeOut" })
    return () => controls.stop()
  }, [value, mv])

  return <motion.span className={className}>{rounded}</motion.span>
}
