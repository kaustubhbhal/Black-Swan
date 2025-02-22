"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import ErrorBoundary from "@/components/ui/ErrorBoundary"

type PortfolioItem = {
  ticker: string
  shares: number
  currentPrice: number
  change: number
  changePercent: number
  value: number
  percentOfPortfolio: number
  industry: string
  companyName: string
}

type Portfolio = {
  _id: string
  name: string
  holdings: PortfolioItem[]
  lastUpdated: string
}

export default function DashboardContent() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }

    if (status === "authenticated") {
      fetchStarredPortfolio()
    }
  }, [status, router])

  const fetchStarredPortfolio = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/portfolios")
      if (!response.ok) {
        throw new Error("Failed to fetch portfolios list")
      }
      const portfolios = await response.json()
      const starredPortfolio = portfolios.find((p: any) => p.isStarred)
      if (starredPortfolio) {
        const detailResponse = await fetch(`/api/portfolios/${starredPortfolio._id}`)
        if (!detailResponse.ok) {
          throw new Error(`Failed to fetch portfolio details: ${detailResponse.statusText}`)
        }
        const portfolioData = await detailResponse.json()

        // Calculate stock details
        const updatedHoldings = await Promise.all(
          portfolioData.holdings.map(async (holding: PortfolioItem) => {
            const stockInfo = await fetchStockInfo(holding.ticker)
            return {
              ...holding,
              ...stockInfo,
              value: stockInfo.currentPrice * holding.shares,
            }
          }),
        )

        const totalValue = updatedHoldings.reduce((sum, item) => sum + item.value, 0)
        const holdingsWithPercentage = updatedHoldings.map((item) => ({
          ...item,
          percentOfPortfolio: (item.value / totalValue) * 100,
        }))

        setPortfolio({
          ...portfolioData,
          holdings: holdingsWithPercentage,
        })
      } else {
        setPortfolio(null)
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
      toast({
        title: "Error",
        description: "Failed to fetch portfolio. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStockInfo = async (ticker: string) => {
    const response = await fetch(`/api/stock-info?ticker=${ticker}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch stock info for ${ticker}`)
    }
    return response.json()
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated. Redirecting...</div>
  }

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
        <Button onClick={fetchStarredPortfolio}>Retry</Button>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No active portfolio found.</h1>
        <p className="mb-4">Please star a portfolio to view on the dashboard.</p>
        <Link href="/portfolios">
          <Button>Manage Portfolios</Button>
        </Link>
      </div>
    )
  }

  const totalValue = portfolio.holdings.reduce((sum, item) => sum + item.value, 0)

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Portfolio Dashboard</h1>
          <div>
            <span className="mr-4">Welcome, {session?.user?.name}</span>
            <Button onClick={handleLogout}>Log Out</Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{portfolio.name}</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Company</th>
                    <th className="text-left p-2">Ticker</th>
                    <th className="text-left p-2">Industry</th>
                    <th className="text-right p-2">Shares</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Change</th>
                    <th className="text-right p-2">Value</th>
                    <th className="text-right p-2">% of Portfolio</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((item) => (
                    <tr key={item.ticker} className="border-b">
                      <td className="p-2">{item.companyName}</td>
                      <td className="p-2">{item.ticker}</td>
                      <td className="p-2">{item.industry}</td>
                      <td className="text-right p-2">{item.shares}</td>
                      <td className="text-right p-2">${item.currentPrice.toFixed(2)}</td>
                      <td className={`text-right p-2 ${item.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                      </td>
                      <td className="text-right p-2">${item.value.toFixed(2)}</td>
                      <td className="text-right p-2">{item.percentOfPortfolio.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold text-lg">Total Portfolio Value</h3>
              <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}

