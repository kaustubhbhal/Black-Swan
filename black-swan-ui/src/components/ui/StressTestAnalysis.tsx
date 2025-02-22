"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

type ImageData = {
  data: {
    image: string
  }
  name: string
}

export default function StressTestAnalysis() {
  const [data, setData] = useState<StressTestData | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analysisResponse, imagesResponse] = await Promise.all([
          fetch("http://127.0.0.1:5000/get_jack"),
          fetch("http://127.0.0.1:5000/get_jack_images"),
        ])

        if (!analysisResponse.ok || !imagesResponse.ok) {
          throw new Error("Failed to fetch stress test data")
        }

        const analysisResult = await analysisResponse.json()
        const imagesResult = await imagesResponse.json()

        setData(analysisResult)
        setImages(imagesResult.images)
      } catch (err) {
        setError("Failed to load stress test data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const DefinitionTooltip = ({
    term,
    definition,
    children,
  }: { term: string; definition: string; children: React.ReactNode }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-dotted border-b border-gray-400">{children}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <strong>{term}:</strong> {definition}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

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

  const base64ToDataUrl = (base64: string) => {
    return `data:image/png;base64,${base64}`
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Statistics</CardTitle>
          <CardDescription>Key metrics for your portfolio under stress test</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Expected Shortfall (ES)"
              definition="The average loss in the worst x% of cases. ES at 95% is the average loss in the worst 5% of scenarios."
            >
              <span className="text-sm font-medium text-muted-foreground">Expected Shortfall (95%)</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.es_95)}</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Value at Risk (VaR)"
              definition="The maximum loss expected at a given confidence level. VaR at 95% is the loss that won't be exceeded in 95% of scenarios."
            >
              <span className="text-sm font-medium text-muted-foreground">Value at Risk (95%)</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.var_95)}</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Max Drawdown"
              definition="The largest peak-to-trough decline in the value of a portfolio."
            >
              <span className="text-sm font-medium text-muted-foreground">Max Drawdown</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.max_drawdown)}</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Probability of Loss"
              definition="The likelihood that the portfolio will experience a negative return."
            >
              <span className="text-sm font-medium text-muted-foreground">Probability of Loss</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">{(portfolioStats.prob_loss * 100).toFixed(2)}%</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Mean Return"
              definition="The average return of the portfolio across all simulated scenarios."
            >
              <span className="text-sm font-medium text-muted-foreground">Avg Final Value</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.mean)}</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Standard Deviation"
              definition="A measure of the amount of variation or dispersion of a set of returns."
            >
              <span className="text-sm font-medium text-muted-foreground">Standard Deviation</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">${formatLargeNumber(portfolioStats.std_dev)}</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Skewness"
              definition="A measure of the asymmetry of the probability distribution of returns. Negative skew indicates a higher risk of extreme negative returns."
            >
              <span className="text-sm font-medium text-muted-foreground">Skewness</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">{portfolioStats.skewness.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Kurtosis"
              definition="A measure of the 'tailedness' of the probability distribution of returns. Higher kurtosis indicates more extreme outliers."
            >
              <span className="text-sm font-medium text-muted-foreground">Kurtosis</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">{portfolioStats.kurtosis.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Beta Comparison</CardTitle>
          <CardDescription>
            <DefinitionTooltip
              term="Beta"
              definition="A measure of a stock's volatility in relation to the overall market. A beta greater than 1 indicates higher volatility than the market."
            >
              Beta values for each stock in your portfolio
            </DefinitionTooltip>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockData.map(([ticker, data]) => ({ ticker, beta: data.beta }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticker" />
                <YAxis />
                <RechartsTooltip />
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
                    <span className="text-sm font-medium text-muted-foreground">β</span>
                  <span className="font-bold">{data.beta.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">λ<sub>jump</sub></span>
                  <span className="font-bold">{data.lambda_jump.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">σ<sub>ETF</sub></span>
                  <span className="font-bold">{data.sig_etf.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">σ<sub>idiosyncratic</sub></span>
                  <span className="font-bold">{data.sig_idio.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">σ<sub>s</sub></span>
                  <span className="font-bold">{data.sig_s.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stress Test Visualizations</CardTitle>
          <CardDescription>Generated images from the stress test analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-12">
          {images.map((image, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-xl font-semibold text-center">
                {index === 0 ? "Monte Carlo Simulation of Portfolio Value" : "Distribution of Annualized Returns"}
              </h3>
              <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto">
                <Image
                  src={base64ToDataUrl(image.data.image) || "/placeholder.svg"}
                  alt={index === 0 ? "Monte Carlo Simulation of Portfolio Value" : "Distribution of Annualized Returns"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  style={{ objectFit: "contain" }}
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

