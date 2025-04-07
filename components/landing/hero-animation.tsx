"use client"

import { useEffect, useRef } from "react"

export function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create floating coins animation
    const createCoin = () => {
      const coin = document.createElement("div")
      coin.className = "absolute rounded-full shadow-lg transition-all duration-1000 animate-float"

      // Randomly select coin type
      const coinTypes = ["suis", "usdcs", "usdts", "btcs"]
      const randomCoin = coinTypes[Math.floor(Math.random() * coinTypes.length)]

      // Create image element
      const img = document.createElement("img")
      img.src = `/tokens/${randomCoin}.png`
      img.alt = randomCoin
      img.className = "w-full h-full object-cover"

      // Random size between 30px and 60px
      const size = Math.floor(Math.random() * 30) + 30
      coin.style.width = `${size}px`
      coin.style.height = `${size}px`

      // Random position
      const maxX = container.offsetWidth - size
      const maxY = container.offsetHeight - size
      coin.style.left = `${Math.floor(Math.random() * maxX)}px`
      coin.style.top = `${Math.floor(Math.random() * maxY)}px`

      // Random animation duration between 15s and 25s
      const duration = Math.floor(Math.random() * 10) + 15
      coin.style.animationDuration = `${duration}s`

      // Random delay
      const delay = Math.floor(Math.random() * 5)
      coin.style.animationDelay = `${delay}s`

      // Add image to coin
      coin.appendChild(img)

      // Add coin to container
      container.appendChild(coin)

      // Remove coin after animation completes
      setTimeout(
        () => {
          coin.remove()
        },
        (duration + delay) * 1000,
      )
    }

    // Create initial coins
    for (let i = 0; i < 10; i++) {
      createCoin()
    }

    // Create new coins periodically
    const interval = setInterval(() => {
      if (container.childElementCount < 15) {
        createCoin()
      }
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border border-blue-100 dark:border-blue-900/50 shadow-xl"
    >
      {/* Central platform illustration */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-60 md:h-60 bg-primary/10 rounded-full flex items-center justify-center">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-primary/20 rounded-full flex items-center justify-center">
          <div className="w-24 h-24 md:w-36 md:h-36 bg-primary/30 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-primary rounded-full flex items-center justify-center text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 md:h-12 md:w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.6)" />
          </linearGradient>
        </defs>

        <path d="M50,50 L150,150" stroke="url(#lineGradient)" strokeWidth="1" />
        <path d="M50,150 L150,50" stroke="url(#lineGradient)" strokeWidth="1" />
        <path d="M100,25 L100,175" stroke="url(#lineGradient)" strokeWidth="1" />
        <path d="M25,100 L175,100" stroke="url(#lineGradient)" strokeWidth="1" />
      </svg>
    </div>
  )
}

