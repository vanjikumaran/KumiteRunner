"use client"

import { useState } from "react"
import MatchSetup from "@/components/match-setup"
import KumiteTimer from "@/components/kumite-timer"

export interface MatchConfig {
  duration: number
  akaName: string
  aoName: string
  hasScoreCeiling: boolean
  scoreCeiling: number | null
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"setup" | "timer">("setup")
  const [matchConfig, setMatchConfig] = useState<MatchConfig>({
    duration: 180,
    akaName: "AKA",
    aoName: "AO",
    hasScoreCeiling: true,
    scoreCeiling: 8,
  })

  const handleStartMatch = (config: MatchConfig) => {
    setMatchConfig(config)
    setCurrentPage("timer")
  }

  const handleBackToSetup = () => {
    setCurrentPage("setup")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8">WKF Kumite Timer</h1>

      {currentPage === "setup" ? (
        <MatchSetup onStartMatch={handleStartMatch} />
      ) : (
        <KumiteTimer matchConfig={matchConfig} onBackToSetup={handleBackToSetup} />
      )}
    </main>
  )
}
