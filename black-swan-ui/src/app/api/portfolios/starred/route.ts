import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const starredPortfolio = await portfoliosCollection.findOne(
      { userId: session.user.id, isStarred: true },
      { projection: { _id: 1, name: 1 } },
    )

    if (!starredPortfolio) {
      return NextResponse.json({ error: "No starred portfolio found" }, { status: 404 })
    }

    return NextResponse.json(starredPortfolio)
  } catch (error) {
    console.error("Error fetching starred portfolio:", error)
    return NextResponse.json({ error: "Failed to fetch starred portfolio" }, { status: 500 })
  }
}

