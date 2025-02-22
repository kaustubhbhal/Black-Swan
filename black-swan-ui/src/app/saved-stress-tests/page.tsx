"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

type SavedStressTest = {
  _id: string
  eventName: string
  eventDate: string
  eventRarity: string
  createdAt: string
}

export default function SavedStressTests() {
  const [stressTests, setStressTests] = useState<SavedStressTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchSavedStressTests()
    }
  }, [status, router])

  const fetchSavedStressTests = async () => {
    try {
      const response = await fetch("/api/stress-tests")
      if (!response.ok) {
        throw new Error("Failed to fetch saved stress tests")
      }
      const data = await response.json()
      setStressTests(data)
    } catch (error) {
      console.error("Error fetching saved stress tests:", error)
      toast({
        title: "Error",
        description: "Failed to fetch saved stress tests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Saved Stress Tests</h1>

      {stressTests.length === 0 ? (
        <p>No saved stress tests found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stressTests.map((test) => (
            <Card key={test._id}>
              <CardHeader>
                <CardTitle>{test.eventName}</CardTitle>
                <CardDescription>Event Date: {new Date(test.eventDate).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Rarity:</strong> {test.eventRarity}
                </p>
                <p>
                  <strong>Saved on:</strong> {new Date(test.createdAt).toLocaleString()}
                </p>
                <Button className="mt-4" onClick={() => router.push(`/saved-stress-tests/${test._id}`)}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

