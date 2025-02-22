"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { EventCard } from "@/components/ui/EventCard"

type Portfolio = {
  _id: string
  name: string
}

type Event = {
  name: string
  start_date: string
  description: string
  rarity: string
}

const FLASK_API_URL = "http://127.0.0.1:5000"

export default function StressTestPage() {
  const [starredPortfolio, setStarredPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTestingLoading, setIsTestingLoading] = useState(false)
  const [isFetchingEvents, setIsFetchingEvents] = useState(false)
  const [currentTestPortfolio, setCurrentTestPortfolio] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchStarredPortfolio()
      getCurrentTestPortfolio()
    }
  }, [status, router])

  const fetchStarredPortfolio = async () => {
    try {
      const response = await fetch("/api/portfolios/starred")
      if (!response.ok) {
        throw new Error("Failed to fetch starred portfolio")
      }
      const data = await response.json()
      setStarredPortfolio(data)
    } catch (error) {
      console.error("Error fetching starred portfolio:", error)
      toast({
        title: "Error",
        description: "Failed to fetch starred portfolio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentTestPortfolio = async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/get_portfolio`)
      if (response.ok) {
        const data = await response.json()
        setCurrentTestPortfolio(data.portfolio_id)
      } else if (response.status !== 404) {
        throw new Error("Failed to get current test portfolio")
      }
    } catch (error) {
      console.error("Error getting current test portfolio:", error)
      toast({
        title: "Error",
        description: "Failed to get current test portfolio. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStressTest = async () => {
    if (!starredPortfolio) return

    setIsTestingLoading(true)
    setIsFetchingEvents(true)
    try {
      // First, add the portfolio
      const addResponse = await fetch(`${FLASK_API_URL}/add_portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: starredPortfolio._id }),
      })

      if (!addResponse.ok) {
        throw new Error("Failed to add portfolio for stress test")
      }

      const addResult = await addResponse.json()
      setCurrentTestPortfolio(addResult.id)

      // Then, fetch the swan events using GET method
      const swansResponse = await fetch(`${FLASK_API_URL}/post_swans`, {
        method: "GET",
      })

      if (!swansResponse.ok) {
        throw new Error("Failed to fetch swan events")
      }

      const swansResult = await swansResponse.json()

      if (!swansResult || !swansResult.events) {
        throw new Error("Invalid response format from server")
      }

      const parsedEvents: Event[] = swansResult.events

      setEvents(parsedEvents)

      if (parsedEvents.length === 0) {
        toast({
          title: "Warning",
          description: "No events were found in the response.",
          variant: "warning",
        })
      } else {
        toast({
          title: "Stress Test Initiated",
          description: `${parsedEvents.length} historical events loaded for stress testing.`,
        })
      }
    } catch (error) {
      console.error("Error initiating stress test:", error)
      toast({
        title: "Error",
        description: `Failed to initiate stress test: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsTestingLoading(false)
      setIsFetchingEvents(false)
    }
  }

  const handleClearTest = async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/clear_portfolio`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to clear stress test")
      }

      setCurrentTestPortfolio(null)
      setEvents([])
      toast({
        title: "Test Cleared",
        description: "The stress test has been cleared successfully.",
      })
    } catch (error) {
      console.error("Error clearing stress test:", error)
      toast({
        title: "Error",
        description: "Failed to clear stress test. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Portfolio Stress Test</CardTitle>
          <CardDescription>Test your starred portfolio against various market scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          {starredPortfolio ? (
            <>
              <p className="mb-4">Your starred portfolio: {starredPortfolio.name}</p>
              {currentTestPortfolio ? (
                <>
                  <p className="mb-4">Current test portfolio ID: {currentTestPortfolio}</p>
                  <Button onClick={handleClearTest} variant="destructive" className="mr-4">
                    Clear Test
                  </Button>
                </>
              ) : (
                <Button onClick={handleStressTest} disabled={isTestingLoading}>
                  {isTestingLoading ? "Initiating Stress Test..." : `Stress Test "${starredPortfolio.name}"`}
                </Button>
              )}
            </>
          ) : (
            <p>No starred portfolio found. Please star a portfolio to run a stress test.</p>
          )}
        </CardContent>
      </Card>

      {currentTestPortfolio && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Events for Stress Test</CardTitle>
            <CardDescription>These events will be used to stress test your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingEvents ? (
              <p>Fetching historical events...</p>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <EventCard key={index} event={event} />
                ))}
              </div>
            ) : (
              <p>No events fetched. Please try initiating the stress test again.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

