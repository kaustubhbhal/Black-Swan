import { NextResponse } from "next/server"
import NodeCache from "node-cache"

const cache = new NodeCache({ stdTTL: 86400 }) // Cache for 24 hours

async function fetchStockInfo(ticker: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
  const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`

  const [quoteResponse, overviewResponse] = await Promise.all([fetch(quoteUrl), fetch(overviewUrl)])

  const [quoteData, overviewData] = await Promise.all([quoteResponse.json(), overviewResponse.json()])

  if (quoteData["Error Message"] || overviewData["Error Message"]) {
    throw new Error(`Failed to fetch data for ${ticker}`)
  }

  const quote = quoteData["Global Quote"]
  return {
    ticker: ticker,
    currentPrice: Number(quote["05. price"]),
    change: Number(quote["09. change"]),
    changePercent: Number(quote["10. change percent"].replace("%", "")),
    industry: overviewData["Industry"] || "N/A",
    companyName: overviewData["Name"] || ticker,
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
    console.error("Error fetching stock info:", error)
    return NextResponse.json({ error: "Failed to fetch stock info" }, { status: 500 })
  }
}

