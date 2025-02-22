import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const portfolio = await portfoliosCollection.findOne({ userId: session.user.id })

    if (!portfolio) {
      return NextResponse.json({ holdings: [] })
    }

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error("Error fetching portfolio data:", error)
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 })
  }
}

