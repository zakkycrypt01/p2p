"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-white text-center">SuiXchange Bridge</h1>

        <Card className="bg-gray-800 border-gray-700 shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              There was an error loading the bridge interface. This could be due to network issues or the bridge service
              being temporarily unavailable.
            </p>
            <div className="space-y-4">
              <Button onClick={reset} className="w-full bg-[#78c4b6] hover:bg-[#5ba99b] text-white">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Return to home
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>If this issue persists, please contact support</p>
        </div>
      </div>
    </div>
  )
}
