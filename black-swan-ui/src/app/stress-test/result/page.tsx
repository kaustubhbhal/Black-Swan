"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type Event = {
  name: string
  start_date: string
  description: string
  rarity: string
}

export default function StressTestResult() {
  const [event, setEvent] = useState<Event | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const eventParam = searchParams.get("event")
    if (eventParam) {
      try {
        const parsedEvent = JSON.parse(decodeURIComponent(eventParam))
        setEvent(parsedEvent)
      } catch (error) {
        console.error("Error parsing event data:", error)
      }
    }
  }, [searchParams])

  const handleBackToStressTest = () => {
    router.push("/stress-test")
  }

  if (!event) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Stress Test Modeling</CardTitle>
          <CardDescription>The following event has been theorized based on the selected historical event</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
          <p className="mb-2">
            <strong>Start Date:</strong> {event.start_date}
          </p>
          <p className="mb-2">
            <strong>Rarity:</strong> {event.rarity}
          </p>
          <p className="mb-4">
            <strong>Description:</strong> {event.description}
          </p>
          <p className="mb-4">
            The stress test for this event has been initiated. Results will post here soon.
          </p>
          <Button onClick={handleBackToStressTest}>Back to Stress Test Selection</Button>
        </CardContent>
      </Card>
    </div>
  )
}

