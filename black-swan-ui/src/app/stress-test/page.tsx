"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

type Portfolio = {
  _id: string
  name: string
}

export default function StressTestPage() {
  const [starredPortfolio, setStarredPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTestingLoading, setIsTestingLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchStarredPortfolio()
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

  const handleStressTest = async () => {
    if (!starredPortfolio) return

    setIsTestingLoading(true)
    try {
      const response = await fetch("http://your-flask-api-url/stress-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ portfolioId: starredPortfolio._id }),
      })

      if (!response.ok) {
        throw new Error("Failed to initiate stress test")
      }

      const result = await response.json()
      toast({
        title: "Stress Test Initiated",
        description: "The stress test has been started successfully.",
      })
      // You can handle the result here, e.g., redirect to a results page
      console.log(result)
    } catch (error) {
      console.error("Error initiating stress test:", error)
      toast({
        title: "Error",
        description: "Failed to initiate stress test. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTestingLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Stress Test</CardTitle>
          <CardDescription>Test your starred portfolio against various market scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          {starredPortfolio ? (
            <>
              <p className="mb-4">Your starred portfolio: {starredPortfolio.name}</p>
              <Button onClick={handleStressTest} disabled={isTestingLoading}>
                {isTestingLoading ? "Initiating Stress Test..." : `Stress Test "${starredPortfolio.name}"`}
              </Button>
            </>
          ) : (
            <p>No starred portfolio found. Please star a portfolio to run a stress test.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

