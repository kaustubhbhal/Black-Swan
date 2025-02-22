"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type StockData = {
  beta: number
  lambda_jump: number
  sig_etf: number
  sig_idio: number
  sig_s: number
}

type PortfolioStats = {
  es_95: number
  kurtosis: number
  max_drawdown: number
  mean: number
  prob_loss: number
  skewness: number
  std_dev: number
  var_95: number
}

type StressTestData = {
  [key: string]: StockData | PortfolioStats
}

export default function StressTestAnalysis() {
  const [data, setData] = useState<StressTestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_jack")
        if (!response.ok) {
          throw new Error("Failed to fetch stress test data")
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError("Failed to load stress test data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading stress test analysis...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No stress test data available</div>

  const stockData = Object.entries(data).filter(
    ([key, value]) => key !== "portfolio_stats" && typeof value === "object",
  ) as [string, StockData][]
  const portfolioStats = data.portfolio_stats as PortfolioStats

  const formatLargeNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 2,
    }).format(num)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Statistics</CardTitle>
          <CardDescription>Key metrics for your portfolio under stress test</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Expected Shortfall (95%)</span>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.es_95)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Value at Risk (95%)</span>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.var_95)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Max Drawdown</span>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.max_drawdown)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Probability of Loss</span>
            <span className="text-2xl font-bold">{(portfolioStats.prob_loss * 100).toFixed(2)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Mean Return</span>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.mean)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Standard Deviation</span>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.std_dev)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Skewness</span>
            <span className="text-2xl font-bold">{portfolioStats.skewness.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Kurtosis</span>
            <span className="text-2xl font-bold">{portfolioStats.kurtosis.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Beta Comparison</CardTitle>
          <CardDescription>Beta values for each stock in your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData.map(([ticker, data]) => ({ ticker, beta: data.beta }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticker" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="beta" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stockData.map(([ticker, data]) => (
          <Card key={ticker}>
            <CardHeader>
              <CardTitle>{ticker}</CardTitle>
              <CardDescription>Stock-specific metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Beta</span>
                  <span className="font-bold">{data.beta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Lambda Jump</span>
                  <span className="font-bold">{data.lambda_jump.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sig ETF</span>
                  <span className="font-bold">{data.sig_etf.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sig Idio</span>
                  <span className="font-bold">{data.sig_idio.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sig S</span>
                  <span className="font-bold">{data.sig_s.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

