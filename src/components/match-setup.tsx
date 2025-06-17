"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Play } from "lucide-react"
import type { MatchConfig } from "@/app/page"

interface MatchSetupProps {
  onStartMatch: (config: MatchConfig) => void
}

export default function MatchSetup({ onStartMatch }: MatchSetupProps) {
  const timerOptions = [30, 60, 90, 120, 180, 240]
  const [duration, setDuration] = useState(180)
  const [akaName, setAkaName] = useState("AKA")
  const [aoName, setAoName] = useState("AO")
  const [hasScoreCeiling, setHasScoreCeiling] = useState(true)
  const [scoreCeiling, setScoreCeiling] = useState(8)

  const handleStartMatch = () => {
    onStartMatch({
      duration,
      akaName: akaName.trim() || "AKA",
      aoName: aoName.trim() || "AO",
      hasScoreCeiling,
      scoreCeiling: hasScoreCeiling ? scoreCeiling : null,
    })
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 60) return "1 minute"
    if (seconds < 60) return `${seconds} seconds`
    return `${seconds / 60} minutes`
  }

  return (
    <div className="w-full max-w-2xl">
      <Card className="p-8 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Match Setup</h2>
          <p className="text-gray-600">Configure your kumite match settings</p>
        </div>

        <div className="space-y-6">
          {/* Match Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-lg font-semibold">
              Match Duration
            </Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number.parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {timerOptions.map((seconds) => (
                  <SelectItem key={seconds} value={seconds.toString()}>
                    {formatDuration(seconds)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Standard WKF kumite duration is 3 minutes for seniors</p>
          </div>

          {/* Score Ceiling Settings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Score Ceiling (Mercy Rule)</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-ceiling"
                checked={hasScoreCeiling}
                onCheckedChange={(checked) => setHasScoreCeiling(checked as boolean)}
              />
              <Label htmlFor="has-ceiling" className="text-sm font-medium">
                Enable score ceiling limit
              </Label>
            </div>

            {hasScoreCeiling && (
              <div className="space-y-2">
                <Label htmlFor="score-ceiling" className="text-sm font-medium">
                  Point difference to end match
                </Label>
                <Input
                  id="score-ceiling"
                  type="number"
                  min="1"
                  max="20"
                  value={scoreCeiling}
                  onChange={(e) => setScoreCeiling(Number.parseInt(e.target.value) || 8)}
                  className="w-24"
                />
                <p className="text-xs text-gray-500">
                  Match ends when one competitor leads by this many points (WKF standard: 8 points)
                </p>
              </div>
            )}

            {!hasScoreCeiling && (
              <p className="text-sm text-gray-500">Match will only end when time expires or by disqualification</p>
            )}
          </div>

          {/* Competitor Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aka-name" className="text-lg font-semibold text-red-700">
                AKA (Red) Competitor
              </Label>
              <Input
                id="aka-name"
                type="text"
                placeholder="Enter AKA name"
                value={akaName}
                onChange={(e) => setAkaName(e.target.value)}
                className="border-red-200 focus:border-red-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ao-name" className="text-lg font-semibold text-blue-700">
                AO (Blue) Competitor
              </Label>
              <Input
                id="ao-name"
                type="text"
                placeholder="Enter AO name"
                value={aoName}
                onChange={(e) => setAoName(e.target.value)}
                className="border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Match Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Match Preview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Duration:</span> {formatDuration(duration)}
              </div>
              <div>
                <span className="font-medium">Format:</span> WKF Kumite
              </div>
              <div>
                <span className="font-medium">Score Ceiling:</span>{" "}
                {hasScoreCeiling ? `${scoreCeiling} point difference` : "No limit"}
              </div>
              <div>
                <span className="font-medium">Match End:</span>{" "}
                {hasScoreCeiling ? "Time or point difference" : "Time or disqualification only"}
              </div>
              <div className="text-red-700">
                <span className="font-medium">AKA:</span> {akaName || "AKA"}
              </div>
              <div className="text-blue-700">
                <span className="font-medium">AO:</span> {aoName || "AO"}
              </div>
            </div>
          </div>

          {/* Start Match Button */}
          <Button onClick={handleStartMatch} size="lg" className="w-full text-lg py-6">
            <Play className="mr-2" />
            Start Match
          </Button>
        </div>
      </Card>

      {/* Rules Reference */}
      <Card className="p-4 mt-6 text-sm">
        <h3 className="font-bold mb-2">WKF Kumite Rules Reference:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Scoring: Yuko (1 point), Waza-ari (2 points), Ippon (3 points)</li>
          <li>
            Match ends when time expires{hasScoreCeiling ? ` or ${scoreCeiling}-point difference is reached` : ""}
          </li>
          <li>Three penalties result in a point for the opponent</li>
          <li>Atoshi Baraku warning at 15 seconds remaining</li>
          <li>Winner determined by highest score{hasScoreCeiling ? ` or first to ${scoreCeiling}-point lead` : ""}</li>
        </ul>
      </Card>
    </div>
  )
}
