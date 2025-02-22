"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import StressTestAnalysis from "@/components/ui/StressTestAnalysis"
import { ChevronDown, ChevronUp } from "lucide-react"
import PdfExportButton from "@/components/ui/PdfExportButton"

type FakeEvent = {
  fake_event: string
}

type Event = {
  name: string
  start_date: string
  description: string
  rarity: string
}

export default function StressTestResult() {
  const [event, setEvent] = useState<Event | null>(null)
  const [fakeEvent, setFakeEvent] = useState<FakeEvent | null>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showHistorical, setShowHistorical] = useState(true)
  const [isContentReady, setIsContentReady] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const eventParam = searchParams.get("event")
        const errorParam = searchParams.get("error")
        if (eventParam) {
          const parsedEvent = JSON.parse(decodeURIComponent(eventParam))
          setEvent(parsedEvent)
        }
        setHasError(errorParam === "true")

        // Fetch fake event data
        const fakeEventResponse = await fetch("http://127.0.0.1:5000/get_fake_event")
        if (!fakeEventResponse.ok) {
          throw new Error("Failed to fetch fake event data")
        }
        const fakeEventData = await fakeEventResponse.json()
        setFakeEvent(fakeEventData)

        // Hide historical event when fake event data is loaded
        setShowHistorical(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setHasError(true)
      } finally {
        setIsLoading(false)
        setIsContentReady(true)
      }
    }

    fetchData()
  }, [searchParams])

  const handleBackToStressTest = () => {
    router.push("/stress-test")
  }

  const toggleHistorical = () => {
    setShowHistorical(!showHistorical)
  }

  if (isLoading) {
    return <div>Loading stress test results...</div>
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error processing the stress test. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBackToStressTest} className="mt-4">
          Back to Stress Test
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Stress Test Result</h1>
        {isContentReady && (
          <PdfExportButton targetRef={contentRef} filename={`stress-test-${event?.name || "results"}.pdf`} />
        )}
      </div>
      <div ref={contentRef}>
        {event && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Historical Event: {event.name}</CardTitle>
                <CardDescription>Click to {showHistorical ? "hide" : "show"} details</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleHistorical}>
                {showHistorical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            {showHistorical && (
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Start Date:</span> {event.start_date}
                  </p>
                  <p>
                    <span className="font-semibold">Rarity:</span> {event.rarity}
                  </p>
                  <p>
                    <span className="font-semibold">Description:</span> {event.description}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {fakeEvent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Simulated Black Swan Event</CardTitle>
              <CardDescription>Hypothetical future scenario used for stress testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                {fakeEvent.fake_event.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph.startsWith("**") ? <strong>{paragraph.replace(/\*\*/g, "")}</strong> : paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <StressTestAnalysis />
      </div>

      <div className="mt-6 flex justify-between items-center">
        <Button onClick={handleBackToStressTest}>Back to Stress Test</Button>
      </div>
    </div>
  )
}

