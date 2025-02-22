"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Star, Pencil, Trash } from "lucide-react"

type Portfolio = {
  _id: string
  name: string
  isStarred: boolean
  lastUpdated: string
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [newPortfolioName, setNewPortfolioName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      fetchPortfolios()
    }
  }, [status, router])

  const fetchPortfolios = async () => {
    try {
      const response = await fetch("/api/portfolios")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch portfolios")
      }
      const data = await response.json()
      setPortfolios(data)
    } catch (error) {
      console.error("Error fetching portfolios:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch portfolios. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPortfolioName,
          holdings: [], // Initialize with empty holdings
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create portfolio")
      }
      setNewPortfolioName("")
      fetchPortfolios()
      toast({
        title: "Success",
        description: "New portfolio created successfully.",
      })
    } catch (error) {
      console.error("Error creating portfolio:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create portfolio. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleStar = async (portfolioId: string) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/star`, {
        method: "PUT",
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to star portfolio")
      }
      fetchPortfolios()
      toast({
        title: "Success",
        description: "Portfolio starred successfully.",
      })
    } catch (error) {
      console.error("Error starring portfolio:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to star portfolio. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deletePortfolio = async (portfolioId: string) => {
    if (confirm("Are you sure you want to delete this portfolio?")) {
      try {
        const response = await fetch(`/api/portfolios/${portfolioId}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to delete portfolio")
        }
        fetchPortfolios()
        toast({
          title: "Success",
          description: "Portfolio deleted successfully.",
        })
      } catch (error) {
        console.error("Error deleting portfolio:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete portfolio. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Portfolios</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createPortfolio} className="flex space-x-2">
            <Input
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              placeholder="Enter portfolio name"
              className="flex-grow"
            />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => (
          <Card key={portfolio._id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {portfolio.name}
                <Button variant="ghost" size="icon" onClick={() => toggleStar(portfolio._id)}>
                  <Star className={portfolio.isStarred ? "fill-yellow-400" : ""} />
                </Button>
              </CardTitle>
              <CardDescription>Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <Button onClick={() => router.push(`/onboarding?portfolioId=${portfolio._id}`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => deletePortfolio(portfolio._id)}>
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

