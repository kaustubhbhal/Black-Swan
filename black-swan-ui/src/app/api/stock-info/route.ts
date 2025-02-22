import { NextResponse } from "next/server"
import NodeCache from "node-cache"
import yahooFinance from "yahoo-finance2"

const cache = new NodeCache({ stdTTL: 300 }) // Cache for 5 minutes

async function fetchStockInfo(ticker: string) {
  try {
    const [quoteResult, quoteSummaryResult] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, { modules: ["summaryProfile"] }),
    ])

    if (!quoteResult || !quoteSummaryResult) {
      throw new Error(`No data returned for ticker: ${ticker}`)
    }

    return {
      ticker: ticker,
      currentPrice: quoteResult.regularMarketPrice || 0,
      change: quoteResult.regularMarketChange || 0,
      changePercent: quoteResult.regularMarketChangePercent || 0,
      industry: quoteSummaryResult.summaryProfile?.industry || "N/A",
      companyName: quoteResult.longName || quoteResult.shortName || ticker,
    }
  } catch (error) {
    console.error(`Error fetching stock info for ${ticker}:`, error)
    throw new Error(`Invalid ticker: ${ticker}`)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
  }

  try {
    // Check cache first
    const cachedData = cache.get(ticker)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // If not in cache, fetch from API
    const stockInfo = await fetchStockInfo(ticker)

    // Store in cache
    cache.set(ticker, stockInfo)

    return NextResponse.json(stockInfo)
  } catch (error) {
    console.error("Error in stock-info API route:", error)
    if (error instanceof Error && error.message.startsWith("Invalid ticker:")) {
      return NextResponse.json({ error: (error as Error).message }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to fetch stock info", details: (error as Error).message }, { status: 500 })
  }
}

