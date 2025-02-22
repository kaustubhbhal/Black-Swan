"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type StockEntry = {
  ticker: string
  shares: string
}

export default function OnboardingForm() {
  const [portfolioName, setPortfolioName] = useState("")
  const [stocks, setStocks] = useState<StockEntry[]>([{ ticker: "", shares: "" }])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const router = useRouter()
  const { data: session, status } = useSession() as { data: { user: { id: string } } | null, status: string }
  const searchParams = useSearchParams()
  const portfolioId = searchParams.get("portfolioId")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated") {
      if (portfolioId) {
        fetchExistingPortfolio(portfolioId)
      } else {
        setIsFetching(false)
      }
    }
  }, [status, router, portfolioId])

  const fetchExistingPortfolio = async (id: string) => {
    try {
      const response = await fetch(`/api/portfolios/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPortfolioName(data.name)
        if (data.holdings && data.holdings.length > 0) {
          setStocks(
            data.holdings.map((item: any) => ({
              ticker: item.ticker,
              shares: item.shares,
            })),
          )
        }
      } else {
        throw new Error("Failed to fetch portfolio")
      }
    } catch (error) {
      console.error("Error fetching existing portfolio:", error)
      toast({
        title: "Error",
        description: "Failed to fetch portfolio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  const addStock = () => {
    setStocks([...stocks, { ticker: "", shares: "" }])
  }

  const removeStock = (index: number) => {
    const newStocks = stocks.filter((_, i) => i !== index)
    setStocks(newStocks.length ? newStocks : [{ ticker: "", shares: "" }])
  }

  const updateStock = (index: number, field: keyof StockEntry, value: string) => {
    const newStocks = [...stocks]
    newStocks[index] = {
      ...newStocks[index],
      [field]: field === "ticker" ? value.toUpperCase() : value,
    }
    setStocks(newStocks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (!session?.user?.id) {
        throw new Error("User not authenticated. Please log in and try again.")
      }
      const validStocks = stocks.filter((stock) => stock.ticker.trim() !== "" && stock.shares !== "")
      const portfolioData = {
        name: portfolioName,
        holdings: validStocks.map((stock) => ({
          ...stock,
          shares: Number.parseInt(stock.shares, 10),
        })),
      }
      const url = portfolioId ? `/api/portfolios/${portfolioId}` : "/api/portfolios"
      const method = portfolioId ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(portfolioData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Failed to save portfolio. Server responded with status ${response.status}`)
      }

      const result = await response.json()

      toast({
        title: "Portfolio saved",
        description: "Your portfolio has been successfully saved.",
      })
      router.push("/portfolios")
    } catch (error) {
      console.error("Error saving portfolio:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save portfolio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isFetching) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{portfolioId ? "Edit" : "Create"} Portfolio</CardTitle>
          <CardDescription>Enter your portfolio name and stock holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="portfolio-name">Portfolio Name</Label>
              <Input
                id="portfolio-name"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder="Enter portfolio name"
                required
              />
            </div>
            {stocks.map((stock, index) => (
              <div key={index} className="flex items-end space-x-2">
                <div className="flex-grow">
                  <Label htmlFor={`ticker-${index}`}>Ticker Symbol</Label>
                  <Input
                    id={`ticker-${index}`}
                    value={stock.ticker}
                    onChange={(e) => updateStock(index, "ticker", e.target.value)}
                    placeholder="e.g., AAPL"
                  />
                </div>
                <div className="flex-grow">
                  <Label htmlFor={`shares-${index}`}>Number of Shares</Label>
                  <Input
                    id={`shares-${index}`}
                    type="number"
                    value={stock.shares}
                    onChange={(e) => updateStock(index, "shares", e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
                <Button type="button" variant="destructive" onClick={() => removeStock(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addStock} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Another Stock
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Portfolio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

