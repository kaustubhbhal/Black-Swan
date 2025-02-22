"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import StressTestAnalysis from "@/components/ui/StressTestAnalysis"

type Event = {
  name: string
  start_date: string
  description: string
  rarity: string
}

export default function StressTestResult() {
  const [event, setEvent] = useState<Event | null>(null)
  const [hasError, setHasError] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const eventParam = searchParams.get("event")
    const errorParam = searchParams.get("error")
    if (eventParam) {
      try {
        const parsedEvent = JSON.parse(decodeURIComponent(eventParam))
        setEvent(parsedEvent)
      } catch (error) {
        console.error("Error parsing event data:", error)
      }
    }
    setHasError(errorParam === "true")
  }, [searchParams])

  const handleBackToStressTest = () => {
    router.push("/stress-test")
  }

  if (!event) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Stress Test Result</h1>

      {hasError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error submitting the event to the server. The stress test may not have been initiated
            successfully.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>Event Details</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Start Date:</strong> {event.start_date}
          </p>
          <p>
            <strong>Rarity:</strong> {event.rarity}
          </p>
          <p>
            <strong>Description:</strong> {event.description}
          </p>
        </CardContent>
      </Card>

      <StressTestAnalysis />

      <div className="mt-6">
        <Button onClick={handleBackToStressTest}>Back to Stress Test</Button>
      </div>
    </div>
  )
}
