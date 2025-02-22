import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.log("User not authenticated")
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const portfolios = await portfoliosCollection
      .find({ userId: session.user.id })
      .project({ name: 1, isStarred: 1, lastUpdated: 1 })
      .toArray()

    console.log(`Fetched ${portfolios.length} portfolios for user ${session.user.id}`)

    return NextResponse.json(portfolios)
  } catch (error) {
    console.error("Error fetching portfolios:", error)
    return NextResponse.json({ error: "Failed to fetch portfolios", details: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const { name, holdings } = await request.json()

    if (!name || !holdings || !Array.isArray(holdings)) {
      return NextResponse.json({ error: "Invalid portfolio data" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    // Calculate total value and percentages
    const totalValue = holdings.reduce((sum: number, holding: any) => {
      const value = holding.shares * holding.currentPrice
      return sum + (isNaN(value) ? 0 : value)
    }, 0)

    const holdingsWithPercentage = holdings.map((holding: any) => {
      const value = holding.shares * holding.currentPrice
      return {
        ...holding,
        value: value,
        percentOfPortfolio: totalValue > 0 ? ((value / totalValue) * 100).toFixed(2) : "0.00",
      }
    })

    const result = await portfoliosCollection.insertOne({
      userId: session.user.id,
      name,
      holdings: holdingsWithPercentage,
      isStarred: false,
      lastUpdated: new Date(),
    })

    return NextResponse.json({ id: result.insertedId, message: "Portfolio created successfully" })
  } catch (error) {
    console.error("Error creating portfolio:", error)
    return NextResponse.json({ error: "Failed to create portfolio", details: (error as Error).message }, { status: 500 })
  }
}

