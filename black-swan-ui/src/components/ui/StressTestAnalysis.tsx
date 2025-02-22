"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// Remove the import for StressTestRecommendations
// import { StressTestRecommendations } from "./StressTestRecommendations"
import { Button } from "@/components/ui/button"
// Add these imports
import { AlertTriangle, Loader2, AlertCircle, TrendingDown, BarChart2, RefreshCcw } from "lucide-react"

type StockData = {
  beta: number | null
  lambda_jump: number | null
  sig_etf: number | null
  sig_idio: number | null
  sig_s: number | null
}

type PortfolioStats = {
  es_95: number | null
  kurtosis: number | null
  max_drawdown: number | null
  mean: number | null
  prob_loss: number | null
  skewness: number | null
  std_dev: number | null
  var_95: number | null
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

// Add new types for recommendations
type Recommendation = {
  actions: string[]
  summary: string
}

export default function StressTestAnalysis() {
  const [data, setData] = useState<StressTestData | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  // Update the component state
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)

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

        const analysisText = await analysisResponse.text()
        const analysisResult = JSON.parse(analysisText.replace(/NaN/g, "null"))
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

  // Replace the fetchRecommendations function
  const fetchRecommendations = async () => {
    setLoadingRecommendations(true)
    setRecommendationError(null)
    try {
      const response = await fetch("http://127.0.0.1:5000/get_actions")
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations")
      }
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setRecommendationError("Failed to load recommendations. Please try again.")
    } finally {
      setLoadingRecommendations(false)
    }
  }

  if (loading) return <div>Loading stress test analysis...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No stress test data available</div>

  const stockData = Object.entries(data).filter(
    ([key, value]) => key !== "portfolio_stats" && typeof value === "object",
  ) as [string, StockData][]
  const portfolioStats = data.portfolio_stats as PortfolioStats

  const formatLargeNumber = (num: number | null) => {
    if (num === null || isNaN(num)) return "N/A"
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
            <span className="text-2xl font-bold">
              {portfolioStats.es_95 !== null ? `$${formatLargeNumber(portfolioStats.es_95)}` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Value at Risk (VaR)"
              definition="The maximum loss expected at a given confidence level. VaR at 95% is the loss that won't be exceeded in 95% of scenarios."
            >
              <span className="text-sm font-medium text-muted-foreground">Value at Risk (95%)</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.var_95 !== null ? `$${formatLargeNumber(portfolioStats.var_95)}` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Max Drawdown"
              definition="The largest peak-to-trough decline in the value of a portfolio."
            >
              <span className="text-sm font-medium text-muted-foreground">Max Drawdown</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.max_drawdown !== null ? `$${formatLargeNumber(portfolioStats.max_drawdown)}` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Probability of Loss"
              definition="The likelihood that the portfolio will experience a negative return."
            >
              <span className="text-sm font-medium text-muted-foreground">Probability of Loss</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.prob_loss !== null ? `${(portfolioStats.prob_loss * 100).toFixed(2)}%` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Mean Return"
              definition="The average return of the portfolio across all simulated scenarios."
            >
              <span className="text-sm font-medium text-muted-foreground">Avg Final Portfolio Value</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.mean !== null ? `$${formatLargeNumber(portfolioStats.mean)}` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Standard Deviation"
              definition="A measure of the amount of variation or dispersion of a set of returns."
            >
              <span className="text-sm font-medium text-muted-foreground">Standard Deviation</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.std_dev !== null ? `$${formatLargeNumber(portfolioStats.std_dev)}` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Skewness"
              definition="A measure of the asymmetry of the probability distribution of returns. Negative skew indicates a higher risk of extreme negative returns."
            >
              <span className="text-sm font-medium text-muted-foreground">Skewness</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.skewness !== null ? portfolioStats.skewness.toFixed(2) : "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <DefinitionTooltip
              term="Kurtosis"
              definition="A measure of the 'tailedness' of the probability distribution of returns. Higher kurtosis indicates more extreme outliers."
            >
              <span className="text-sm font-medium text-muted-foreground">Kurtosis</span>
            </DefinitionTooltip>
            <span className="text-2xl font-bold">
              {portfolioStats.kurtosis !== null ? portfolioStats.kurtosis.toFixed(2) : "N/A"}
            </span>
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
                  <DefinitionTooltip
                    term="Beta"
                    definition="A measure of a stock's volatility in relation to the overall market."
                  >
                    <span className="text-sm font-medium text-muted-foreground">Beta</span>
                  </DefinitionTooltip>
                  <span className="font-bold">{data.beta !== null ? data.beta.toFixed(2) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <DefinitionTooltip
                    term="Lambda Jump"
                    definition="The frequency of jumps in the stock price, modeling sudden, significant price changes."
                  >
                    <span className="text-sm font-medium text-muted-foreground">Lambda Jump</span>
                  </DefinitionTooltip>
                  <span className="font-bold">{data.lambda_jump !== null ? data.lambda_jump.toFixed(2) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <DefinitionTooltip
                    term="Sig ETF"
                    definition="The volatility of the stock's returns attributable to ETF-specific factors."
                  >
                    <span className="text-sm font-medium text-muted-foreground">Sig ETF</span>
                  </DefinitionTooltip>
                  <span className="font-bold">{data.sig_etf !== null ? data.sig_etf.toFixed(4) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <DefinitionTooltip
                    term="Sig Idio"
                    definition="The idiosyncratic volatility of the stock, representing company-specific risk."
                  >
                    <span className="text-sm font-medium text-muted-foreground">Sig Idio</span>
                  </DefinitionTooltip>
                  <span className="font-bold">{data.sig_idio !== null ? data.sig_idio.toFixed(4) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <DefinitionTooltip
                    term="Sig S"
                    definition="The overall volatility of the stock, combining systematic and idiosyncratic risks."
                  >
                    <span className="text-sm font-medium text-muted-foreground">Sig S</span>
                  </DefinitionTooltip>
                  <span className="font-bold">{data.sig_s !== null ? data.sig_s.toFixed(4) : "N/A"}</span>
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
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Monte Carlo Simulation of Portfolio Value</h3>
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={base64ToDataUrl(images[0].data.image) || "/placeholder.svg"}
                  alt="Monte Carlo Simulation of Portfolio Value"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 35vw"
                  style={{ objectFit: "contain" }}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <p className="text-center text-sm text-gray-500">
                This graph shows multiple simulated paths of your portfolio value over time.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Portfolio Value Without Jump Risk</h3>
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={base64ToDataUrl(images[2].data.image) || "/placeholder.svg"}
                  alt="Portfolio Value Without Jump Risk"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 35vw"
                  style={{ objectFit: "contain" }}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <p className="text-center text-sm text-gray-500">
                This graph illustrates your portfolio value evolution without considering extreme market events.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Distribution of Annualized Returns</h3>
            <div className="relative w-full aspect-[16/9] max-w-4xl mx-auto">
              <Image
                src={base64ToDataUrl(images[1].data.image) || "/placeholder.svg"}
                alt="Distribution of Annualized Returns"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                style={{ objectFit: "contain" }}
                className="rounded-lg shadow-lg"
              />
            </div>
            <p className="text-center text-sm text-gray-500">
              This histogram displays the distribution of possible annual returns for your portfolio.
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Remove the StressTestRecommendations component */}
      {/* <StressTestRecommendations /> */}
      {/* Replace the recommendations section at the bottom of the component */}
      <div className="mt-8">
        <Button
          onClick={() => {
            if (!showRecommendations && !recommendations) {
              fetchRecommendations()
            }
            setShowRecommendations(!showRecommendations)
          }}
        >
          {showRecommendations ? "Hide" : "Show"} Dynamic Recommendations
        </Button>

        {showRecommendations && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Dynamic Recommendations</CardTitle>
              <CardDescription>Based on your stress test results and current market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecommendations ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : recommendationError ? (
                <div className="flex items-center text-red-500">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <p>{recommendationError}</p>
                </div>
              ) : recommendations ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <p>{recommendations.summary}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recommended Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.actions.map((action, index) => {
                        const [actionText, reasonText] = action.split(": Reason: ")
                        const actionType = actionText.split(": ")[1]

                        let Icon
                        switch (true) {
                          case actionType.toLowerCase().includes("reduce"):
                            Icon = TrendingDown
                            break
                          case actionType.toLowerCase().includes("increase"):
                            Icon = BarChart2
                            break
                          case actionType.toLowerCase().includes("rebalance"):
                            Icon = RefreshCcw
                            break
                          default:
                            Icon = AlertCircle
                        }

                        return (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <Icon className="h-5 w-5 mr-2" />
                                {actionType}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{reasonText}</p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p>No dynamic recommendations available at this time.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

