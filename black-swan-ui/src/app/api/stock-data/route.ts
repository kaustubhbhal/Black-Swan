import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

async function fetchStockInfo(ticker: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`

  const response = await fetch(url)
  const data = await response.json()

  if (data["Error Message"]) {
    throw new Error(`Failed to fetch data for ${ticker}`)
  }

  const quote = data["Global Quote"]
  return {
    ticker: ticker,
    currentPrice: Number.parseFloat(quote["05. price"]),
    companyName: ticker, // Alpha Vantage doesn't provide company name in this endpoint
    industry: "Unknown", // We don't have industry information from this API
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  const { stocks } = await request.json()

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const portfolioData = await Promise.all(
      stocks.map(async (stock: { ticker: string; shares: number }) => {
        const stockInfo = await fetchStockInfo(stock.ticker)
        return {
          ...stockInfo,
          shares: stock.shares,
          value: stockInfo.currentPrice * stock.shares,
        }
      }),
    )

    const totalValue = portfolioData.reduce((sum, stock) => sum + stock.value, 0)
    const portfolioWithPercentages = portfolioData.map((stock) => ({
      ...stock,
      percentOfPortfolio: (stock.value / totalValue) * 100,
    }))

    const result = await portfoliosCollection.updateOne(
      { userId: session.user.id },
      {
        $set: {
          holdings: portfolioWithPercentages,
          lastUpdated: new Date(),
        },
      },
      { upsert: true },
    )

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      throw new Error("Failed to save portfolio")
    }

    return NextResponse.json({ message: "Portfolio saved successfully" })
  } catch (error) {
    console.error("Error saving portfolio data:", error)
    return NextResponse.json({ error: "Failed to save portfolio data" }, { status: 500 })
  }
}

