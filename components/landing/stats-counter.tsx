"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface StatsCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function StatsCounter({ value, duration = 2, prefix = "", suffix = "", className }: StatsCounterProps) {
  const [count, setCount] = useState(0)
  const countRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const progress = (timestamp - startTimeRef.current) / (duration * 1000)

      if (progress < 1) {
        const currentCount = Math.floor(value * progress)
        setCount(currentCount)
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [value, duration])

  return (
    <span ref={countRef} className={cn(className)}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

