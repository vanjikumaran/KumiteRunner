"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Volume2, VolumeX, ArrowLeft } from "lucide-react"
import type { MatchConfig } from "@/app/page"

interface KumiteTimerProps {
  matchConfig: MatchConfig
  onBackToSetup: () => void
}

export default function KumiteTimer({ matchConfig, onBackToSetup }: KumiteTimerProps) {
  const ATOSHI_BARAKU_TIME = 15 // Last 15 seconds warning

  // State variables - now tracking milliseconds for precision
  const [timeLeftMs, setTimeLeftMs] = useState(matchConfig.duration * 1000)
  const [isRunning, setIsRunning] = useState(false)
  const [akaScore, setAkaScore] = useState(0)
  const [aoScore, setAoScore] = useState(0)
  const [akaPenalties, setAkaPenalties] = useState({ chui: 0, hansokuChui: 0, hansoku: 0 })
  const [aoPenalties, setAoPenalties] = useState({ chui: 0, hansokuChui: 0, hansoku: 0 })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [matchEnded, setMatchEnded] = useState(false)

  // Refs for audio elements
  const buzzerRef = useRef<HTMLAudioElement | null>(null)
  const atoshiBarakuRef = useRef<HTMLAudioElement | null>(null)

  // Reset timer when match config changes
  useEffect(() => {
    setTimeLeftMs(matchConfig.duration * 1000)
    setIsRunning(false)
    setAkaScore(0)
    setAoScore(0)
    setAkaPenalties({ chui: 0, hansokuChui: 0, hansoku: 0 })
    setAoPenalties({ chui: 0, hansokuChui: 0, hansoku: 0 })
    setMatchEnded(false)
  }, [matchConfig.duration])

  // Format time as MM:SS.ms
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    const ms = Math.floor((milliseconds % 1000) / 10) // Get only 2 digits of milliseconds

    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  // Handle timer logic with millisecond precision
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeftMs > 0) {
      // Update every 10ms for smoother millisecond display
      interval = setInterval(() => {
        setTimeLeftMs((prevTime) => {
          // Play atoshi baraku sound at 15 seconds
          if (
            Math.floor(prevTime / 1000) === ATOSHI_BARAKU_TIME &&
            Math.floor((prevTime - 10) / 1000) < ATOSHI_BARAKU_TIME &&
            soundEnabled
          ) {
            atoshiBarakuRef.current?.play()
          }
          return Math.max(0, prevTime - 10)
        })
      }, 10)
    } else if (timeLeftMs === 0 && isRunning) {
      setIsRunning(false)
      setMatchEnded(true)
      if (soundEnabled) {
        buzzerRef.current?.play()
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeftMs, soundEnabled, ATOSHI_BARAKU_TIME])

  // Check for score ceiling (mercy rule) - only if enabled
  useEffect(() => {
    if (matchConfig.hasScoreCeiling && matchConfig.scoreCeiling) {
      if (
        (akaScore >= aoScore + matchConfig.scoreCeiling || aoScore >= akaScore + matchConfig.scoreCeiling) &&
        isRunning
      ) {
        setIsRunning(false)
        setMatchEnded(true)
        if (soundEnabled) {
          buzzerRef.current?.play()
        }
      }
    }
  }, [akaScore, aoScore, isRunning, soundEnabled, matchConfig.hasScoreCeiling, matchConfig.scoreCeiling])

  // Start/stop timer
  const toggleTimer = () => {
    if (timeLeftMs === 0) {
      resetTimer()
    } else {
      setIsRunning(!isRunning)
    }
  }

  // Reset timer and scores
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeftMs(matchConfig.duration * 1000)
    setAkaScore(0)
    setAoScore(0)
    setAkaPenalties({ chui: 0, hansokuChui: 0, hansoku: 0 })
    setAoPenalties({ chui: 0, hansokuChui: 0, hansoku: 0 })
    setMatchEnded(false)
  }

  // Adjust timer by adding or subtracting seconds
  const adjustTime = (seconds: number) => {
    const adjustmentMs = seconds * 1000
    setTimeLeftMs((prevTime) => {
      const newTime = prevTime + adjustmentMs
      // Ensure time doesn't go below 0 or above the selected duration
      return Math.max(0, Math.min(newTime, matchConfig.duration * 1000))
    })
  }

  // Update scores
  const updateScore = (competitor: "aka" | "ao", points: number) => {
    if (isRunning) {
      if (competitor === "aka") {
        setAkaScore(Math.max(0, akaScore + points))
      } else {
        setAoScore(Math.max(0, aoScore + points))
      }
    }
  }

  // Set specific Chui level
  const setChuiLevel = (competitor: "aka" | "ao", level: number) => {
    if (competitor === "aka") {
      const newPenalties = { ...akaPenalties }

      if (level === 3) {
        // If setting Chui 3, convert to Hansoku-Chui and reset Chui to 0
        newPenalties.chui = 0
        newPenalties.hansokuChui = akaPenalties.hansokuChui + 1
        // Award point to opponent for the Hansoku-Chui
        setAoScore((prev) => prev + 1)
      } else {
        newPenalties.chui = level
      }

      setAkaPenalties(newPenalties)
    } else {
      const newPenalties = { ...aoPenalties }

      if (level === 3) {
        // If setting Chui 3, convert to Hansoku-Chui and reset Chui to 0
        newPenalties.chui = 0
        newPenalties.hansokuChui = aoPenalties.hansokuChui + 1
        // Award point to opponent for the Hansoku-Chui
        setAkaScore((prev) => prev + 1)
      } else {
        newPenalties.chui = level
      }

      setAoPenalties(newPenalties)
    }
  }

  // Update penalties
  const updatePenalty = (competitor: "aka" | "ao", penaltyType: "hansokuChui" | "hansoku", value: number) => {
    if (competitor === "aka") {
      const newPenalties = { ...akaPenalties }

      if (penaltyType === "hansokuChui") {
        newPenalties.hansokuChui = Math.max(0, akaPenalties.hansokuChui + value)
        // Remove point awarding for Hansoku-Chui
      } else if (penaltyType === "hansoku") {
        newPenalties.hansoku = Math.min(1, Math.max(0, akaPenalties.hansoku + value))
        // Hansoku = immediate disqualification
        if (newPenalties.hansoku > 0 && value > 0) {
          setIsRunning(false)
          setMatchEnded(true)
          if (soundEnabled) {
            buzzerRef.current?.play()
          }
        }
      }

      setAkaPenalties(newPenalties)
    } else {
      const newPenalties = { ...aoPenalties }

      if (penaltyType === "hansokuChui") {
        newPenalties.hansokuChui = Math.max(0, aoPenalties.hansokuChui + value)
        // Remove point awarding for Hansoku-Chui
      } else if (penaltyType === "hansoku") {
        newPenalties.hansoku = Math.min(1, Math.max(0, aoPenalties.hansoku + value))
        // Hansoku = immediate disqualification
        if (newPenalties.hansoku > 0 && value > 0) {
          setIsRunning(false)
          setMatchEnded(true)
          if (soundEnabled) {
            buzzerRef.current?.play()
          }
        }
      }

      setAoPenalties(newPenalties)
    }
  }

  // Determine winner
  const getWinner = () => {
    // Check for disqualification first
    if (akaPenalties.hansoku > 0) return `${matchConfig.aoName} (Blue) - ${matchConfig.akaName} Disqualified`
    if (aoPenalties.hansoku > 0) return `${matchConfig.akaName} (Red) - ${matchConfig.aoName} Disqualified`

    // Regular scoring
    if (akaScore > aoScore) return `${matchConfig.akaName} (Red)`
    if (aoScore > akaScore) return `${matchConfig.aoName} (Blue)`
    return "Draw"
  }

  // Get seconds for Atoshi Baraku check
  const timeLeftSeconds = Math.ceil(timeLeftMs / 1000)

  return (
    <div className="w-full max-w-3xl">
      <Card className="p-6 shadow-lg">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-6">
          <Button onClick={onBackToSetup} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Setup
          </Button>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              {matchConfig.akaName} vs {matchConfig.aoName}
            </div>
            <div className="text-xs text-gray-500">
              {matchConfig.duration / 60} minute match
              {matchConfig.hasScoreCeiling && matchConfig.scoreCeiling && (
                <span> • {matchConfig.scoreCeiling}-point ceiling</span>
              )}
              {!matchConfig.hasScoreCeiling && <span> • No score ceiling</span>}
            </div>
          </div>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>

        {/* Timer Display with milliseconds */}
        <div
          className={`text-7xl font-bold text-center mb-6 ${
            timeLeftSeconds <= ATOSHI_BARAKU_TIME ? "text-red-600" : ""
          } font-mono`}
        >
          {formatTime(timeLeftMs)}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Main Controls */}
          <div className="flex justify-center gap-4">
            <Button onClick={toggleTimer} size="lg" className="w-32" variant={isRunning ? "destructive" : "default"}>
              {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
              {isRunning ? "Stop" : "Start"}
            </Button>
            <Button onClick={resetTimer} size="lg" variant="outline" className="w-32">
              <RotateCcw className="mr-2" />
              Reset
            </Button>
            <Button onClick={() => setSoundEnabled(!soundEnabled)} size="lg" variant="outline" className="w-12">
              {soundEnabled ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>

          {/* Time Adjustment Controls */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-sm font-medium">Time Adjustments</label>
            <div className="flex gap-2">
              <Button onClick={() => adjustTime(-10)} variant="outline" size="sm" className="w-16">
                -10s
              </Button>
              <Button onClick={() => adjustTime(-5)} variant="outline" size="sm" className="w-16">
                -5s
              </Button>
              <Button onClick={() => adjustTime(-1)} variant="outline" size="sm" className="w-16">
                -1s
              </Button>
              <Button onClick={() => adjustTime(1)} variant="outline" size="sm" className="w-16">
                +1s
              </Button>
              <Button onClick={() => adjustTime(5)} variant="outline" size="sm" className="w-16">
                +5s
              </Button>
              <Button onClick={() => adjustTime(10)} variant="outline" size="sm" className="w-16">
                +10s
              </Button>
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* AKA (Red) */}
          <div className="bg-red-100 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-center mb-2 text-red-700">{matchConfig.akaName} (Red)</h2>
            <div className="text-5xl font-bold text-center mb-4">{akaScore}</div>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => updateScore("aka", 1)} variant="outline" className="bg-white">
                Yuko
              </Button>
              <Button onClick={() => updateScore("aka", 2)} variant="outline" className="bg-white">
                Waza-ari
              </Button>
              <Button onClick={() => updateScore("aka", 3)} variant="outline" className="bg-white">
                Ippon
              </Button>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Penalties</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium">Chui (Current: {akaPenalties.chui})</div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setChuiLevel("aka", 1)}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${akaPenalties.chui >= 1 ? "bg-orange-200" : "bg-white"}`}
                    >
                      Chui 1
                    </Button>
                    <Button
                      onClick={() => setChuiLevel("aka", 2)}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${akaPenalties.chui >= 2 ? "bg-orange-200" : "bg-white"}`}
                    >
                      Chui 2
                    </Button>
                   <Button
                      onClick={() => setChuiLevel("aka", 3)}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${akaPenalties.chui >= 3 ? "bg-orange-200" : "bg-white"}`}
                    >
                      Chui 3
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hansoku-Chui {akaPenalties.hansokuChui}</span>
                  <Button
                    onClick={() => updatePenalty("aka", "hansokuChui", 1)}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 bg-yellow-200 text-xs font-semibold"
                    disabled={akaPenalties.hansokuChui > 0}
                  >
                    {akaPenalties.hansokuChui > 0 ? "Awarded" : "Award"}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hansoku {akaPenalties.hansoku}</span>
                  <Button
                    onClick={() => updatePenalty("aka", "hansoku", 1)}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 bg-red-200 text-xs font-semibold"
                    disabled={akaPenalties.hansoku > 0}
                  >
                    {akaPenalties.hansoku > 0 ? "Disqualified" : "Disqualify"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* AO (Blue) */}
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-center mb-2 text-blue-700">{matchConfig.aoName} (Blue)</h2>
            <div className="text-5xl font-bold text-center mb-4">{aoScore}</div>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => updateScore("ao", 1)} variant="outline" className="bg-white">
                Yuko
              </Button>
              <Button onClick={() => updateScore("ao", 2)} variant="outline" className="bg-white">
                Waza-ari
              </Button>
              <Button onClick={() => updateScore("ao", 3)} variant="outline" className="bg-white">
                Ippon
              </Button>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Penalties</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium">Chui (Current: {aoPenalties.chui})</div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setChuiLevel("ao", 1)}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${aoPenalties.chui >= 1 ? "bg-orange-200" : "bg-white"}`}
                    >
                      Chui 1
                    </Button>
                    <Button
                      onClick={() => setChuiLevel("ao", 2)}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${aoPenalties.chui >= 2 ? "bg-orange-200" : "bg-white"}`}
                    >
                      Chui 2
                    </Button>
                   <Button
                      onClick={() => setChuiLevel("ao", 3)}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${aoPenalties.chui >= 3 ? "bg-orange-200" : "bg-white"}`}
                    >
                      Chui 3
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hansoku-Chui {aoPenalties.hansokuChui}</span>
                  <Button
                    onClick={() => updatePenalty("ao", "hansokuChui", 1)}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 bg-yellow-200 text-xs font-semibold"
                    disabled={aoPenalties.hansokuChui > 0}
                  >
                    {aoPenalties.hansokuChui > 0 ? "Awarded" : "Award"}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Hansoku {aoPenalties.hansoku}</span>
                  <Button
                    onClick={() => updatePenalty("ao", "hansoku", 1)}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 bg-red-200 text-xs font-semibold"
                    disabled={aoPenalties.hansoku > 0}
                  >
                    {aoPenalties.hansoku > 0 ? "Disqualified" : "Disqualify"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Result */}
        {matchEnded && (
          <div className="bg-yellow-100 p-4 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">Match Ended</h2>
            <p className="text-lg">
              Winner: <span className="font-bold">{getWinner()}</span>
            </p>
          </div>
        )}

        {/* Audio elements */}
        <audio ref={buzzerRef} src="/buzzer.mp3" />
        <audio ref={atoshiBarakuRef} src="/atoshi-baraku.mp3" />
      </Card>
    </div>
  )
}
